import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Expense } from '../types';

// ─── Month refresh (replaces Firebase realtime listener) ────────────

const monthListeners = new Map<string, Set<() => void>>();

function subscribeMonth(monthKey: string, fn: () => void): void {
  if (!monthListeners.has(monthKey)) monthListeners.set(monthKey, new Set());
  monthListeners.get(monthKey)!.add(fn);
}

function unsubscribeMonth(monthKey: string, fn: () => void): void {
  monthListeners.get(monthKey)?.delete(fn);
}

function notifyMonth(monthKey: string): void {
  monthListeners.get(monthKey)?.forEach((f) => f());
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function sortExpenses(list: Expense[]): Expense[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

// ═══════════════════════════════════════════════════════════════════
// Web: in-memory (no expo-sqlite)
// ═══════════════════════════════════════════════════════════════════

const memExpenses = new Map<string, Map<string, Expense>>();
const memPersons = new Map<string, string>();

function memLoadMonth(monthKey: string): Expense[] {
  const byId = memExpenses.get(monthKey);
  if (!byId) return [];
  return sortExpenses([...byId.values()]);
}

async function memAddExpense(monthKey: string, expense: Omit<Expense, 'id'>): Promise<string> {
  const id = newId();
  if (!memExpenses.has(monthKey)) memExpenses.set(monthKey, new Map());
  memExpenses.get(monthKey)!.set(id, { id, ...expense });
  notifyMonth(monthKey);
  return id;
}

async function memUpdateExpense(monthKey: string, id: string, expense: Omit<Expense, 'id'>): Promise<void> {
  memExpenses.get(monthKey)?.set(id, { id, ...expense });
  notifyMonth(monthKey);
}

async function memDeleteExpense(monthKey: string, id: string): Promise<void> {
  memExpenses.get(monthKey)?.delete(id);
  notifyMonth(monthKey);
}

async function memSavePersonName(name: string): Promise<void> {
  const key = name.trim().toLowerCase().replace(/\s+/g, '_');
  if (!key) return;
  memPersons.set(key, name.trim());
}

async function memGetAllPersonNamesDisplay(): Promise<string[]> {
  return [...memPersons.values()].sort((a, b) => a.localeCompare(b, 'id'));
}

// ═══════════════════════════════════════════════════════════════════
// Native: SQLite
// ═══════════════════════════════════════════════════════════════════

let sqliteReady: Promise<SQLite.SQLiteDatabase> | null = null;

function openSqlite(): Promise<SQLite.SQLiteDatabase> {
  if (!sqliteReady) {
    sqliteReady = (async () => {
      const database = await SQLite.openDatabaseAsync('bukukas.db');
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY NOT NULL,
          month_key TEXT NOT NULL,
          date TEXT NOT NULL,
          person TEXT NOT NULL,
          description TEXT NOT NULL,
          credit REAL NOT NULL DEFAULT 0,
          debit REAL NOT NULL DEFAULT 0,
          receipt_base64 TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month_key);
        CREATE TABLE IF NOT EXISTS persons (
          key TEXT PRIMARY KEY NOT NULL,
          display_name TEXT NOT NULL
        );
      `);
      return database;
    })();
  }
  return sqliteReady;
}

function rowToExpense(row: {
  id: string;
  month_key: string;
  date: string;
  person: string;
  description: string;
  credit: number;
  debit: number;
  receipt_base64: string | null;
  created_at: number;
  updated_at: number;
}): Expense {
  return {
    id: row.id,
    date: row.date,
    person: row.person,
    description: row.description,
    credit: row.credit,
    debit: row.debit,
    receiptBase64: row.receipt_base64,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function sqlLoadMonth(monthKey: string): Promise<Expense[]> {
  const database = await openSqlite();
  const rows = await database.getAllAsync<{
    id: string;
    month_key: string;
    date: string;
    person: string;
    description: string;
    credit: number;
    debit: number;
    receipt_base64: string | null;
    created_at: number;
    updated_at: number;
  }>(
    `SELECT id, month_key, date, person, description, credit, debit, receipt_base64, created_at, updated_at
     FROM expenses WHERE month_key = ? ORDER BY date ASC, created_at ASC`,
    monthKey,
  );
  return rows.map(rowToExpense);
}

async function sqlAddExpense(monthKey: string, expense: Omit<Expense, 'id'>): Promise<string> {
  const id = newId();
  const database = await openSqlite();
  await database.runAsync(
    `INSERT INTO expenses (id, month_key, date, person, description, credit, debit, receipt_base64, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    monthKey,
    expense.date,
    expense.person,
    expense.description,
    expense.credit,
    expense.debit,
    expense.receiptBase64,
    expense.createdAt,
    expense.updatedAt,
  );
  notifyMonth(monthKey);
  return id;
}

async function sqlUpdateExpense(monthKey: string, id: string, expense: Omit<Expense, 'id'>): Promise<void> {
  const database = await openSqlite();
  await database.runAsync(
    `UPDATE expenses SET date = ?, person = ?, description = ?, credit = ?, debit = ?, receipt_base64 = ?, created_at = ?, updated_at = ?
     WHERE id = ? AND month_key = ?`,
    expense.date,
    expense.person,
    expense.description,
    expense.credit,
    expense.debit,
    expense.receiptBase64,
    expense.createdAt,
    expense.updatedAt,
    id,
    monthKey,
  );
  notifyMonth(monthKey);
}

async function sqlDeleteExpense(monthKey: string, id: string): Promise<void> {
  const database = await openSqlite();
  await database.runAsync(`DELETE FROM expenses WHERE id = ? AND month_key = ?`, id, monthKey);
  notifyMonth(monthKey);
}

async function sqlSavePersonName(name: string): Promise<void> {
  const key = name.trim().toLowerCase().replace(/\s+/g, '_');
  if (!key) return;
  const database = await openSqlite();
  await database.runAsync(
    `INSERT OR REPLACE INTO persons (key, display_name) VALUES (?, ?)`,
    key,
    name.trim(),
  );
}

async function sqlGetAllPersonNamesDisplay(): Promise<string[]> {
  const database = await openSqlite();
  const rows = await database.getAllAsync<{ display_name: string }>(
    `SELECT display_name FROM persons ORDER BY display_name COLLATE NOCASE ASC`,
  );
  return rows.map((r) => r.display_name);
}

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

const isWeb = Platform.OS === 'web';

export function subscribeToMonthExpenses(
  monthKey: string,
  callback: (expenses: Expense[]) => void,
): () => void {
  let cancelled = false;
  const pump = async () => {
    if (cancelled) return;
    try {
      const list = isWeb ? memLoadMonth(monthKey) : await sqlLoadMonth(monthKey);
      if (!cancelled) callback(list);
    } catch (e) {
      if (!cancelled) callback([]);
    }
  };

  pump();
  const onRefresh = () => {
    pump();
  };
  subscribeMonth(monthKey, onRefresh);

  return () => {
    cancelled = true;
    unsubscribeMonth(monthKey, onRefresh);
  };
}

export async function addExpense(monthKey: string, expense: Omit<Expense, 'id'>): Promise<string> {
  return isWeb ? memAddExpense(monthKey, expense) : sqlAddExpense(monthKey, expense);
}

export async function updateExpense(
  monthKey: string,
  id: string,
  expense: Omit<Expense, 'id'>,
): Promise<void> {
  return isWeb ? memUpdateExpense(monthKey, id, expense) : sqlUpdateExpense(monthKey, id, expense);
}

export async function deleteExpense(monthKey: string, id: string): Promise<void> {
  return isWeb ? memDeleteExpense(monthKey, id) : sqlDeleteExpense(monthKey, id);
}

export async function getAllPersonNames(): Promise<string[]> {
  const all = await getAllPersonNamesDisplay();
  return all.map((n) => n.toLowerCase().replace(/\s+/g, '_'));
}

export async function savePersonName(name: string): Promise<void> {
  return isWeb ? memSavePersonName(name) : sqlSavePersonName(name);
}

export async function getAllPersonNamesDisplay(): Promise<string[]> {
  return isWeb ? memGetAllPersonNamesDisplay() : sqlGetAllPersonNamesDisplay();
}
