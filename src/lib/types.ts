export type Category = {
    id: string;
    name: string;
};

export type PromptTemplate = {
    id: string;
    title: string;
    categoryId: string; // 'all' or specific category id
    content: string; // Contains placeholders like {{TICKERS}}
};

export type ComparePrompt = {
    id: string;
    title: string;
    content: string;
};

export type Theme = {
    id: string;
    title: string;
    tickers: string[];
};

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'earnings', name: 'Earnings Reports' },
    { id: 'technical', name: 'Technical Analysis' },
    { id: 'sentiment', name: 'Sentiment Analysis' },
];

export const DEFAULT_PROMPTS: PromptTemplate[] = [
    {
        id: 'default-earnings',
        title: 'Comprehensive Earnings Analysis',
        categoryId: 'earnings',
        content: `Analyze {{TICKERS}} latest earnings report. What stands out as important and significant, what did they say about revenue, earnings growth, margins, buy backs, new products/developments or future guidance. Make each of these a section to cover and use 20 bullets total max. Also, respond first with Earnings Growth YoY, Earnings Surprise vs Estimates Sales Growth YoY Sales Surprise vs Estimates Margins YoY. Guidance Changes and then a 2 sentence TLDR of the earnings report.`
    }
];

export const DEFAULT_COMPARE_PROMPTS: ComparePrompt[] = [
    {
        id: 'default-compare',
        title: 'Investment Comparison',
        content: 'Based on the existing analysis, which of the selected tickers is the best 3 - 6 months investment case'
    }
];

export const DEFAULT_THEMES: Theme[] = [];
