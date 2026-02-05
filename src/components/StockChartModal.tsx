"use client";

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

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

interface StockChartModalProps {
    ticker: string;
    data: StockData;
    onClose: () => void;
}

export default function StockChartModal({ ticker, data, onClose }: StockChartModalProps) {
    const getHorizonStyle = (horizon: string) => {
        const h = horizon?.toLowerCase() || '';
        if (h.includes('14') || h.includes('bi')) return { color: '#f5a442', label: '14D' }; // Orange
        if (h.includes('month') || h.includes('30')) return { color: '#ff4444', label: '1M' }; // Red
        return { color: '#f5d142', label: '7D' }; // Yellow
    };

    const getChartData = () => {
        if (!data.history) return null;

        const history = data.history;
        const expected = data.expected_moves || [];
        const futureLabels = expected.map(e => e.date).sort();

        const labels = [
            ...history.map(d => d.date),
            ...futureLabels
        ];

        const priceData = [
            ...history.map(d => d.close),
            ...futureLabels.map(() => null)
        ];

        const datasets: any[] = [
            {
                label: 'Close Price',
                data: priceData,
                borderColor: '#00dc82',
                backgroundColor: 'rgba(0, 220, 130, 0.1)',
                fill: true,
                tension: 0.1,
                pointRadius: 0,
                borderWidth: 2,
            }
        ];

        expected.forEach(em => {
            const { color, label } = getHorizonStyle(em.horizon);
            const startIndex = Math.max(0, history.length - 5);

            const upperLine = labels.map((l, i) => i >= startIndex ? em.upper : null);
            const lowerLine = labels.map((l, i) => i >= startIndex ? em.lower : null);

            datasets.push({
                label: `${label} Upper ($${em.upper})`,
                data: upperLine,
                borderColor: color,
                borderDash: [5, 5],
                fill: false,
                tension: 0,
                pointRadius: 0,
                borderWidth: 2,
            });

            datasets.push({
                label: `${label} Lower ($${em.lower})`,
                data: lowerLine,
                borderColor: color,
                borderDash: [5, 5],
                fill: false,
                tension: 0,
                pointRadius: 0,
                borderWidth: 2,
            });
        });

        return { labels, datasets };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom' as const,
                labels: { color: '#888', font: { size: 10 }, usePointStyle: true, padding: 20 }
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: '#1a1a1a',
                titleColor: '#888',
                bodyColor: '#fff',
                borderColor: '#333',
                borderWidth: 1,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#666',
                    maxRotation: 45,
                    minRotation: 45,
                    font: { size: 9 },
                    autoSkip: true,
                    maxTicksLimit: 20
                }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#666', font: { size: 10 } }
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95vw', maxHeight: '95vh' }}>
                <div className="modal-header">
                    <div>
                        <h2 style={{ color: 'var(--primary)', margin: 0 }}>{ticker} - Volatility Analysis</h2>
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
                            Multi-Horizon Expected Moves (85% Straddle)
                        </p>
                    </div>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body" style={{ overflowY: 'auto', paddingBottom: '2rem' }}>
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        {/* Stats Summary */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                        }}>
                            <div>
                                <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Price</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${data.price}</div>
                            </div>
                            {data.expected_moves?.map(em => {
                                const { color, label } = getHorizonStyle(em.horizon);
                                return (
                                    <div key={em.horizon}>
                                        <div style={{ color: color, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                            {label} Expected Move
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                            ${em.lower} - ${em.upper}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#666' }}>IV: {em.iv}%</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Chart Container */}
                        <div style={{ height: '400px', width: '100%' }}>
                            {getChartData() && <Line data={getChartData()!} options={chartOptions} />}
                        </div>

                        {/* Expected Move Table */}
                        <div>
                            <h4 style={{ marginBottom: '1rem', color: '#888' }}>Horizon Details (Targeted Expirations)</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: '#666' }}>
                                        <th style={{ padding: '0.5rem' }}>Horizon</th>
                                        <th>Expiration</th>
                                        <th>Upper Bound</th>
                                        <th>Lower Bound</th>
                                        <th>ATM IV</th>
                                        <th>Straddle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.expected_moves?.map(em => (
                                        <tr key={em.horizon} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold', color: getHorizonStyle(em.horizon).color }}>
                                                {getHorizonStyle(em.horizon).label}
                                            </td>
                                            <td>{em.date}</td>
                                            <td>${em.upper}</td>
                                            <td>${em.lower}</td>
                                            <td>{em.iv}%</td>
                                            <td>${em.straddle}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
