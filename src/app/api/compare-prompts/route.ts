import { NextRequest, NextResponse } from 'next/server';
import { getAllComparePrompts, saveComparePrompt } from '@/lib/db';

export async function GET() {
    try {
        const prompts = await getAllComparePrompts();
        return NextResponse.json(prompts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const prompt = await req.json();
        if (!prompt.id || !prompt.title || !prompt.content) {
            return NextResponse.json({ error: 'Invalid prompt data' }, { status: 400 });
        }
        await saveComparePrompt(prompt);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
