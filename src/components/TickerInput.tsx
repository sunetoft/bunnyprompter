"use client";

import { useEffect, useState } from 'react';
import styles from '@/styles/components.module.css';

interface TickerInputProps {
    onTickersChange: (tickers: string) => void;
}

export default function TickerInput({ onTickersChange }: TickerInputProps) {
    const [value, setValue] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setValue(val);
        onTickersChange(val);
    };

    return (
        <div className={styles.card}>
            <div className={styles.inputGroup}>
                <label className={styles.label}>Stock Tickers</label>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. AAPL, MSFT, GOOGL"
                    value={value}
                    onChange={handleChange}
                />
                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                    Enter comma separated symbols
                </p>
            </div>
        </div>
    );
}
