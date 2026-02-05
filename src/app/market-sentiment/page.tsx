"use client";

import { useState, useEffect } from 'react';
import styles from '@/styles/components.module.css';
import { getApiKey } from '@/lib/storage';

interface PerformantStock {
    ticker: string;
    price: number;
    change_p: number;
}

interface SentimentData {
    fear_greed?: { score: number; rating: string };
    btc?: { price: number; change_p: number };
    socialSentiment?: { rank: number; summary: string };
    performers?: { gainers: PerformantStock[]; losers: PerformantStock[] };
    error?: string;
}

export default function MarketSentimentPage() {
    const [data, setData] = useState<SentimentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const geminiApiKey = getApiKey();
                const res = await fetch('/api/market-sentiment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ geminiApiKey })
                });
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err) {
                console.error('Failed to fetch sentiment data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const ColorValue = ({ value, suffix = '%' }: { value: number, suffix?: string }) => {
        const color = value > 0 ? '#00dc82' : value < 0 ? '#ff4444' : '#888';
        return <span style={{ color, fontWeight: 'bold' }}>{value > 0 ? '+' : ''}{value}{suffix}</span>;
    };

    const getRankColor = (rank: number) => {
        if (rank >= 7) return '#00dc82';
        if (rank <= 3) return '#ff4444';
        return '#f5d142';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className={styles.label}>Analyzing market signals and social sentiment...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--primary)', margin: 0 }}>Market Sentiment</h1>
                <p style={{ color: '#666' }}>Cross-platform signals and portfolio-relative performance.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* 1. Fear & Greed */}
                <div className={styles.card} style={{ position: 'relative', overflow: 'hidden' }}>
                    <div className={styles.label}>CNN Fear & Greed</div>
                    {data?.fear_greed ? (
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>{data.fear_greed.score}</div>
                            <div style={{ fontSize: '1.2rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>{data.fear_greed.rating}</div>
                            <div style={{ marginTop: '1rem', width: '100%', height: '8px', background: 'linear-gradient(to right, #ff4444, #f5d142, #00dc82)', borderRadius: '4px' }}>
                                <div style={{
                                    width: '4px',
                                    height: '16px',
                                    background: '#fff',
                                    position: 'absolute',
                                    left: `${data.fear_greed.score}%`,
                                    top: '72%',
                                    transform: 'translateX(-50%)',
                                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                    borderRadius: '2px'
                                }} />
                            </div>
                        </div>
                    ) : <p>Data unavailable</p>}
                </div>

                {/* 2. Key Indicators: BTC */}
                <div className={styles.card}>
                    <div className={styles.label}>Key Indicators (BTCUSD)</div>
                    {data?.btc ? (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${data.btc.price.toLocaleString()}</div>
                            <div style={{ fontSize: '1.1rem' }}>
                                <ColorValue value={data.btc.change_p} /> <span style={{ color: '#666', fontSize: '0.9rem' }}>(24h)</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '1rem' }}>Bitcoin serves as a leading liquidity indicator for risk-on assets.</p>
                        </div>
                    ) : <p>Data unavailable</p>}
                </div>

                {/* 3. Social Sentiment (Gemini) */}
                <div className={styles.card} style={{ borderLeft: `4px solid ${getRankColor(data?.socialSentiment?.rank || 5)}` }}>
                    <div className={styles.label}>Social Sentiment (AI Rank)</div>
                    {data?.socialSentiment ? (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    fontSize: '2.5rem',
                                    fontWeight: 'bold',
                                    color: getRankColor(data.socialSentiment.rank)
                                }}>{data.socialSentiment.rank}/10</div>
                                <div style={{ color: '#888', fontSize: '0.9rem' }}>Aggregate X, Reddit, Poly</div>
                            </div>
                            <div style={{ marginTop: '1rem', fontStyle: 'italic', color: '#aaa', fontSize: '0.95rem', lineHeight: '1.4' }}>
                                "{data.socialSentiment.summary}"
                            </div>
                        </div>
                    ) : <p>Analyzing social signals...</p>}
                </div>

                {/* 4. Gainers */}
                <div className={styles.card}>
                    <div className={styles.label}>Portfolio Gainers (Today)</div>
                    <div style={{ marginTop: '1rem' }}>
                        {data?.performers?.gainers.length ? data.performers.gainers.map(s => (
                            <div key={s.ticker} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontWeight: 'bold' }}>{s.ticker}</span>
                                <div>
                                    <span style={{ marginRight: '10px', color: '#888' }}>${s.price}</span>
                                    <ColorValue value={s.change_p} />
                                </div>
                            </div>
                        )) : <p style={{ color: '#444', fontSize: '0.9rem' }}>No significant gainers in analyzed portfolio.</p>}
                    </div>
                </div>

                {/* 5. Losers */}
                <div className={styles.card}>
                    <div className={styles.label}>Portfolio Losers (Today)</div>
                    <div style={{ marginTop: '1rem' }}>
                        {data?.performers?.losers.length ? data.performers.losers.map(s => (
                            <div key={s.ticker} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ fontWeight: 'bold' }}>{s.ticker}</span>
                                <div>
                                    <span style={{ marginRight: '10px', color: '#888' }}>${s.price}</span>
                                    <ColorValue value={s.change_p} />
                                </div>
                            </div>
                        )) : <p style={{ color: '#444', fontSize: '0.9rem' }}>No significant losers in analyzed portfolio.</p>}
                    </div>
                </div>

            </div>

            <footer style={{ marginTop: '3rem', fontSize: '0.8rem', color: '#444', textAlign: 'center' }}>
                Data provided by CNN Markets, Yahoo Finance, and analysis by Gemini AI 1.5.
            </footer>
        </div>
    );
}
