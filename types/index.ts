export type Expense = {
  id: string;
  date: string;           // ISO "YYYY-MM-DD"
  person: string;         // Reporter / entered by (single-user or small team)
  description: string;
  credit: number;         // integer IDR, >= 0
  debit: number;          // integer IDR, >= 0
  receiptBase64: string | null;  // "data:image/jpeg;base64,..." stored in Firebase DB
  createdAt: number;      // unix ms
  updatedAt: number;
};

export type RootStackParamList = {
  Home: undefined;
  Entry: { expense?: Expense; monthKey: string } | undefined;
  Settings: undefined;
};
