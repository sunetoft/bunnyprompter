"use client";

import { useState, useEffect, useCallback } from 'react';
import styles from '@/styles/components.module.css';
import StockChartModal from '@/components/StockChartModal';

interface CSPOpportunity {
    dte: number;
    tag: 'blue' | 'purple' | 'green';
    strike: number;
    premium: number;
    roi_daily: number;
    date: string;
    horizon?: string;
}

interface StockData {
    ticker: string;
    price: number;
    daily_change: number;
    gap_p: number;
    csp_opportunities?: CSPOpportunity[];
    updated_at?: number;
    error?: string;
}

export default function TradesPage() {
    const [stockData, setStockData] = useState<Record<string, StockData>>({});
    const [analyzedTickers, setAnalyzedTickers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [cspLoading, setCspLoading] = useState<Record<string, boolean>>({});
    const [chartTicker, setChartTicker] = useState<string | null>(null);

    const fetchStockData = useCallback(async (tickers: string[], includeCSP: boolean = false, refresh: boolean = false) => {
        if (tickers.length === 0) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch('/api/stock-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tickers, includeCSP, refresh })
            });
            const data = await res.json();
            setStockData(prev => ({ ...prev, ...data }));
        } catch (err) {
            console.error('Failed to fetch trades data', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const findContracts = async (ticker: string, refresh: boolean = false) => {
        setCspLoading(prev => ({ ...prev, [ticker]: true }));
        try {
            await fetchStockData([ticker], true, refresh);
        } finally {
            setCspLoading(prev => ({ ...prev, [ticker]: false }));
        }
    };

    useEffect(() => {
        const fetchAnalyzedFiles = async () => {
            try {
                const res = await fetch('/api/analysis-files');
                const data = await res.json();
                if (data.files) {
                    setAnalyzedTickers(data.files);
                    fetchStockData(data.files, false); // Basic data first
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to fetch analysis files', err);
                setLoading(false);
            }
        };
        fetchAnalyzedFiles();
    }, [fetchStockData]);

    const ColorValue = ({ value, suffix = '%' }: { value: number, suffix?: string }) => {
        const color = value > 0 ? '#00dc82' : value < 0 ? '#ff4444' : '#888';
        return <span style={{ color, fontWeight: 'bold' }}>{value > 0 ? '+' : ''}{value}{suffix}</span>;
    };

    const StatusTag = ({ tag }: { tag: CSPOpportunity['tag'] }) => {
        const colors = {
            blue: '#3b82f6',
            purple: '#a855f7',
            green: '#22c55e'
        };
        return (
            <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: colors[tag],
                display: 'inline-block',
                marginRight: '6px',
                boxShadow: `0 0 8px ${colors[tag]}`
            }} />
        );
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--primary)', margin: 0 }}>Trades</h1>
                <p style={{ color: '#666' }}>Scanning analyzed stocks for Cash Secured Put (CSP) opportunities at low levels.</p>
            </header>

            <div className={styles.card}>
                {loading && Object.keys(stockData).length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div className={styles.label}>Loading stock data...</div>
                    </div>
                ) : analyzedTickers.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                        <p>No analyzed stocks found. Analyze some stocks first to see trade opportunities here.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: '#888', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '1rem' }}>Ticker</th>
                                    <th>Last Price</th>
                                    <th>Daily Change</th>
                                    <th>Gap Up/Down %</th>
                                    <th>CSP Opportunities</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyzedTickers.map(ticker => {
                                    const data = stockData[ticker];
                                    if (!data) return (
                                        <tr key={ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{ticker}</td>
                                            <td colSpan={4} style={{ color: '#444', fontSize: '0.8rem' }}>Loading ticker info...</td>
                                        </tr>
                                    );

                                    if (data.error) return (
                                        <tr key={ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{ticker}</td>
                                            <td colSpan={4} style={{ color: '#ff4444', fontSize: '0.8rem' }}>Error: {data.error}</td>
                                        </tr>
                                    );

                                    const opportunities = data.csp_opportunities || [];
                                    const isCspLoading = cspLoading[ticker];

                                    return (
                                        <tr key={ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>
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
                                                {data.updated_at && (
                                                    <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'normal', marginTop: '4px' }}>
                                                        {new Date(data.updated_at).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </td>
                                            <td>${data.price}</td>
                                            <td><ColorValue value={data.daily_change} /></td>
                                            <td><ColorValue value={data.gap_p} /></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    {isCspLoading ? (
                                                        <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontStyle: 'italic' }}>Scanning chains...</span>
                                                    ) : (
                                                        <>
                                                            {opportunities.length === 0 ? (
                                                                <button
                                                                    onClick={() => findContracts(ticker)}
                                                                    className={styles.button}
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        fontSize: '0.7rem',
                                                                        background: 'rgba(56, 189, 248, 0.1)',
                                                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                                                        color: '#38bdf8'
                                                                    }}
                                                                >
                                                                    Find Contracts
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    {opportunities.map((opp, idx) => (
                                                                        <div key={idx} title={`CSP: Strike $${opp.strike} for $${opp.premium} (${opp.roi_daily}% ROI/day) Exp: ${opp.date}`} style={{ display: 'flex', alignItems: 'center' }}>
                                                                            <StatusTag tag={opp.tag} />
                                                                            <span style={{ fontSize: '0.75rem', color: '#888', marginRight: '4px' }}>{opp.dte}d</span>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => findContracts(ticker, true)}
                                                                        title="Refresh contracts"
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            padding: '4px',
                                                                            color: '#666',
                                                                            opacity: 0.6
                                                                        }}
                                                                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                                                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                                                                    >
                                                                        ↺
                                                                    </button>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reuse Chart Modal */}
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
