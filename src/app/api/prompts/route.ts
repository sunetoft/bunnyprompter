import { NextRequest, NextResponse } from 'next/server';
import { getAllPrompts, savePrompt, deletePromptDb } from '@/lib/db';

export async function GET() {
    try {
        const prompts = await getAllPrompts();
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
        await savePrompt(prompt);
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
        await deletePromptDb(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
