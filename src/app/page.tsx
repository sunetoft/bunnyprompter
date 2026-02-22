"use client";

import { useState, useEffect } from 'react';
import { PromptTemplate } from '@/lib/types';
import TickerInput from '@/components/TickerInput';
import PromptSelector from '@/components/PromptSelector';
import GeneratedDisplay from '@/components/GeneratedDisplay';
import styles from '@/styles/components.module.css';
import AnalysisViewer from '@/components/AnalysisViewer';

export default function Home() {
    const [tickers, setTickers] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [selectedHistoryTicker, setSelectedHistoryTicker] = useState<string | null>(null);
    const [selectedHistoryContent, setSelectedHistoryContent] = useState<string>('');
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/analysis-files');
                const data = await res.json();
                if (data.files) {
                    setHistory(data.files);
                }
            } catch (err) {
                console.error('Failed to fetch history', err);
            }
        };
        fetchHistory();
    }, []);

    const fetchHistoryContent = async (ticker: string) => {
        setLoadingHistory(true);
        setSelectedHistoryTicker(ticker);
        try {
            const res = await fetch('/api/analysis-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tickers: [ticker] })
            });
            const data = await res.json();
            setSelectedHistoryContent(data.contents[ticker] || '');
        } catch (err) {
            console.error('Failed to fetch history content', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const generatePrompt = () => {
        if (!selectedTemplate) return '';
        return selectedTemplate.content.replace(/{{TICKERS}}/g, tickers || '[TICKERS]');
    };

    const finalPrompt = generatePrompt();

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--primary)' }}>Analysis</h1>
                <p style={{ color: '#666' }}>Generer analyser til dine yndlingsaktier</p>
            </header>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                <TickerInput onTickersChange={setTickers} />

                <PromptSelector onSelect={setSelectedTemplate} />

                {selectedTemplate && (
                    <div className={styles.card} style={{ opacity: 0.8, fontSize: '0.9rem', borderStyle: 'dashed' }}>
                        <label className={styles.label}>Template Preview</label>
                        <div style={{ color: '#888', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                            Base structure of "{selectedTemplate.title}"
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', color: '#aaa', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            {selectedTemplate.content}
                        </div>
                    </div>
                )}

                {selectedTemplate && (
                    <GeneratedDisplay content={finalPrompt} tickers={tickers} />
                )}

                {history.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>Latest Analysis History</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {history.map(ticker => (
                                <button
                                    key={ticker}
                                    className={styles.buttonSecondary}
                                    style={{
                                        borderColor: selectedHistoryTicker === ticker ? 'var(--primary)' : 'var(--border)',
                                        background: selectedHistoryTicker === ticker ? 'rgba(0, 220, 130, 0.1)' : 'transparent'
                                    }}
                                    onClick={() => fetchHistoryContent(ticker)}
                                >
                                    {ticker}
                                </button>
                            ))}
                        </div>

                        {selectedHistoryTicker && (
                            <div className={styles.card} style={{ borderColor: 'var(--primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0 }}>Archive: {selectedHistoryTicker}</h3>
                                    <button
                                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                                        onClick={() => setSelectedHistoryTicker(null)}
                                    >
                                        Close Archive
                                    </button>
                                </div>
                                {loadingHistory ? (
                                    <p>Loading archive...</p>
                                ) : (
                                    <AnalysisViewer xmlContent={selectedHistoryContent} />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
