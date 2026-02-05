"use client";

import { useState, useEffect } from 'react';
import { PromptTemplate, Category } from '@/lib/types';
import { getPrompts, getCategories } from '@/lib/storage';
import styles from '@/styles/components.module.css';

interface PromptSelectorProps {
    onSelect: (template: PromptTemplate) => void;
}

export default function PromptSelector({ onSelect }: PromptSelectorProps) {
    const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCat, setSelectedCat] = useState<string>('all');

    useEffect(() => {
        const loadData = async () => {
            const [promptsData, categoriesData] = await Promise.all([
                getPrompts(),
                getCategories()
            ]);
            setPrompts(promptsData);
            setCategories(categoriesData);
        };
        loadData();
    }, []);

    const filteredPrompts = selectedCat === 'all'
        ? prompts
        : prompts.filter(p => p.categoryId === selectedCat);

    return (
        <div className={styles.card}>
            <div className={styles.inputGroup}>
                <label className={styles.label}>Category</label>
                <select
                    className={styles.input}
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div className={styles.inputGroup}>
                <label className={styles.label}>Select Prompt Template</label>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {filteredPrompts.length === 0 ? (
                        <p style={{ color: '#666' }}>No prompts found in this category.</p>
                    ) : (
                        filteredPrompts.map(p => (
                            <button
                                key={p.id}
                                className={`${styles.button} ${styles.buttonSecondary}`}
                                style={{ justifyContent: 'flex-start', width: '100%', textAlign: 'left' }}
                                onClick={() => onSelect(p)}
                            >
                                {p.title}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
