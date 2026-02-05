import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const dirPath = path.join(process.cwd(), 'st-analysis');

        if (!fs.existsSync(dirPath)) {
            return NextResponse.json({ files: [] });
        }

        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.md'))
            .map(file => file.replace('.md', ''));

        return NextResponse.json({ files });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { tickers } = await req.json();
        const dirPath = path.join(process.cwd(), 'st-analysis');

        const contents: Record<string, string> = {};

        for (const ticker of tickers) {
            const filePath = path.join(dirPath, `${ticker.toUpperCase()}.md`);
            if (fs.existsSync(filePath)) {
                contents[ticker] = fs.readFileSync(filePath, 'utf8');
            } else {
                contents[ticker] = 'Ingen analyse fundet for denne ticker.';
            }
        }

        return NextResponse.json({ contents });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
