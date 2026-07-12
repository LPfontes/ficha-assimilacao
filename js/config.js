import { firebaseConfig } from "./firebase-config.js";

// Variáveis diretas de produção (usadas como fallback no GitHub Pages)
const githubPagesEnv = {
  FIREBASE_API_KEY: "AIzaSyAEMMU09UgGVdZlfcmTfcrgKAfgo-QVnxw",
  FIREBASE_AUTH_DOMAIN: "fichaassimilacao-be0ef.firebaseapp.com",
  FIREBASE_PROJECT_ID: "fichaassimilacao-be0ef",
  FIREBASE_STORAGE_BUCKET: "fichaassimilacao-be0ef.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: "631521996104",
  FIREBASE_APP_ID: "1:631521996104:web:547f5bed92e2524732577d",
  GCS_BUCKET_NAME: "mesa_assimilacao",
  WS_SERVER_URL: "wss://mesa-server-631521996104.southamerica-east1.run.app"
};

// Auxiliar para carregar o arquivo .env via fetch em tempo de execução
export async function loadEnv() {
  try {
    const response = await fetch('./.env');
    if (!response.ok) {
      // Se der erro 404 (comum no GitHub Pages), retorna as variáveis diretas
      return githubPagesEnv;
    }
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
    console.warn("Não foi possível carregar o arquivo .env local, usando dados diretos:", e);
    return githubPagesEnv;
  }
}

// Verifica se as credenciais do Firebase foram configuradas (via arquivo config ou .env)
export async function getFirebaseConfig() {
  // 1. Tenta usar o arquivo de configuração JS estático primeiro
  if (firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("sua_api_key")) {
    return firebaseConfig;
  }

  // 2. Fallback para carregar do arquivo .env ou o objeto do GitHub Pages
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

// Se você precisar acessar as outras duas variáveis em outros arquivos:
export async function getExtraConfigs() {
  const env = await loadEnv();
  return {
    gcsBucketName: env.GCS_BUCKET_NAME,
    wsServerUrl: env.WS_SERVER_URL
  };
}