import { firebaseConfig } from "./firebase-config.js";

// Auxiliar para carregar o arquivo .env via fetch em tempo de execução
export async function loadEnv() {
  try {
    const response = await fetch('./.env');
    if (!response.ok) return {};
    const text = await response.text();
    const env = {};
    text.split(/\r?\n/).forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && !key.startsWith('#')) {
          env[key] = value;
        }
      }
    });
    return env;
  } catch (e) {
    console.warn("Não foi possível carregar o arquivo .env:", e);
    return {};
  }
}

// Verifica se as credenciais do Firebase foram configuradas (via arquivo config ou .env)
export async function getFirebaseConfig() {
  // 1. Tenta usar o arquivo de configuração JS estático primeiro (evita problemas de CORS/dotfiles em hospedagem)
  if (firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("sua_api_key")) {
    return firebaseConfig;
  }

  // 2. Fallback para carregar do arquivo .env via fetch
  const env = await loadEnv();
  const apiKey = env.FIREBASE_API_KEY;
  const authDomain = env.FIREBASE_AUTH_DOMAIN;
  const projectId = env.FIREBASE_PROJECT_ID;
  const storageBucket = env.FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = env.FIREBASE_MESSAGING_SENDER_ID;
  const appId = env.FIREBASE_APP_ID;
  
  if (!apiKey || apiKey.includes("sua_api_key_aqui")) {
    return null; // Caso não configurado, ativa o modo simulação
  }
  
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  };
}
