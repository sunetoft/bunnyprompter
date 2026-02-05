"use client";

import { useState, useEffect, useCallback } from 'react';
import { Theme } from '@/lib/types';
import styles from '@/styles/components.module.css';
import StockChartModal from '@/components/StockChartModal';

interface ExpectedMove {
    horizon: string;
    date: string;
    upper: number;
    lower: number;
    iv?: number;
    straddle?: number;
}

interface StockData {
    ticker: string;
    price: number;
    daily_change: number;
    weekly_change: number;
    dist_ema21: number;
    dist_sma50: number;
    history?: { date: string; close: number }[];
    expected_moves?: ExpectedMove[];
    error?: string;
}

export default function ThemesPage() {
    const [themes, setThemes] = useState<Theme[]>([]);
    const [availableTickers, setAvailableTickers] = useState<string[]>([]);
    const [stockData, setStockData] = useState<Record<string, StockData>>({});
    const [loadingTickers, setLoadingTickers] = useState(true);
    const [loadingStocks, setLoadingStocks] = useState(false);

    // Modal state
    const [chartTicker, setChartTicker] = useState<string | null>(null);

    // Form states
    const [isCreating, setIsCreating] = useState(false);
    const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [selectedTickers, setSelectedTickers] = useState<string[]>([]);

    const fetchStockData = useCallback(async (tickers: string[], refresh = false) => {
        if (tickers.length === 0) return;
        setLoadingStocks(true);
        try {
            const res = await fetch('/api/stock-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tickers, refresh })
            });
            const data = await res.json();
            setStockData(prev => ({ ...prev, ...data }));
        } catch (err) {
            console.error('Failed to fetch stock data', err);
        } finally {
            setLoadingStocks(false);
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            const themesRes = await fetch('/api/themes');
            const loadedThemes = await themesRes.json();
            setThemes(loadedThemes);
            fetchTickers();

            // Initial fetch for all tickers in themes
            const allTickers: string[] = Array.from(new Set(loadedThemes.flatMap((t: any) => t.tickers as string[])));
            if (allTickers.length > 0) {
                fetchStockData(allTickers);
            }
        };
        loadInitialData();
    }, [fetchStockData]);

    const fetchTickers = async () => {
        try {
            const res = await fetch('/api/analysis-files');
            const data = await res.json();
            if (data.files) setAvailableTickers(data.files);
        } catch (err) {
            console.error('Failed to fetch tickers', err);
        } finally {
            setLoadingTickers(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle) {
            alert('Giv venligst temaet en titel.');
            return;
        }
        const theme: Theme = {
            id: Date.now().toString(),
            title: newTitle,
            tickers: selectedTickers
        };

        await fetch('/api/themes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(theme)
        });

        const updated = [...themes, theme];
        setThemes(updated);
        resetForm();
        fetchStockData(selectedTickers);
    };

    const handleUpdate = async () => {
        if (!editingTheme || !newTitle) return;
        const theme = { ...editingTheme, title: newTitle, tickers: selectedTickers };

        await fetch('/api/themes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(theme)
        });

        const updated = themes.map(t =>
            t.id === editingTheme.id ? theme : t
        );
        setThemes(updated);
        resetForm();
        fetchStockData(selectedTickers);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Vil du slette dette tema?')) {
            await fetch(`/api/themes?id=${id}`, { method: 'DELETE' });
            const updated = themes.filter(t => t.id !== id);
            setThemes(updated);
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingTheme(null);
        setNewTitle('');
        setSelectedTickers([]);
    };

    const toggleTicker = (ticker: string) => {
        setSelectedTickers(prev =>
            prev.includes(ticker)
                ? prev.filter(t => t !== ticker)
                : [...prev, ticker]
        );
    };

    const startEdit = (theme: Theme) => {
        setEditingTheme(theme);
        setNewTitle(theme.title);
        setSelectedTickers(theme.tickers);
        setIsCreating(true);
    };

    const handleReload = () => {
        const allTickers = Array.from(new Set(themes.flatMap(t => t.tickers)));
        if (allTickers.length > 0) {
            fetchStockData(allTickers, true);
        }
    };

    const ColorValue = ({ value, suffix = '%' }: { value: number, suffix?: string }) => {
        const color = value > 0 ? '#00dc82' : value < 0 ? '#ff4444' : '#888';
        return <span style={{ color, fontWeight: 'bold' }}>{value > 0 ? '+' : ''}{value}{suffix}</span>;
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--primary)', margin: 0 }}>Themes</h1>
                    <p style={{ color: '#666' }}>Gruppér og overvåg dine aktier med real-tids data og Expected Move</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={styles.buttonSecondary}
                        onClick={handleReload}
                        disabled={loadingStocks}
                        title="Reload Cache"
                        style={{ padding: '0.5rem' }}
                    >
                        {loadingStocks ? '⌛' : '🔄'}
                    </button>
                    {!isCreating && (
                        <button className={styles.button} onClick={() => setIsCreating(true)}>
                            + Nyt Tema
                        </button>
                    )}
                </div>
            </header>

            {isCreating && (
                <div className={styles.card} style={{ marginBottom: '2rem', borderColor: 'var(--primary)' }}>
                    <h3 className={styles.label}>{editingTheme ? 'Redigér Tema' : 'Opret Nyt Tema'}</h3>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label className={styles.label}>Tema Titel</label>
                            <input
                                className={styles.input}
                                placeholder="F.eks. AI Aktier eller High Dividend"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className={styles.label}>Vælg Tickers (fra st-analysis)</label>
                            {loadingTickers ? (
                                <p>Henter tickers...</p>
                            ) : availableTickers.length === 0 ? (
                                <p style={{ color: '#888', fontSize: '0.9rem' }}>Ingen gemte analyser fundet. Gem nogle analyser først!</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {availableTickers.map(ticker => (
                                        <label key={ticker} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            background: selectedTickers.includes(ticker) ? 'rgba(0, 220, 130, 0.1)' : 'var(--input-bg)',
                                            padding: '0.5rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            border: `1px solid ${selectedTickers.includes(ticker) ? 'var(--primary)' : 'var(--border)'}`
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedTickers.includes(ticker)}
                                                onChange={() => toggleTicker(ticker)}
                                            />
                                            {ticker}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className={styles.button} style={{ flex: 1 }} onClick={editingTheme ? handleUpdate : handleCreate}>
                                {editingTheme ? 'Opdatér Tema' : 'Gem Tema'}
                            </button>
                            <button className={styles.buttonSecondary} onClick={resetForm}>
                                Annuller
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {themes.length === 0 && !isCreating && (
                    <div className={styles.card} style={{ textAlign: 'center', padding: '4rem', opacity: 0.5, borderStyle: 'dashed' }}>
                        <p>Du har ingen temaer endnu. Opret et for at komme i gang!</p>
                    </div>
                )}

                {themes.map(theme => (
                    <div key={theme.id} className={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.5rem' }}>{theme.title}</h3>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => startEdit(theme)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>✏️</button>
                                <button onClick={() => handleDelete(theme.id)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                            </div>
                        </div>

                        {theme.tickers.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: '#888', fontSize: '0.85rem' }}>
                                            <th style={{ padding: '0.75rem 0' }}>Ticker</th>
                                            <th>Price</th>
                                            <th>Daily Chg</th>
                                            <th>Weekly Chg</th>
                                            <th>Dist. EMA21</th>
                                            <th>Dist. SMA50</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {theme.tickers.map(ticker => {
                                            const data = stockData[ticker];
                                            if (!data) return (
                                                <tr key={ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{ticker}</td>
                                                    <td colSpan={5} style={{ color: '#555', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                        {loadingStocks ? 'Indlæser...' : 'Data ikke fundet'}
                                                    </td>
                                                </tr>
                                            );
                                            if (data.error) return (
                                                <tr key={ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{ticker}</td>
                                                    <td colSpan={5} style={{ color: '#ff4444', fontSize: '0.8rem' }}>Error: {data.error}</td>
                                                </tr>
                                            );
                                            return (
                                                <tr key={ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }}>
                                                    <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>
                                                        <button
                                                            onClick={() => setChartTicker(ticker)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'var(--primary)',
                                                                fontWeight: 'bold',
                                                                padding: 0,
                                                                cursor: 'pointer',
                                                                textDecoration: 'underline'
                                                            }}
                                                        >
                                                            {ticker}
                                                        </button>
                                                    </td>
                                                    <td>${data.price}</td>
                                                    <td><ColorValue value={data.daily_change} /></td>
                                                    <td><ColorValue value={data.weekly_change} /></td>
                                                    <td><ColorValue value={data.dist_ema21} /></td>
                                                    <td><ColorValue value={data.dist_sma50} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: '#555', fontStyle: 'italic' }}>Ingen tickers tilføjet til dette tema.</p>
                        )}

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <a
                                href={`/compare?theme=${theme.id}`}
                                className={styles.buttonSecondary}
                                style={{ fontSize: '0.85rem', textDecoration: 'none' }}
                            >
                                Compare Theme Tickers ⚖️
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Shared Chart Modal */}
            {chartTicker && stockData[chartTicker] && (
                <StockChartModal
                    ticker={chartTicker}
                    data={stockData[chartTicker] as any}
                    onClose={() => setChartTicker(null)}
                />
            )}
        </div>
    );
}
