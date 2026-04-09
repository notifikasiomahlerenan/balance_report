/**
 * Persistence entry point. Set DATA_BACKEND in constants/dataBackend.ts.
 */
import { DATA_BACKEND } from '../constants/dataBackend';
import type { Expense } from '../types';
import * as firebaseDb from './db.firebase';
import * as sqliteDb from './db.sqlite';

const impl = DATA_BACKEND === 'firebase' ? firebaseDb : sqliteDb;

export const subscribeToMonthExpenses: (
  monthKey: string,
  callback: (expenses: Expense[]) => void,
) => () => void = impl.subscribeToMonthExpenses;

export const addExpense: (monthKey: string, expense: Omit<Expense, 'id'>) => Promise<string> =
  impl.addExpense;

export const updateExpense: (
  monthKey: string,
  id: string,
  expense: Omit<Expense, 'id'>,
) => Promise<void> = impl.updateExpense;

export const deleteExpense: (monthKey: string, id: string) => Promise<void> = impl.deleteExpense;

export const getAllPersonNames: () => Promise<string[]> = impl.getAllPersonNames;

export const savePersonName: (name: string) => Promise<void> = impl.savePersonName;

export const getAllPersonNamesDisplay: () => Promise<string[]> = impl.getAllPersonNamesDisplay;
