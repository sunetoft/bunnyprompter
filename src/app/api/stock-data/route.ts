import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { queryStockCache, updateStockCache } from '@/lib/db';

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const { tickers, refresh, includeCSP } = await req.json();

        if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
            return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
        }

        const result: any = {};
        const tickersToFetch: string[] = [];

        // 1. Check SQLite Cache
        if (!refresh) {
            for (const ticker of tickers) {
                const cached = await queryStockCache(ticker);
                if (cached) {
                    const now = Date.now();
                    const data = JSON.parse(cached.data);

                    // Cache valid for 4 hours
                    const isTimedOut = now - cached.updated_at > 14400000;

                    // Check if we need CSP but don't have it in cache
                    const needsCSPFetch = includeCSP && (!data.csp_opportunities || data.csp_opportunities.length === 0);

                    if (!isTimedOut && !needsCSPFetch) {
                        result[ticker] = { ...data, updated_at: cached.updated_at };
                    } else {
                        tickersToFetch.push(ticker);
                    }
                } else {
                    tickersToFetch.push(ticker);
                }
            }
        } else {
            tickersToFetch.push(...tickers);
        }

        if (tickersToFetch.length === 0) {
            return NextResponse.json(result);
        }

        // 2. Fetch from yfinance for missing tickers
        const scriptPath = path.join(process.cwd(), 'scripts', 'stock_data.py');
        const safeTickers = tickersToFetch.map(t => t.replace(/[^a-zA-Z0-9\.]/g, '')).filter(Boolean);

        if (safeTickers.length > 0) {
            const cspFlag = includeCSP ? "" : "--skip-csp";
            const { stdout, stderr } = await execPromise(`python3 "${scriptPath}" ${safeTickers.join(' ')} ${cspFlag}`);

            if (stderr) {
                console.warn('Python Warning/Error:', stderr);
            }

            try {
                const freshData = JSON.parse(stdout);

                // 3. Update SQLite Cache
                for (const t of Object.keys(freshData)) {
                    // If we didn't fetch CSP, merge with existing cache if it exists, 
                    // or just save the new basic data.
                    // Actually, for simplicity, if we fetch CSP, we save everything.
                    // If we don't fetch CSP, we might overwrite existing CSP data in cache.
                    // Let's improve this: merge if skip-csp was used.
                    if (!includeCSP) {
                        const cached = await queryStockCache(t);
                        if (cached) {
                            const oldData = JSON.parse(cached.data);
                            freshData[t].csp_opportunities = oldData.csp_opportunities || [];
                            freshData[t].expected_moves = oldData.expected_moves || [];
                        }
                    }

                    await updateStockCache(t, freshData[t]);
                    result[t] = { ...freshData[t], updated_at: Date.now() };
                }
            } catch (parseError) {
                console.error('Failed to parse Python output', stdout);
                throw parseError;
            }
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
