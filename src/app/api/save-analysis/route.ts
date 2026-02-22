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
        // Clean content for XML (basic escaping if needed, though for now we'll wrap in CDATA or just simple tags)
        // For simplicity and since it might contain markdown or HTML, let's use a structured entry
        const xmlEntry = `
    <entry>
        <timestamp>${timestamp}</timestamp>
        <content><![CDATA[${content}]]></content>
    </entry>`;

        const results = [];

        for (const ticker of tickers) {
            const fileName = `${ticker.trim().toUpperCase()}.xml`;
            const filePath = path.join(dirPath, fileName);

            let fileContent = '';
            if (fs.existsSync(filePath)) {
                const existing = fs.readFileSync(filePath, 'utf8');
                // Insert new entry after <analysis> tag
                fileContent = existing.replace('<analysis>', `<analysis>${xmlEntry}`);
            } else {
                fileContent = `<?xml version="1.0" encoding="UTF-8"?>\n<analysis>${xmlEntry}\n</analysis>`;
            }

            fs.writeFileSync(filePath, fileContent, 'utf8');
            results.push(fileName);
        }

        return NextResponse.json({ success: true, savedFiles: results });
    } catch (error: any) {
        console.error('Error saving analysis:', error);
        return NextResponse.json({ error: error.message || 'Failed to save analysis' }, { status: 500 });
    }
}
