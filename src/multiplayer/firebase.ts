import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const RUNTIME_KEY = 'anchorgrid-firebase-config';

type ClientFirebaseConfig = FirebaseOptions & { databaseURL?: string };

function isComplete(config: ClientFirebaseConfig | null | undefined) {
  return Boolean(
    config?.apiKey &&
    config?.authDomain &&
    config?.databaseURL &&
    config?.projectId &&
    config?.appId
  );
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return decodeURIComponent(
    Array.from(atob(padded))
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
  );
}

function encodeBase64Url(value: string) {
  const bytes = unescape(encodeURIComponent(value));
  return btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function readRuntimeConfig(): ClientFirebaseConfig | null {
  if (typeof window === 'undefined') return null;

  const query = new URLSearchParams(window.location.search).get('cfg');
  if (query) {
    try {
      const parsed = JSON.parse(decodeBase64Url(query)) as ClientFirebaseConfig;
      if (isComplete(parsed)) {
        localStorage.setItem(RUNTIME_KEY, JSON.stringify(parsed));
        return parsed;
      }
    } catch {
      // Ignore malformed invite configuration and continue with local/env config.
    }
  }

  try {
    const saved = localStorage.getItem(RUNTIME_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as ClientFirebaseConfig;
    return isComplete(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const envConfig: ClientFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const runtimeConfig = readRuntimeConfig();
const config: ClientFirebaseConfig = isComplete(envConfig) ? envConfig : (runtimeConfig ?? envConfig);

export const firebaseConfigSource: 'env' | 'runtime' | 'missing' = isComplete(envConfig)
  ? 'env'
  : isComplete(runtimeConfig)
    ? 'runtime'
    : 'missing';

export const firebaseConfigured = isComplete(config);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Database | null = null;

if (firebaseConfigured) {
  app = initializeApp(config);
  auth = getAuth(app);
  database = getDatabase(app);
}

export function saveRuntimeFirebaseConfig(raw: string) {
  let source = raw.trim();
  if (!source) throw new Error('Pega la configuración web de Firebase.');

  // Accept either raw JSON or the common `const firebaseConfig = { ... };` snippet.
  const firstBrace = source.indexOf('{');
  const lastBrace = source.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) source = source.slice(firstBrace, lastBrace + 1);

  // Firebase Console usually gives valid JS object syntax. Convert the most common
  // unquoted keys/single quotes into JSON to make paste setup less fussy.
  source = source
    .replace(/([,{]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
    .replace(/'/g, '"')
    .replace(/,\s*}/g, '}');

  let parsed: ClientFirebaseConfig;
  try {
    parsed = JSON.parse(source) as ClientFirebaseConfig;
  } catch {
    throw new Error('No pude leer esa configuración. Pega el objeto firebaseConfig completo.');
  }

  if (!isComplete(parsed)) {
    throw new Error('Faltan apiKey, authDomain, databaseURL, projectId o appId.');
  }

  localStorage.setItem(RUNTIME_KEY, JSON.stringify(parsed));
  window.location.reload();
}

export function clearRuntimeFirebaseConfig() {
  localStorage.removeItem(RUNTIME_KEY);
  window.location.reload();
}

/** Runtime-only config is public Firebase client metadata, so it can ride with a private-room invite. */
export function getShareableFirebaseConfigParam() {
  if (firebaseConfigSource !== 'runtime' || !runtimeConfig) return null;
  return encodeBase64Url(JSON.stringify(runtimeConfig));
}

export function getFirebase() {
  if (!firebaseConfigured || !auth || !database) {
    throw new Error('Las salas privadas aún no están conectadas a Firebase.');
  }
  return { app: app!, auth, database };
}

export async function ensureAnonymousUser() {
  const { auth } = getFirebase();
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}
