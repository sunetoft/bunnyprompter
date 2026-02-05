import { NextRequest, NextResponse } from 'next/server';
import { getAllThemes, saveTheme, deleteTheme } from '@/lib/db';

export async function GET() {
    try {
        const themes = await getAllThemes();
        return NextResponse.json(themes);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const theme = await req.json();
        if (!theme.id || !theme.title || !theme.tickers) {
            return NextResponse.json({ error: 'Invalid theme data' }, { status: 400 });
        }
        await saveTheme(theme);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }
        await deleteTheme(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
