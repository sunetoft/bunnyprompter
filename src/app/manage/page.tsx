"use client";

import { useState, useEffect } from 'react';
import { PromptTemplate, Category, ComparePrompt } from '@/lib/types';
import { getPrompts, savePrompts, getCategories, addCategory, deleteCategory, getApiKey, saveApiKey, getComparePrompts, saveComparePrompts } from '@/lib/storage';
import styles from '@/styles/components.module.css';
import Link from 'next/link';

export default function ManagePage() {
    const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [comparePrompts, setComparePrompts] = useState<ComparePrompt[]>([]);
    const [activeTab, setActiveTab] = useState<'prompts' | 'categories' | 'compare' | 'settings'>('prompts');

    // Form states
    const [newCatName, setNewCatName] = useState('');

    const [newPromptTitle, setNewPromptTitle] = useState('');
    const [newPromptContent, setNewPromptContent] = useState('');
    const [newPromptCat, setNewPromptCat] = useState('');

    // Settings state
    const [apiKey, setApiKey] = useState('');

    // Edit states
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
    const [editingComparePrompt, setEditingComparePrompt] = useState<ComparePrompt | null>(null);

    const [newCompareTitle, setNewCompareTitle] = useState('');
    const [newCompareContent, setNewCompareContent] = useState('');

    const refreshData = async () => {
        const [promptsData, comparePromptsData, categoriesData] = await Promise.all([
            getPrompts(),
            getComparePrompts(),
            getCategories()
        ]);
        setPrompts(promptsData);
        setCategories(categoriesData);
        setComparePrompts(comparePromptsData);
        setApiKey(await getApiKey());
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleReset = () => {
        if (confirm('This will reset everything to default data. Continue?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const handleAddCategory = async () => {
        if (!newCatName) return;
        const newCat: Category = {
            id: newCatName.toLowerCase().replace(/\s+/g, '-'),
            name: newCatName
        };
        await addCategory(newCat);
        setNewCatName('');
        refreshData();
    };

    const handleUpdateCategory = async () => {
        if (!editingCat) return;
        // Since ID is primary key, we can just save it again to update name (if ID didn't change)
        // If ID changed (not allowed in UI currently), we'd need to delete old and create new
        await addCategory(editingCat);
        setEditingCat(null);
        refreshData();
    };

    const handleDeleteCategory = async (id: string) => {
        if (confirm('Delete this category?')) {
            await deleteCategory(id);
            refreshData();
        }
    };

    const handleAddPrompt = () => {
        if (!newPromptTitle || !newPromptContent || !newPromptCat) {
            alert('Please fill all fields');
            return;
        }
        const newPrompt: PromptTemplate = {
            id: Date.now().toString(),
            title: newPromptTitle,
            categoryId: newPromptCat,
            content: newPromptContent
        };
        savePrompts([...prompts, newPrompt]);
        setNewPromptTitle('');
        setNewPromptContent('');
        refreshData();
    };

    const handleUpdatePrompt = () => {
        if (!editingPrompt) return;
        const updated = prompts.map(p => p.id === editingPrompt.id ? editingPrompt : p);
        savePrompts(updated);
        setEditingPrompt(null);
        refreshData();
    };

    const handleDeletePrompt = (id: string) => {
        if (confirm('Delete this prompt?')) {
            savePrompts(prompts.filter(p => p.id !== id));
            refreshData();
        }
    };

    const handleAddComparePrompt = () => {
        if (!newCompareTitle || !newCompareContent) return;
        const newPrompt: ComparePrompt = {
            id: Date.now().toString(),
            title: newCompareTitle,
            content: newCompareContent
        };
        saveComparePrompts([...comparePrompts, newPrompt]);
        setNewCompareTitle('');
        setNewCompareContent('');
        refreshData();
    };

    const handleUpdateComparePrompt = () => {
        if (!editingComparePrompt) return;
        const updated = comparePrompts.map(p => p.id === editingComparePrompt.id ? editingComparePrompt : p);
        saveComparePrompts(updated);
        setEditingComparePrompt(null);
        refreshData();
    };

    const handleDeleteComparePrompt = (id: string) => {
        if (confirm('Delete this comparison prompt?')) {
            saveComparePrompts(comparePrompts.filter(p => p.id !== id));
            refreshData();
        }
    };

    const handleDeleteAnalysisFiles = async () => {
        if (confirm('Are you sure you want to delete ALL analysis files? This cannot be undone.')) {
            try {
                const res = await fetch('/api/analysis-files', { method: 'DELETE' });
                if (res.ok) {
                    alert('All analysis files have been deleted.');
                } else {
                    alert('Failed to delete files.');
                }
            } catch (error) {
                console.error('Error deleting analysis files:', error);
                alert('An error occurred.');
            }
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Manage Data</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleReset} className={styles.buttonSecondary} style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', color: '#ff8888' }}>
                        Reset Defaults
                    </button>
                    <Link href="/" className={styles.buttonSecondary} style={{ padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none' }}>
                        &larr; Back to Generator
                    </Link>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                <button
                    className={styles.buttonSecondary}
                    style={{ border: 'none', borderBottom: activeTab === 'prompts' ? '2px solid var(--primary)' : 'none', borderRadius: 0 }}
                    onClick={() => setActiveTab('prompts')}
                >
                    Prompts
                </button>
                <button
                    className={styles.buttonSecondary}
                    style={{ border: 'none', borderBottom: activeTab === 'categories' ? '2px solid var(--primary)' : 'none', borderRadius: 0 }}
                    onClick={() => setActiveTab('categories')}
                >
                    Categories
                </button>
                <button
                    className={styles.buttonSecondary}
                    style={{ border: 'none', borderBottom: activeTab === 'compare' ? '2px solid var(--primary)' : 'none', borderRadius: 0 }}
                    onClick={() => setActiveTab('compare')}
                >
                    Compare Prompts
                </button>
                <button
                    className={styles.buttonSecondary}
                    style={{ border: 'none', borderBottom: activeTab === 'settings' ? '2px solid var(--primary)' : 'none', borderRadius: 0 }}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </div>

            {activeTab === 'categories' && (
                <div className={styles.card}>
                    <h3 className={styles.label}>{editingCat ? 'Edit Category' : 'Add New Category'}</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            className={styles.input}
                            placeholder="Category Name"
                            value={editingCat ? editingCat.name : newCatName}
                            onChange={e => editingCat ? setEditingCat({ ...editingCat, name: e.target.value }) : setNewCatName(e.target.value)}
                        />
                        {editingCat ? (
                            <>
                                <button className={styles.button} onClick={handleUpdateCategory}>Update</button>
                                <button className={styles.buttonSecondary} onClick={() => setEditingCat(null)}>Cancel</button>
                            </>
                        ) : (
                            <button className={styles.button} onClick={handleAddCategory}>Add</button>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h3 className={styles.label}>Existing Categories</h3>
                        <ul style={{ listStyle: 'none' }}>
                            {categories.map(c => (
                                <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                    <span>{c.name} <span style={{ color: '#666', fontSize: '0.8rem' }}>({c.id})</span></span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setEditingCat(c)} style={{ color: 'var(--primary)', background: 'none', border: 'none' }}>Edit</button>
                                        <button onClick={() => handleDeleteCategory(c.id)} style={{ color: '#ff4444', background: 'none', border: 'none' }}>Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {activeTab === 'prompts' && (
                <div className={styles.card}>
                    <h3 className={styles.label}>{editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input
                            className={styles.input}
                            placeholder="Prompt Title"
                            value={editingPrompt ? editingPrompt.title : newPromptTitle}
                            onChange={e => editingPrompt ? setEditingPrompt({ ...editingPrompt, title: e.target.value }) : setNewPromptTitle(e.target.value)}
                        />
                        <select
                            className={styles.input}
                            value={editingPrompt ? editingPrompt.categoryId : newPromptCat}
                            onChange={e => editingPrompt ? setEditingPrompt({ ...editingPrompt, categoryId: e.target.value }) : setNewPromptCat(e.target.value)}
                        >
                            <option value="">Select Category</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <textarea
                            className={styles.input}
                            placeholder="Prompt Content (Use {{TICKERS}} for symbol placement)"
                            rows={5}
                            value={editingPrompt ? editingPrompt.content : newPromptContent}
                            onChange={e => editingPrompt ? setEditingPrompt({ ...editingPrompt, content: e.target.value }) : setNewPromptContent(e.target.value)}
                        />
                        {editingPrompt ? (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className={styles.button} style={{ flex: 1 }} onClick={handleUpdatePrompt}>Update Prompt Template</button>
                                <button className={styles.buttonSecondary} onClick={() => setEditingPrompt(null)}>Cancel</button>
                            </div>
                        ) : (
                            <button className={styles.button} onClick={handleAddPrompt}>Add Prompt Template</button>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h3 className={styles.label}>Existing Prompts</h3>
                        <ul style={{ listStyle: 'none' }}>
                            {prompts.map(p => (
                                <li key={p.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>{p.title}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => setEditingPrompt(p)} style={{ color: 'var(--primary)', background: 'none', border: 'none' }}>Edit</button>
                                            <button onClick={() => handleDeletePrompt(p.id)} style={{ color: '#ff4444', background: 'none', border: 'none' }}>Delete</button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>
                                        Category: {categories.find(c => c.id === p.categoryId)?.name || p.categoryId}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.content}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {activeTab === 'compare' && (
                <div className={styles.card}>
                    <h3 className={styles.label}>{editingComparePrompt ? 'Edit Compare Prompt' : 'Add New Compare Prompt'}</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input
                            className={styles.input}
                            placeholder="Title (e.g., Investment Case)"
                            value={editingComparePrompt ? editingComparePrompt.title : newCompareTitle}
                            onChange={e => editingComparePrompt ? setEditingComparePrompt({ ...editingComparePrompt, title: e.target.value }) : setNewCompareTitle(e.target.value)}
                        />
                        <textarea
                            className={styles.input}
                            placeholder="Prompt Content"
                            rows={3}
                            value={editingComparePrompt ? editingComparePrompt.content : newCompareContent}
                            onChange={e => editingComparePrompt ? setEditingComparePrompt({ ...editingComparePrompt, content: e.target.value }) : setNewCompareContent(e.target.value)}
                        />
                        {editingComparePrompt ? (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className={styles.button} style={{ flex: 1 }} onClick={handleUpdateComparePrompt}>Update Compare Prompt</button>
                                <button className={styles.buttonSecondary} onClick={() => setEditingComparePrompt(null)}>Cancel</button>
                            </div>
                        ) : (
                            <button className={styles.button} onClick={handleAddComparePrompt}>Add Compare Prompt</button>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h3 className={styles.label}>Existing Compare Prompts</h3>
                        <ul style={{ listStyle: 'none' }}>
                            {comparePrompts.map(p => (
                                <li key={p.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>{p.title}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => setEditingComparePrompt(p)} style={{ color: 'var(--primary)', background: 'none', border: 'none' }}>Edit</button>
                                            <button onClick={() => handleDeleteComparePrompt(p.id)} style={{ color: '#ff4444', background: 'none', border: 'none' }}>Delete</button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                                        {p.content}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className={styles.card}>
                    <h3 className={styles.label}>AI Configuration</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label className={styles.label}>Google AI Studio API Key</label>
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="Paste your API key here..."
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                                Get your key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Google AI Studio</a>.
                                This key is stored only in your browser.
                            </p>
                        </div>
                        <button className={styles.button} onClick={async () => { await saveApiKey(apiKey); alert('API Key saved!'); }}>
                            Save API Key
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                        <h3 className={styles.label} style={{ color: '#ff4444' }}>Danger Zone</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                            Perform destructive actions here.
                        </p>
                        <button
                            className={styles.buttonSecondary}
                            style={{ color: '#ff4444', borderColor: '#ff4444' }}
                            onClick={handleDeleteAnalysisFiles}
                        >
                            Delete All Analysis Files
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
