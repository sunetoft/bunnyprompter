import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const { geminiApiKey } = await req.json();

        // 1. Fetch Fear & Greed + BTC
        const scriptPath = path.join(process.cwd(), 'scripts', 'market_sentiment.py');
        const { stdout: macroStdout } = await execPromise(`python3 "${scriptPath}"`);
        const macroData = JSON.parse(macroStdout);

        // 2. Fetch Portfolio Gainers/Losers
        const analysisDir = path.join(process.cwd(), 'st-analysis');
        let performers: { gainers: any[], losers: any[] } = { gainers: [], losers: [] };

        if (fs.existsSync(analysisDir)) {
            const tickers = fs.readdirSync(analysisDir)
                .filter(f => f.endsWith('.md'))
                .map(f => f.replace('.md', ''));

            if (tickers.length > 0) {
                const stockScriptPath = path.join(process.cwd(), 'scripts', 'stock_data.py');
                const { stdout: stockStdout } = await execPromise(`python3 "${stockScriptPath}" ${tickers.join(' ')}`);
                const stockData = JSON.parse(stockStdout);

                const sorted = Object.values(stockData)
                    .filter((s: any) => !s.error)
                    .sort((a: any, b: any) => b.daily_change - a.daily_change);

                performers.gainers = sorted.slice(0, 3).map((s: any) => ({
                    ticker: s.ticker,
                    price: s.price,
                    change_p: s.daily_change
                }));

                performers.losers = [...sorted].reverse().slice(0, 3).map((s: any) => ({
                    ticker: s.ticker,
                    price: s.price,
                    change_p: s.daily_change
                }));
            }
        }

        // 3. Social Sentiment via Gemini
        let socialSentiment = { rank: 5, summary: "Could not fetch social sentiment." };
        if (geminiApiKey) {
            try {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

                const prompt = `Analyze the current US stock market sentiment based on recent trends in social media (X, Reddit) and prediction markets (Polymarket). 
                Provide:
                1. A sentiment rank from 0 (Extremely Bearish/Bad) to 10 (Extremely Bullish/Good).
                2. A one-sentence summary of why.
                Return ONLY as JSON: {"rank": number, "summary": "string"}`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                socialSentiment = JSON.parse(response.text().replace(/```json|```/g, '').trim());
            } catch (err) {
                console.error("Gemini Sentiment Error:", err);
            }
        }

        return NextResponse.json({
            ...macroData,
            performers,
            socialSentiment
        });
    } catch (error: any) {
        console.error('Market Sentiment API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
