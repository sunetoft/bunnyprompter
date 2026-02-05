import { NextRequest, NextResponse } from 'next/server';
import { getSetting, saveSetting } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }
        const value = await getSetting(key);
        return NextResponse.json({ value: value || null });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { key, value } = body;
        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
        }
        await saveSetting(key, value);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
