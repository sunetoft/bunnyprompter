import { Category, PromptTemplate, ComparePrompt, Theme, DEFAULT_CATEGORIES, DEFAULT_PROMPTS, DEFAULT_COMPARE_PROMPTS, DEFAULT_THEMES } from './types';

const STORAGE_KEYS = {
    CATEGORIES: 'coderick_categories',
    PROMPTS: 'coderick_prompts',
    COMPARE_PROMPTS: 'coderick_compare_prompts',
    THEMES: 'coderick_themes',
    API_KEY: 'coderick_gemini_api_key',
};

const isBrowser = typeof window !== 'undefined';

export const getApiKey = (): string => {
    if (!isBrowser) return '';
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
};

export const saveApiKey = (key: string) => {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
};

export const getCategories = (): Category[] => {
    if (!isBrowser) return DEFAULT_CATEGORIES;
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!stored) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
    }
    return JSON.parse(stored);
};

export const saveCategories = (categories: Category[]) => {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
};

export const getPrompts = async (): Promise<PromptTemplate[]> => {
    if (!isBrowser) return DEFAULT_PROMPTS;
    try {
        const res = await fetch('/api/prompts');
        const prompts = await res.json();
        return prompts.length ? prompts : DEFAULT_PROMPTS;
    } catch {
        return DEFAULT_PROMPTS;
    }
};

export const savePrompts = async (prompts: PromptTemplate[]) => {
    if (!isBrowser) return;
    for (const prompt of prompts) {
        await fetch('/api/prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prompt)
        });
    }
};

export const addPrompt = async (prompt: PromptTemplate) => {
    if (!isBrowser) return;
    await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
    });
};

export const deletePrompt = async (id: string) => {
    if (!isBrowser) return;
    await fetch(`/api/prompts?id=${id}`, { method: 'DELETE' });
};

export const getComparePrompts = async (): Promise<ComparePrompt[]> => {
    if (!isBrowser) return DEFAULT_COMPARE_PROMPTS;
    try {
        const res = await fetch('/api/compare-prompts');
        const prompts = await res.json();
        return prompts.length ? prompts : DEFAULT_COMPARE_PROMPTS;
    } catch {
        return DEFAULT_COMPARE_PROMPTS;
    }
};

export const saveComparePrompts = async (prompts: ComparePrompt[]) => {
    if (!isBrowser) return;
    for (const prompt of prompts) {
        await fetch('/api/compare-prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prompt)
        });
    }
};

export const getThemes = (): Theme[] => {
    if (!isBrowser) return DEFAULT_THEMES;
    const stored = localStorage.getItem(STORAGE_KEYS.THEMES);
    if (!stored) {
        localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(DEFAULT_THEMES));
        return DEFAULT_THEMES;
    }
    return JSON.parse(stored);
};

export const saveThemes = (themes: Theme[]) => {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
};
