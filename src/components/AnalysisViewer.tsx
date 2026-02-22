"use client";

import { useEffect, useState } from 'react';
import styles from '@/styles/components.module.css';

interface AnalysisEntry {
    timestamp: string;
    content: string;
}

interface AnalysisViewerProps {
    xmlContent: string;
}

export default function AnalysisViewer({ xmlContent }: AnalysisViewerProps) {
    const [entries, setEntries] = useState<AnalysisEntry[]>([]);

    useEffect(() => {
        if (!xmlContent) return;

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
            const entryNodes = xmlDoc.getElementsByTagName("entry");

            const pEntries: AnalysisEntry[] = [];
            for (let i = 0; i < entryNodes.length; i++) {
                const node = entryNodes[i];
                const timestamp = node.getElementsByTagName("timestamp")[0]?.textContent || "";
                const content = node.getElementsByTagName("content")[0]?.textContent || "";
                pEntries.push({ timestamp, content });
            }
            setEntries(pEntries);
        } catch (err) {
            console.error("Failed to parse XML analysis", err);
        }
    }, [xmlContent]);

    if (entries.length === 0) {
        return <div className={styles.card}>Ingen analyse fundet eller dårligt format.</div>;
    }

    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {entries.map((entry, idx) => (
                <div key={idx} className={styles.card} style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Analysis Entry</span>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{entry.timestamp}</span>
                    </div>
                    <div
                        className="analysis-html-content"
                        style={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.6',
                            color: '#efefef'
                        }}
                    >
                        {/* 
                            For now, we render the text content. 
                            If it contains HTML as specified by the user in the future, 
                            we can use dangerouslySetInnerHTML after sanitization.
                        */}
                        {entry.content}
                    </div>
                </div>
            ))}
        </div>
    );
}
