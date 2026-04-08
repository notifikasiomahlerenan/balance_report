import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCFmQoFTFuWEz4Bz20fO31PMkAenjV1jl8',
  authDomain: 'expense-report-aab42.firebaseapp.com',
  databaseURL:
    'https://expense-report-aab42-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'expense-report-aab42',
  storageBucket: 'expense-report-aab42.firebasestorage.app',
  messagingSenderId: '81348993430',
  appId: '1:81348993430:web:ce2c0e270983aea9f4bdb7',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getDatabase(app);
