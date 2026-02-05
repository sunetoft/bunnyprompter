import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'BunnyPrompter - Stock Analysis Prompts',
    description: 'Generate AI prompts for stock analysis',
}

import Sidebar from '@/components/Sidebar'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <div className="app-container">
                    <Sidebar />
                    <main className="main-content">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    )
}
