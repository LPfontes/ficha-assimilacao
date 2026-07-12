import { firebaseConfig } from "./firebase-config.js";
import { state } from "./state.js";
import { logger } from "./logger.js";

let firebaseInstance = null;

async function initFirebase() {
  if (firebaseInstance) return firebaseInstance;

  const { initializeApp, getApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
  const { getFirestore, collection, doc, setDoc, deleteDoc, getDoc, getDocs, updateDoc, onSnapshot, arrayUnion, arrayRemove } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
  const { getAuth, signInAnonymously, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");

  let app;
  try {
    app = getApp();
  } catch {
    app = initializeApp(firebaseConfig);
  }

  const db = getFirestore(app);
  const auth = getAuth(app);

  firebaseInstance = { db, auth, collection, doc, setDoc, deleteDoc, getDoc, getDocs, updateDoc, onSnapshot, arrayUnion, arrayRemove, signInAnonymously, onAuthStateChanged };
  return firebaseInstance;
}

function generateMesaCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function ensureAuth() {
  const fb = await initFirebase();
  return new Promise((resolve, reject) => {
    const unsub = fb.onAuthStateChanged(fb.auth, (user) => {
      unsub();
      if (user) {
        if (!state.currentUser) {
          state.currentUser = {
            uid: user.uid,
            displayName: user.displayName || "Jogador"
          };
        } else {
          state.currentUser.uid = user.uid;
        }
        localStorage.setItem("assimilação_mock_user", JSON.stringify(state.currentUser));
        resolve(user);
      } else {
        fb.signInAnonymously(fb.auth)
          .then((cred) => {
            const u = cred.user;
            if (!state.currentUser) {
              state.currentUser = {
                uid: u.uid,
                displayName: u.displayName || "Jogador"
              };
            } else {
              state.currentUser.uid = u.uid;
            }
            localStorage.setItem("assimilação_mock_user", JSON.stringify(state.currentUser));
            resolve(u);
          })
          .catch((err) => reject(new Error("Falha na autenticação: " + err.message)));
      }
    });
  });
}

// Criar nova campanha no Firestore
export async function criarCampanha(nomeCampanha, nomeMestre) {
  const user = await ensureAuth();
  const fb = await initFirebase();
  const code = generateMesaCode();
  
  const mesaData = {
    id: code,
    nome: nomeCampanha,
    mestreId: user.uid,
    mestreNome: nomeMestre,
    createdAt: Date.now(),
    sessaoAtiva: false,
    contas: {
      "mestre": {
        id: "mestre",
        name: nomeMestre,
        role: "mestre",
        ownerId: user.uid,
        fichaId: null
      }
    },
    fichas: {},
    notas: [],
    eventos: [],
    historia: []
  };

  await fb.setDoc(fb.doc(fb.db, "rooms", code + "_camp"), mesaData);
  logger.info(`Mesa criada com sucesso: ${nomeCampanha} (Código: ${code})`);
  return mesaData;
}

// Entrar em uma campanha existente
export async function entrarCampanha(codigoMesa) {
  await ensureAuth();
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", codigoMesa.toUpperCase() + "_camp");
  const docSnap = await fb.getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Campanha não encontrada! Verifique o código.");
  }

  return docSnap.data();
}

// Compartilhar uma ficha na campanha
export async function compartilharFicha(mesaId, fichaObj, donoId, donoNome) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  
  // Limpar referências circulares ou funções antes do upload
  const cleanFicha = JSON.parse(JSON.stringify(fichaObj));
  
  const payload = {
    [`fichas.${fichaObj.id}`]: {
      id: fichaObj.id,
      nome: fichaObj.name || fichaObj.nome || "Sem nome",
      tipo: fichaObj._sheetType || "infectado",
      donoId: donoId,
      donoNome: donoNome,
      data: cleanFicha
    }
  };

  await fb.updateDoc(docRef, payload);
  logger.info(`Ficha "${cleanFicha.name}" compartilhada na mesa ${mesaId}`);
}

// Descompartilhar/Remover ficha da campanha
export async function removerFichaCompartilhada(mesaId, fichaId) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  const docSnap = await fb.getDoc(docRef);

  if (!docSnap.exists()) return;
  const mesaData = docSnap.data();
  
  if (mesaData.fichas && mesaData.fichas[fichaId]) {
    const updatedFichas = { ...mesaData.fichas };
    delete updatedFichas[fichaId];
    await fb.updateDoc(docRef, { fichas: updatedFichas });
    logger.info(`Ficha ${fichaId} removida da mesa ${mesaId}`);
  }
}

// Adicionar nota na campanha
export async function adicionarNota(mesaId, titulo, conteudo, autor) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  
  const novaNota = {
    id: "nota_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    titulo,
    conteudo,
    autor,
    timestamp: Date.now()
  };

  await fb.updateDoc(docRef, {
    notas: fb.arrayUnion(novaNota)
  });
}

// Excluir nota da campanha
export async function removerNota(mesaId, notaId) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  const docSnap = await fb.getDoc(docRef);

  if (!docSnap.exists()) return;
  const mesaData = docSnap.data();
  const notaToRemove = (mesaData.notas || []).find(n => n.id === notaId);

  if (notaToRemove) {
    await fb.updateDoc(docRef, {
      notas: fb.arrayRemove(notaToRemove)
    });
  }
}

// Adicionar evento na campanha
export async function adicionarEvento(mesaId, titulo, descricao, dataHora) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");

  const novoEvento = {
    id: "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    titulo,
    descricao,
    dataHora,
    status: "ativo",
    timestamp: Date.now()
  };

  await fb.updateDoc(docRef, {
    eventos: fb.arrayUnion(novoEvento)
  });
}

// Alterar status de um evento (Ex: Resolver)
export async function alterarStatusEvento(mesaId, eventoId, novoStatus) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  const docSnap = await fb.getDoc(docRef);

  if (!docSnap.exists()) return;
  const mesaData = docSnap.data();
  const eventos = mesaData.eventos || [];
  
  const updatedEventos = eventos.map(evt => {
    if (evt.id === eventoId) {
      return { ...evt, status: novoStatus };
    }
    return evt;
  });

  await fb.updateDoc(docRef, { eventos: updatedEventos });
}

// Excluir evento
export async function removerEvento(mesaId, eventoId) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  const docSnap = await fb.getDoc(docRef);

  if (!docSnap.exists()) return;
  const mesaData = docSnap.data();
  const evtToRemove = (mesaData.eventos || []).find(e => e.id === eventoId);

  if (evtToRemove) {
    await fb.updateDoc(docRef, {
      eventos: fb.arrayRemove(evtToRemove)
    });
  }
}

// Adicionar crônica / história
export async function adicionarHistoria(mesaId, texto, autor) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");

  const novaEntrada = {
    id: "hist_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    texto,
    autor,
    timestamp: Date.now()
  };

  await fb.updateDoc(docRef, {
    historia: fb.arrayUnion(novaEntrada)
  });
}

// Excluir entrada da crônica
export async function removerHistoria(mesaId, histId) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  const docSnap = await fb.getDoc(docRef);

  if (!docSnap.exists()) return;
  const mesaData = docSnap.data();
  const histToRemove = (mesaData.historia || []).find(h => h.id === histId);

  if (histToRemove) {
    await fb.updateDoc(docRef, {
      historia: fb.arrayRemove(histToRemove)
    });
  }
}

// Atualizar status da sessão (Ativa / Inativa)
export async function atualizarSessaoAtiva(mesaId, ativa) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  await fb.updateDoc(docRef, { sessaoAtiva: ativa });
}

// Escuta em tempo real da mesa
export async function escutarCampanha(mesaId, callback) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  
  return fb.onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      logger.warn(`Mesa ${mesaId} não encontrada na escuta.`);
    }
  });
}

// Gerar código de compartilhamento na nuvem para uma ficha
export async function gerarCodigoCompartilhamento(fichaObj) {
  const fb = await initFirebase();
  const code = generateMesaCode();
  const docRef = fb.doc(fb.db, "rooms", "share_" + code);
  
  const cleanFicha = JSON.parse(JSON.stringify(fichaObj));
  
  await fb.setDoc(docRef, {
    code: code,
    tipo: fichaObj._sheetType || "infectado",
    data: cleanFicha,
    timestamp: Date.now()
  });
  
  return code;
}

// Buscar ficha da nuvem pelo código de compartilhamento
export async function buscarFichaCompartilhada(code) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", "share_" + code.toUpperCase());
  const docSnap = await fb.getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error("Código de compartilhamento inválido ou expirado.");
  }
  
  return docSnap.data();
}

export async function criarVagaConta(mesaId, nomeConta) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  const contaId = "conta_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  
  const payload = {
    [`contas.${contaId}`]: {
      id: contaId,
      name: nomeConta,
      role: "jogador",
      ownerId: null,
      fichaId: null
    }
  };
  await fb.updateDoc(docRef, payload);
  logger.info(`Vaga "${nomeConta}" criada na mesa ${mesaId}`);
}

export async function removerVagaConta(mesaId, contaId) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  const docSnap = await fb.getDoc(docRef);
  if (!docSnap.exists()) return;
  const mesaData = docSnap.data();
  
  if (mesaData.contas && mesaData.contas[contaId]) {
    const updatedContas = { ...mesaData.contas };
    const fichaId = updatedContas[contaId].fichaId;
    delete updatedContas[contaId];
    
    const updates = { contas: updatedContas };
    if (fichaId && mesaData.fichas && mesaData.fichas[fichaId]) {
      const updatedFichas = { ...mesaData.fichas };
      delete updatedFichas[fichaId];
      updates.fichas = updatedFichas;
    }
    
    await fb.updateDoc(docRef, updates);
    logger.info(`Vaga ${contaId} removida da mesa ${mesaId}`);
  }
}

export async function vincularJogadorConta(mesaId, contaId, userId, userName) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  
  const payload = {
    [`contas.${contaId}.ownerId`]: userId,
    [`contas.${contaId}.ownerName`]: userName
  };
  await fb.updateDoc(docRef, payload);
  logger.info(`Jogador ${userName} vinculado à vaga ${contaId} na mesa ${mesaId}`);
}

export async function desvincularJogadorConta(mesaId, contaId) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  const docSnap = await fb.getDoc(docRef);
  if (!docSnap.exists()) return;
  const mesaData = docSnap.data();
  
  if (mesaData.contas && mesaData.contas[contaId]) {
    const fichaId = mesaData.contas[contaId].fichaId;
    const updates = {
      [`contas.${contaId}.ownerId`]: null,
      [`contas.${contaId}.ownerName`]: null,
      [`contas.${contaId}.fichaId`]: null
    };
    
    if (fichaId && mesaData.fichas && mesaData.fichas[fichaId]) {
      const updatedFichas = { ...mesaData.fichas };
      delete updatedFichas[fichaId];
      updates.fichas = updatedFichas;
    }
    
    await fb.updateDoc(docRef, updates);
    logger.info(`Jogador desvinculado da vaga ${contaId} na mesa ${mesaId}`);
  }
}

export async function vincularFichaConta(mesaId, contaId, fichaObj, donoId, donoNome) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  
  const cleanFicha = JSON.parse(JSON.stringify(fichaObj));
  
  const updates = {
    [`contas.${contaId}.fichaId`]: fichaObj.id,
    [`fichas.${fichaObj.id}`]: {
      id: fichaObj.id,
      nome: fichaObj.name || fichaObj.nome || "Sem nome",
      tipo: fichaObj._sheetType || "infectado",
      donoId: donoId,
      donoNome: donoNome,
      data: cleanFicha
    }
  };
  
  await fb.updateDoc(docRef, updates);
  logger.info(`Ficha "${cleanFicha.name}" vinculada à vaga ${contaId} na mesa ${mesaId}`);
}

export async function desvincularFichaConta(mesaId, contaId) {
  const fb = await initFirebase();
  const docRef = fb.doc(fb.db, "rooms", mesaId + "_camp");
  const docSnap = await fb.getDoc(docRef);
  if (!docSnap.exists()) return;
  const mesaData = docSnap.data();
  
  if (mesaData.contas && mesaData.contas[contaId]) {
    const fichaId = mesaData.contas[contaId].fichaId;
    const updates = {
      [`contas.${contaId}.fichaId`]: null
    };
    
    if (fichaId && mesaData.fichas && mesaData.fichas[fichaId]) {
      const updatedFichas = { ...mesaData.fichas };
      delete updatedFichas[fichaId];
      updates.fichas = updatedFichas;
    }
    
    await fb.updateDoc(docRef, updates);
    logger.info(`Ficha desvinculada da vaga ${contaId} na mesa ${mesaId}`);
  }
}
