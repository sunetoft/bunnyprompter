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
            .filter(file => file.endsWith('.xml'))
            .map(file => file.replace('.xml', ''));

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
            const filePath = path.join(dirPath, `${ticker.toUpperCase()}.xml`);
            if (fs.existsSync(filePath)) {
                contents[ticker] = fs.readFileSync(filePath, 'utf8');
            } else {
                contents[ticker] = '<analysis><entry><content>Ingen analyse fundet for denne ticker.</content></entry></analysis>';
            }
        }

        return NextResponse.json({ contents });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const dirPath = path.join(process.cwd(), 'st-analysis');

        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                if (file.endsWith('.xml') || file.endsWith('.md')) {
                    fs.unlinkSync(path.join(dirPath, file));
                }
            }
        }

        return NextResponse.json({ success: true, message: 'All analysis files deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
