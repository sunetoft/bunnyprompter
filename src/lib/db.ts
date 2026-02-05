import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

let sqliteDb: Database | null = null;
let pgPool: Pool | null = null;

const isPostgres = process.env.DB_USER && process.env.DB_PASS && (process.env.DB_HOST || process.env.INSTANCE_CONNECTION_NAME);

export async function getDb() {
    if (isPostgres) {
        if (pgPool) return pgPool;

        const config: any = {
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        };

        if (process.env.INSTANCE_CONNECTION_NAME) {
            // Cloud Run Unix socket
            config.host = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
        } else {
            config.host = process.env.DB_HOST || 'localhost';
            config.port = parseInt(process.env.DB_PORT || '5432');
        }

        pgPool = new Pool(config);

        // Initialize Schema for Postgres
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS stock_cache (
                ticker TEXT PRIMARY KEY,
                data TEXT,
                updated_at BIGINT
            );
            CREATE TABLE IF NOT EXISTS themes (
                id TEXT PRIMARY KEY,
                title TEXT,
                tickers TEXT
            );
            CREATE TABLE IF NOT EXISTS prompts (
                id TEXT PRIMARY KEY,
                title TEXT,
                category TEXT,
                content TEXT
            );
            CREATE TABLE IF NOT EXISTS compare_prompts (
                id TEXT PRIMARY KEY,
                title TEXT,
                content TEXT
            );
        `);

        return pgPool;
    } else {
        if (sqliteDb) return sqliteDb;

        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        sqliteDb = await open({
            filename: path.join(dataDir, 'bunnyprompter.db'),
            driver: sqlite3.Database,
        });

        await sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS stock_cache (ticker TEXT PRIMARY KEY, data TEXT, updated_at INTEGER);
            CREATE TABLE IF NOT EXISTS themes (id TEXT PRIMARY KEY, title TEXT, tickers TEXT);
            CREATE TABLE IF NOT EXISTS prompts (id TEXT PRIMARY KEY, title TEXT, category TEXT, content TEXT);
            CREATE TABLE IF NOT EXISTS compare_prompts (id TEXT PRIMARY KEY, title TEXT, content TEXT);
        `);

        return sqliteDb;
    }
}

export async function queryStockCache(ticker: string) {
    const db = await getDb();
    if (isPostgres) {
        const res = await (db as Pool).query('SELECT * FROM stock_cache WHERE ticker = $1', [ticker]);
        return res.rows[0];
    } else {
        return await (db as Database).get('SELECT * FROM stock_cache WHERE ticker = ?', [ticker]);
    }
}

export async function updateStockCache(ticker: string, data: any) {
    const db = await getDb();
    const now = Date.now();
    if (isPostgres) {
        await (db as Pool).query(
            'INSERT INTO stock_cache (ticker, data, updated_at) VALUES ($1, $2, $3) ON CONFLICT (ticker) DO UPDATE SET data = $2, updated_at = $3',
            [ticker, JSON.stringify(data), now]
        );
    } else {
        await (db as Database).run(
            'INSERT OR REPLACE INTO stock_cache (ticker, data, updated_at) VALUES (?, ?, ?)',
            [ticker, JSON.stringify(data), now]
        );
    }
}

export async function getAllThemes() {
    const db = await getDb();
    let rows;
    if (isPostgres) {
        const res = await (db as Pool).query('SELECT * FROM themes');
        rows = res.rows;
    } else {
        rows = await (db as Database).all('SELECT * FROM themes');
    }
    return rows.map(row => ({
        ...row,
        tickers: typeof row.tickers === 'string' ? JSON.parse(row.tickers) : row.tickers
    }));
}

export async function saveTheme(theme: { id: string, title: string, tickers: string[] }) {
    const db = await getDb();
    const tickersStr = JSON.stringify(theme.tickers);
    if (isPostgres) {
        await (db as Pool).query(
            'INSERT INTO themes (id, title, tickers) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET title = $2, tickers = $3',
            [theme.id, theme.title, tickersStr]
        );
    } else {
        await (db as Database).run(
            'INSERT OR REPLACE INTO themes (id, title, tickers) VALUES (?, ?, ?)',
            [theme.id, theme.title, tickersStr]
        );
    }
}

export async function deleteTheme(id: string) {
    const db = await getDb();
    if (isPostgres) {
        await (db as Pool).query('DELETE FROM themes WHERE id = $1', [id]);
    } else {
        await (db as Database).run('DELETE FROM themes WHERE id = ?', [id]);
    }
}

export async function getAllPrompts() {
    const db = await getDb();
    if (isPostgres) {
        const res = await (db as Pool).query('SELECT * FROM prompts');
        return res.rows;
    } else {
        return await (db as Database).all('SELECT * FROM prompts');
    }
}

export async function savePrompt(prompt: { id: string, title: string, category: string, content: string }) {
    const db = await getDb();
    if (isPostgres) {
        await (db as Pool).query(
            'INSERT INTO prompts (id, title, category, content) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET title = $2, category = $3, content = $4',
            [prompt.id, prompt.title, prompt.category, prompt.content]
        );
    } else {
        await (db as Database).run(
            'INSERT OR REPLACE INTO prompts (id, title, category, content) VALUES (?, ?, ?, ?)',
            [prompt.id, prompt.title, prompt.category, prompt.content]
        );
    }
}

export async function deletePromptDb(id: string) {
    const db = await getDb();
    if (isPostgres) {
        await (db as Pool).query('DELETE FROM prompts WHERE id = $1', [id]);
    } else {
        await (db as Database).run('DELETE FROM prompts WHERE id = ?', [id]);
    }
}

export async function getAllComparePrompts() {
    const db = await getDb();
    if (isPostgres) {
        const res = await (db as Pool).query('SELECT * FROM compare_prompts');
        return res.rows;
    } else {
        return await (db as Database).all('SELECT * FROM compare_prompts');
    }
}

export async function saveComparePrompt(prompt: { id: string, title: string, content: string }) {
    const db = await getDb();
    if (isPostgres) {
        await (db as Pool).query(
            'INSERT INTO compare_prompts (id, title, content) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET title = $2, content = $3',
            [prompt.id, prompt.title, prompt.content]
        );
    } else {
        await (db as Database).run(
            'INSERT OR REPLACE INTO compare_prompts (id, title, content) VALUES (?, ?, ?)',
            [prompt.id, prompt.title, prompt.content]
        );
    }
}
