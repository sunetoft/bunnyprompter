"use client";

import { useState } from 'react';
import { runGeminiAnalysis } from '@/lib/gemini';
import styles from '@/styles/components.module.css';

interface GeminiAnalyzerProps {
    prompt: string;
    tickers: string; // Original comma-separated tickers
}

export default function GeminiAnalyzer({ prompt, tickers }: GeminiAnalyzerProps) {
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');

    // Ticker selection state for saving
    const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
    const [showSelection, setShowSelection] = useState(false);

    const tickerList = tickers.split(',')
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0);

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        setResponse('');
        setSaveSuccess('');
        try {
            const text = await runGeminiAnalysis(prompt);
            setResponse(text);
            // Default to selecting all tickers if only a few
            setSelectedTickers(tickerList);
        } catch (err: any) {
            setError(err.message || "Failed to run analysis");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (selectedTickers.length === 0) {
            alert('Vælg mindst én ticker at gemme til.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/save-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tickers: selectedTickers,
                    content: response
                })
            });

            const data = await res.json();
            if (data.success) {
                setSaveSuccess(`Gemt i: ${data.savedFiles.join(', ')}`);
                setShowSelection(false);
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setError('Kunne ikke gemme fil: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleTicker = (ticker: string) => {
        setSelectedTickers(prev =>
            prev.includes(ticker)
                ? prev.filter(t => t !== ticker)
                : [...prev, ticker]
        );
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            {!response && !loading && (
                <button
                    className={styles.button}
                    onClick={handleAnalyze}
                    style={{ width: '100%', background: '#4285F4' }}
                >
                    Analyze with Gemini AI
                </button>
            )}

            {loading && (
                <div className={styles.card} style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                        width: '30px',
                        height: '30px',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p>Gemini is analyzing...</p>
                    <style jsx>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            {error && (
                <div className={styles.card} style={{ borderColor: '#ff4444', color: '#ff4444', fontSize: '0.9rem' }}>
                    <strong>Fejl:</strong> {error}
                </div>
            )}

            {response && (
                <div className={styles.card} style={{ borderColor: '#4285F4' }}>
                    <label className={styles.label} style={{ color: '#4285F4' }}>Gemini Analysis Result</label>
                    <div
                        style={{
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                            color: '#efefef',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            marginBottom: '1rem'
                        }}
                    >
                        {response}
                    </div>

                    {!showSelection && !saveSuccess && (
                        <button
                            className={styles.button}
                            onClick={() => setShowSelection(true)}
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                        >
                            Gem til MarkDown fil (.md)
                        </button>
                    )}

                    {showSelection && (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Vælg tickers der skal opdateres:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                {tickerList.map(ticker => (
                                    <label key={ticker} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--input-bg)', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedTickers.includes(ticker)}
                                            onChange={() => toggleTicker(ticker)}
                                        />
                                        {ticker}
                                    </label>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className={styles.button} onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                                    {saving ? 'Gemmer...' : 'Bekræft & Gem'}
                                </button>
                                <button className={styles.buttonSecondary} onClick={() => setShowSelection(false)}>
                                    Annuller
                                </button>
                            </div>
                        </div>
                    )}

                    {saveSuccess && (
                        <div style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
                            ✓ {saveSuccess}
                        </div>
                    )}

                    <button
                        className={styles.buttonSecondary}
                        style={{ width: '100%' }}
                        onClick={() => { setResponse(''); setSaveSuccess(''); setShowSelection(false); }}
                    >
                        Ryd Resultat
                    </button>
                </div>
            )}
        </div>
    );
}
