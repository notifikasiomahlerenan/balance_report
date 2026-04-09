import {
  ref,
  push,
  set,
  remove,
  onValue,
  get,
  off,
} from 'firebase/database';
import { db } from '../constants/firebase';
import { Expense } from '../types';

// ─── Expenses CRUD (Firebase Realtime Database) ───────────────────

type LegacyStoredExpense = Omit<Expense, 'id' | 'credit' | 'debit'> & {
  amount?: number;
  credit?: number;
  debit?: number;
};

function toNumberOrZero(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function subscribeToMonthExpenses(
  monthKey: string,
  callback: (expenses: Expense[]) => void,
): () => void {
  const monthRef = ref(db, `expenses/${monthKey}`);
  const listener = onValue(monthRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const list: Expense[] = Object.entries(data).map(([id, val]) => ({
      id,
      ...(() => {
        const raw = val as LegacyStoredExpense;
        const credit = toNumberOrZero(raw.credit);
        const debit = toNumberOrZero(raw.debit);
        const legacyAmount = toNumberOrZero(raw.amount);

        const finalCredit = credit > 0 ? credit : 0;
        const finalDebit = debit > 0 ? debit : legacyAmount > 0 ? legacyAmount : 0;

        return {
          date: String(raw.date),
          person: String(raw.person ?? ''),
          description: String(raw.description ?? ''),
          credit: finalCredit,
          debit: finalDebit,
          receiptBase64: (raw.receiptBase64 as string | null) ?? null,
          createdAt: toNumberOrZero(raw.createdAt),
          updatedAt: toNumberOrZero(raw.updatedAt),
        } satisfies Omit<Expense, 'id'>;
      })(),
    }));
    list.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    callback(list);
  });
  return () => off(monthRef, 'value', listener);
}

export async function addExpense(
  monthKey: string,
  expense: Omit<Expense, 'id'>,
): Promise<string> {
  const monthRef = ref(db, `expenses/${monthKey}`);
  const newRef = push(monthRef);
  await set(newRef, expense);
  return newRef.key!;
}

export async function updateExpense(
  monthKey: string,
  id: string,
  expense: Omit<Expense, 'id'>,
): Promise<void> {
  const expRef = ref(db, `expenses/${monthKey}/${id}`);
  await set(expRef, expense);
}

export async function deleteExpense(monthKey: string, id: string): Promise<void> {
  const expRef = ref(db, `expenses/${monthKey}/${id}`);
  await remove(expRef);
}

export async function getAllPersonNames(): Promise<string[]> {
  const personsRef = ref(db, 'persons');
  const snapshot = await get(personsRef);
  if (!snapshot.exists()) return [];
  return Object.keys(snapshot.val() as Record<string, boolean>);
}

export async function savePersonName(name: string): Promise<void> {
  const key = name.trim().toLowerCase().replace(/\s+/g, '_');
  if (!key) return;
  const personRef = ref(db, `persons/${key}`);
  await set(personRef, name.trim());
}

export async function getAllPersonNamesDisplay(): Promise<string[]> {
  const personsRef = ref(db, 'persons');
  const snapshot = await get(personsRef);
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val() as Record<string, string>);
}
