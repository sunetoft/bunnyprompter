import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const { tickers, content } = await req.json();

        if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
            return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
        }

        if (!content) {
            return NextResponse.json({ error: 'No content provided' }, { status: 400 });
        }

        const dirPath = path.join(process.cwd(), 'st-analysis');

        // Create directory if it doesn't exist
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const timestamp = new Date().toLocaleString('da-DK', { timeZone: 'Europe/Copenhagen' });
        const formattedContent = `\n---\n## Analysis: ${timestamp}\n\n${content}\n\n`;

        const results = [];

        for (const ticker of tickers) {
            const fileName = `${ticker.trim().toUpperCase()}.md`;
            const filePath = path.join(dirPath, fileName);

            let existingContent = '';
            if (fs.existsSync(filePath)) {
                existingContent = fs.readFileSync(filePath, 'utf8');
            }

            // Prepend new analysis to the top
            const newFileContent = `# Stock Analysis: ${ticker.toUpperCase()}\n${formattedContent}${existingContent}`;

            fs.writeFileSync(filePath, newFileContent, 'utf8');
            results.push(fileName);
        }

        return NextResponse.json({ success: true, savedFiles: results });
    } catch (error: any) {
        console.error('Error saving analysis:', error);
        return NextResponse.json({ error: error.message || 'Failed to save analysis' }, { status: 500 });
    }
}
