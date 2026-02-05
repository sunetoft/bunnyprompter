import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { code } = await request.json()
    const validCode = process.env.ACCESS_CODE || '123456'

    if (code === validCode) {
        const response = NextResponse.json({ success: true })

        // Set a secure, HttpOnly cookie that expires in 30 days
        const isLocalhost = request.headers.get('host')?.includes('localhost');
        response.cookies.set('access_granted', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && !isLocalhost,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        })

        return response
    }

    return NextResponse.json({ success: false, message: 'Invalid access code' }, { status: 401 })
}
