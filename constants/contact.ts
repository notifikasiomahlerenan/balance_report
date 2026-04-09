/**
 * Kontak & URL publik (sesuai yang Anda tentukan).
 *
 * Dev: setelah situs kebijakan/ketentuan siap, isi PRIVACY_POLICY_URL dan TERMS_OF_USE_URL —
 * tombol "Situs" muncul di layar legal. PLAY_STORE_LISTING_URL mengaktifkan Nilai/Bagikan.
 */
export const APP_CONTACT = {
  supportEmail: 'support@omahlerenan.biz.id',
  supportBukuKasEmail: 'support.bukukas@omahlerenan.biz.id',
  privacyEmail: 'kebijakan.privasi@omahlerenan.biz.id',
  termsEmail: 'ketentuan.penggunaan@omahlerenan.biz.id',
} as const;

/** Setelah publikasi: paste URL listing Play Store di sini. */
export const PLAY_STORE_LISTING_URL: string | null = null;

/**
 * Halaman web publik (opsional, untuk Play Console / bagikan tautan yang sama dengan isi in-app).
 * Isi ketika situs siap; tombol "Situs" akan muncul di layar kebijakan/ketentuan.
 */
export const PRIVACY_POLICY_URL: string | null = null;
export const TERMS_OF_USE_URL: string | null = null;
