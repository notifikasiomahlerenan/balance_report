/**
 * Persistence: local SQLite on native (bukukas.db), in-memory on Expo Web.
 */
export {
  subscribeToMonthExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getAllPersonNames,
  savePersonName,
  getAllPersonNamesDisplay,
} from './db.sqlite';
