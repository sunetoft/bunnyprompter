import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, saveCategory, deleteCategory } from '@/lib/db';

export async function GET() {
    try {
        const categories = await getAllCategories();
        return NextResponse.json(categories);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const category = await req.json();
        if (!category.id || !category.name) {
            return NextResponse.json({ error: 'Invalid category data' }, { status: 400 });
        }
        await saveCategory(category);
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
        await deleteCategory(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
