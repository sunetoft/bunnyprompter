"use client";

import { useState } from 'react';
import styles from '@/styles/components.module.css';
import GeminiAnalyzer from './GeminiAnalyzer';

interface GeneratedDisplayProps {
    content: string;
    tickers: string;
}

export default function GeneratedDisplay({ content, tickers }: GeneratedDisplayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!content) return null;

    return (
        <div className={styles.card} style={{ borderColor: 'var(--primary)' }}>
            <label className={styles.label} style={{ color: 'var(--primary)' }}>Generated Prompt</label>
            <div
                style={{
                    background: '#000',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    marginBottom: '1rem',
                    whiteSpace: 'pre-wrap'
                }}
            >
                {content}
            </div>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
                <button className={styles.button} onClick={handleCopy} style={{ width: '100%' }}>
                    {copied ? 'Copied to Clipboard!' : 'Copy Prompt'}
                </button>

                <GeminiAnalyzer prompt={content} tickers={tickers} />
            </div>
        </div>
    );
}
