"use client";

import { useState, useEffect } from 'react';
import { getComparePrompts, getApiKey } from '@/lib/storage';
import { ComparePrompt } from '@/lib/types';
import { runGeminiAnalysis } from '@/lib/gemini';
import styles from '@/styles/components.module.css';

export default function ComparePage() {
    const [availableFiles, setAvailableFiles] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [prompts, setPrompts] = useState<ComparePrompt[]>([]);
    const [selectedPromptId, setSelectedPromptId] = useState('');
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    // Modal state
    const [previewTicker, setPreviewTicker] = useState<string | null>(null);
    const [previewContent, setPreviewContent] = useState('');
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            fetchFiles();
            const prompts = await getComparePrompts();
            setPrompts(prompts);
        };
        loadData();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await fetch('/api/analysis-files');
            const data = await res.json();
            if (data.files) setAvailableFiles(data.files);
        } catch (err) {
            console.error('Failed to fetch files', err);
        } finally {
            setLoadingFiles(false);
        }
    };

    const toggleTicker = (ticker: string) => {
        setSelectedFiles(prev =>
            prev.includes(ticker)
                ? prev.filter(t => t !== ticker)
                : [...prev, ticker]
        );
    };

    const handleCompare = async () => {
        if (selectedFiles.length < 2) {
            alert('Vælg mindst 2 tickers at sammenligne.');
            return;
        }
        if (!selectedPromptId) {
            alert('Vælg et sammenlignings-prompt.');
            return;
        }

        setIsAnalyzing(true);
        setError('');
        setResult('');

        try {
            // 1. Get contents of selected files
            const res = await fetch('/api/analysis-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tickers: selectedFiles })
            });
            const data = await res.json();

            // 2. Build final prompt
            const activePrompt = prompts.find(p => p.id === selectedPromptId);
            let combinedContent = "Her er eksisterende analyser for de valgte tickers:\n\n";

            for (const ticker of selectedFiles) {
                combinedContent += `--- START ANALYSE FOR ${ticker} ---\n`;
                combinedContent += data.contents[ticker] + "\n";
                combinedContent += `--- SLUT ANALYSE FOR ${ticker} ---\n\n`;
            }

            const finalPrompt = `${activePrompt?.content}\n\n${combinedContent}`;

            // 3. Run Gemini
            const text = await runGeminiAnalysis(finalPrompt);
            setResult(text);
        } catch (err: any) {
            setError(err.message || 'Sammenligning fejlede');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handlePreview = async (e: React.MouseEvent, ticker: string) => {
        e.preventDefault();
        e.stopPropagation();
        setPreviewTicker(ticker);
        setLoadingPreview(true);
        setPreviewContent('');

        try {
            const res = await fetch('/api/analysis-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tickers: [ticker] })
            });
            const data = await res.json();
            setPreviewContent(data.contents[ticker]);
        } catch (err) {
            setPreviewContent('Kunne ikke hente filindhold.');
        } finally {
            setLoadingPreview(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--primary)' }}>Compare Analyses</h1>
                <p style={{ color: '#666' }}>Sammenlign data fra dine gemte .md filer</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left side: Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className={styles.card}>
                        <h3 className={styles.label}>1. Vælg Tickers</h3>
                        {loadingFiles ? (
                            <p>Indlæser gemte filer...</p>
                        ) : availableFiles.length === 0 ? (
                            <p style={{ color: '#666' }}>Ingen gemte analyser fundet. Gem nogle analyser først!</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                                {availableFiles.map(file => (
                                    <label key={file} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: selectedFiles.includes(file) ? 'rgba(0, 220, 130, 0.1)' : 'var(--input-bg)',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        border: `1px solid ${selectedFiles.includes(file) ? 'var(--primary)' : 'var(--border)'}`
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedFiles.includes(file)}
                                            onChange={() => toggleTicker(file)}
                                        />
                                        <span style={{ flex: 1 }}>{file}</span>
                                        <button
                                            className="preview-link"
                                            title="Vis analyse"
                                            onClick={(e) => handlePreview(e, file)}
                                            style={{ background: 'none', border: 'none' }}
                                        >
                                            🔗
                                        </button>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.label}>2. Vælg Sammenlignings-prompt</h3>
                        <select
                            className={styles.input}
                            value={selectedPromptId}
                            onChange={(e) => setSelectedPromptId(e.target.value)}
                        >
                            <option value="">Vælg et prompt...</option>
                            {prompts.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        {selectedPromptId && (
                            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
                                "{prompts.find(p => p.id === selectedPromptId)?.content}"
                            </div>
                        )}
                    </div>

                    <button
                        className={styles.button}
                        onClick={handleCompare}
                        disabled={isAnalyzing || selectedFiles.length < 2 || !selectedPromptId}
                    >
                        {isAnalyzing ? 'Analyserer...' : 'Kør Sammenligning'}
                    </button>
                </div>

                {/* Right side: Result */}
                <div>
                    {isAnalyzing && (
                        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
                            <div className="loader" style={{ margin: '0 auto 1rem' }}></div>
                            <p>Gemini sammenligner dine tickers...</p>
                        </div>
                    )}

                    {error && (
                        <div className={styles.card} style={{ borderColor: '#ff4444', color: '#ff4444' }}>
                            <strong>Fejl:</strong> {error}
                        </div>
                    )}

                    {result && (
                        <div className={styles.card} style={{ borderColor: 'var(--primary)' }}>
                            <h3 className={styles.label}>Sammenlignings Resultat</h3>
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#efefef' }}>
                                {result}
                            </div>
                        </div>
                    )}

                    {!isAnalyzing && !result && !error && (
                        <div className={styles.card} style={{ opacity: 0.5, textAlign: 'center', padding: '3rem', borderStyle: 'dashed' }}>
                            Vælg tickers og prompt for at se sammenligningen her.
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .loader {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255,255,255,0.1);
                    border-top-color: var(--primary);
                    borderRadius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Preview Modal */}
            {previewTicker && (
                <div className="modal-overlay" onClick={() => setPreviewTicker(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ color: 'var(--primary)', margin: 0 }}>Analyse: {previewTicker}</h2>
                            <button className="close-button" onClick={() => setPreviewTicker(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {loadingPreview ? (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <div className="loader" style={{ margin: '0 auto' }}></div>
                                    <p>Henter fil...</p>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.95rem' }}>
                                    {previewContent}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
