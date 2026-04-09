/**
 * Switch persistence layer. Firebase = previous cloud RTDB snapshot; sqlite = on-device DB.
 * Expo Web uses an in-memory stub when backend is sqlite (expo-sqlite has no web support).
 */
export type DataBackend = 'firebase' | 'sqlite';

export const DATA_BACKEND: DataBackend = 'sqlite';
