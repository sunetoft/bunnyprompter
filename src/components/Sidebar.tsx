"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <aside className="sidebar">
            <div className="sidebar-title">BunnyPrompter</div>
            <nav className="nav-links">
                <Link
                    href="/"
                    className={`nav-link ${isActive('/') ? 'active' : ''}`}
                >
                    <span>📊</span> <span>Analysis</span>
                </Link>
                <Link
                    href="/compare"
                    className={`nav-link ${isActive('/compare') ? 'active' : ''}`}
                >
                    <span>⚖️</span> <span>Compare</span>
                </Link>
                <Link
                    href="/themes"
                    className={`nav-link ${isActive('/themes') ? 'active' : ''}`}
                >
                    <span>📑</span> <span>Themes</span>
                </Link>
                <Link
                    href="/trades"
                    className={`nav-link ${isActive('/trades') ? 'active' : ''}`}
                >
                    <span>💹</span> <span>Trades</span>
                </Link>
                <Link
                    href="/market-sentiment"
                    className={`nav-link ${isActive('/market-sentiment') ? 'active' : ''}`}
                >
                    <span>🧭</span> <span>Sentiment</span>
                </Link>
                <Link
                    href="/manage"
                    className={`nav-link ${isActive('/manage') ? 'active' : ''}`}
                >
                    <span>⚙️</span> <span>Manage</span>
                </Link>
            </nav>

            <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#555' }}>
                v1.1 - 2026 Edition
            </div>
        </aside>
    );
}
