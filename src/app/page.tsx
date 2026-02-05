"use client";

import { useState } from 'react';
import { PromptTemplate } from '@/lib/types';
import TickerInput from '@/components/TickerInput';
import PromptSelector from '@/components/PromptSelector';
import GeneratedDisplay from '@/components/GeneratedDisplay';
import styles from '@/styles/components.module.css';

export default function Home() {
    const [tickers, setTickers] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

    const generatePrompt = () => {
        if (!selectedTemplate) return '';
        return selectedTemplate.content.replace(/{{TICKERS}}/g, tickers || '[TICKERS]');
    };

    const finalPrompt = generatePrompt();

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
            </div>
        </div>
    );
}
