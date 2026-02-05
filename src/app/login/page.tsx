"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError('Forkert adgangskode. Prøv igen.');
            }
        } catch (err) {
            setError('Der skete en fejl. Prøv igen senere.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                background: 'rgba(30, 41, 59, 0.7)',
                padding: '2.5rem',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                width: '100%',
                maxWidth: '400px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#38bdf8' }}>BunnyPrompter</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Indtast adgangskode for at fortsætte</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <input
                            type="password"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Adgangskode"
                            required
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#fff',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            borderRadius: '0.5rem',
                            background: '#38bdf8',
                            color: '#0f172a',
                            fontWeight: 600,
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Verificerer...' : 'Adgang'}
                    </button>
                </form>
            </div>
        </div>
    );
}
