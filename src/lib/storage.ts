import { Category, PromptTemplate, ComparePrompt, Theme, DEFAULT_CATEGORIES, DEFAULT_PROMPTS, DEFAULT_COMPARE_PROMPTS, DEFAULT_THEMES } from './types';

const STORAGE_KEYS = {
    CATEGORIES: 'coderick_categories',
    PROMPTS: 'coderick_prompts',
    COMPARE_PROMPTS: 'coderick_compare_prompts',
    THEMES: 'coderick_themes',
    API_KEY: 'coderick_gemini_api_key',
};

const isBrowser = typeof window !== 'undefined';

export const getApiKey = async (): Promise<string> => {
    if (!isBrowser) return '';
    try {
        const res = await fetch('/api/settings?key=api_key');
        const data = await res.json();
        const apiValue = data.value;

        // Migration
        const localKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
        if (!apiValue && localKey) {
            await saveApiKey(localKey);
            return localKey;
        }

        return apiValue || '';
    } catch {
        return '';
    }
};

export const saveApiKey = async (key: string) => {
    if (!isBrowser) return;
    await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'api_key', value: key })
    });
    // Also update local storage for redundancy/fallback if needed, or simply remove it. 
    // Let's keep it in sync for now or maybe just clear it to avoid confusion? 
    // The requirement is persistent storage, so let's prefer DB. 
    // We can leave localStorage alone or update it as cache. 
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
};

export const getCategories = async (): Promise<Category[]> => {
    if (!isBrowser) return DEFAULT_CATEGORIES;
    try {
        const res = await fetch('/api/categories');
        const categories = await res.json();
        const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

        // Migration: If API returns empty but localStorage has data, sync it up
        if ((!categories || categories.length === 0) && stored) {
            const localCats: Category[] = JSON.parse(stored);
            for (const cat of localCats) {
                await addCategory(cat);
            }
            return localCats;
        }

        if (!categories || categories.length === 0) {
            // Seed defaults if absolutely nothing exists
            for (const cat of DEFAULT_CATEGORIES) {
                await addCategory(cat);
            }
            return DEFAULT_CATEGORIES;
        }

        return categories;
    } catch {
        return DEFAULT_CATEGORIES;
    }
};

export const addCategory = async (category: Category) => {
    if (!isBrowser) return;
    await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
    });
};

export const deleteCategory = async (id: string) => {
    if (!isBrowser) return;
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
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
