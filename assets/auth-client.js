// ============================================================
// ZOOTO — shared Supabase client + auth page UI helpers
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function showError(msg, id = 'auth-error'){
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = msg;
  box.classList.add('show');
}
export function hideError(id = 'auth-error'){
  const box = document.getElementById(id);
  if (box) box.classList.remove('show');
}
export function setLoading(btn, loading){
  if (!btn) return;
  btn.classList.toggle('btn-loading', loading);
  btn.disabled = loading;
}

// Human-readable Ukrainian messages for the Supabase error codes we're
// most likely to hit on this site.
export function friendlyAuthError(err){
  const msg = (err && err.message) || '';
  if (/Invalid login credentials/i.test(msg)) return 'Невірний email або пароль.';
  if (/User already registered/i.test(msg)) return 'Акаунт з таким email вже існує — спробуйте увійти.';
  if (/Password should be at least/i.test(msg)) return 'Пароль надто короткий — мінімум 6 символів.';
  if (/Email not confirmed/i.test(msg)) return 'Підтвердіть email за посиланням з листа перед входом.';
  if (/rate limit/i.test(msg)) return 'Забагато спроб. Спробуйте трохи пізніше.';
  return msg || 'Щось пішло не так. Спробуйте ще раз.';
}

export const GOOGLE_ICON = `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.29 14.3A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.3v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l4.01-3.1Z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z"/></svg>`;

export async function signInWithGoogle(){
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/account-redirect.html' }
  });
}
