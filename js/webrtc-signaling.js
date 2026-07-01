import { firebaseConfig } from "./firebase-config.js";
import { state } from "./state.js";
import { logger } from "./logger.js";

let firebaseInstance = null;

async function initFirebase() {
  if (firebaseInstance) return firebaseInstance;

  const { initializeApp, getApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
  const { getFirestore, collection, doc, setDoc, deleteDoc, getDoc, getDocs, onSnapshot, Timestamp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
  const { getAuth, signInAnonymously, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");

  let app;
  try {
    app = getApp();
  } catch {
    app = initializeApp(firebaseConfig);
  }

  const db = getFirestore(app);
  const auth = getAuth(app);

  firebaseInstance = { db, auth, collection, doc, setDoc, deleteDoc, getDoc, getDocs, onSnapshot, signInAnonymously, onAuthStateChanged, Timestamp };
  return firebaseInstance;
}

function generateRoomCode() {
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
        resolve(user);
      } else {
        fb.signInAnonymously(fb.auth)
          .then((cred) => resolve(cred.user))
          .catch((err) => reject(new Error("Falha na autenticação: " + err.message)));
      }
    });
  });
}

export async function createRoom(playerName, existingRoomId) {
  await ensureAuth();
  const fb = await initFirebase();
  const roomId = existingRoomId || generateRoomCode();
  const playerId = "player_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  const roomData = {
    hostId: playerId,
    hostName: playerName,
    createdAt: Date.now(),
    expireAt: fb.Timestamp.fromMillis(Date.now() + 86400000),
    players: { [playerId]: { name: playerName, joinedAt: Date.now() } }
  };
  await fb.setDoc(fb.doc(fb.db, "rooms", roomId), roomData);
  return { roomId, playerId };
}

export async function joinRoom(roomId, playerName) {
  await ensureAuth();
  const fb = await initFirebase();
  const roomRef = fb.doc(fb.db, "rooms", roomId);
  const roomSnap = await fb.getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error("Sala não encontrada");
  const roomData = roomSnap.data();
  const players = roomData.players || {};
  const playerCount = Object.keys(players).length;
  if (playerCount >= 6) throw new Error("Sala cheia (max 6 jogadores)");

  const playerId = "player_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  players[playerId] = { name: playerName, joinedAt: Date.now() };
  await fb.setDoc(roomRef, { ...roomData, players }, { merge: true });
  return { roomId, playerId, hostId: roomData.hostId, players };
}

export async function leaveRoom(roomId, playerId) {
  const fb = await initFirebase();
  const roomRef = fb.doc(fb.db, "rooms", roomId);
  const roomSnap = await fb.getDoc(roomRef);
  if (!roomSnap.exists()) return;
  const roomData = roomSnap.data();
  const players = roomData.players || {};
  delete players[playerId];
  if (Object.keys(players).length === 0) {
    await fb.deleteDoc(roomRef);
  } else {
    const updates = { players };
    if (roomData.hostId === playerId) {
      updates.hostId = Object.keys(players)[0];
    }
    await fb.setDoc(roomRef, { ...roomData, ...updates }, { merge: true });
  }
}

export function listenRoom(roomId, onUpdate) {
  let unsub = null;
  initFirebase().then(fb => {
    unsub = fb.onSnapshot(fb.doc(fb.db, "rooms", roomId), (snap) => {
      if (snap.exists()) onUpdate(snap.data());
    });
  });
  return () => { if (unsub) unsub(); };
}

export async function saveSignal(roomId, from, to, signal) {
  const fb = await initFirebase();
  const signalId = `${from}_${to}`;
  await fb.setDoc(fb.doc(fb.db, "rooms", roomId, "signals", signalId), { from, to, ...signal, createdAt: Date.now() });
}

export async function deleteSignal(roomId, from, to) {
  const fb = await initFirebase();
  const signalId = `${from}_${to}`;
  await fb.deleteDoc(fb.doc(fb.db, "rooms", roomId, "signals", signalId));
}

export function listenSignals(roomId, targetPlayerId, onSignal) {
  initFirebase().then(fb => {
    fb.onSnapshot(fb.collection(fb.db, "rooms", roomId, "signals"), (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.to === targetPlayerId) {
            onSignal(data);
          }
        }
      });
    });
  });
}

export async function saveCandidate(roomId, from, to, candidate) {
  const fb = await initFirebase();
  const candidateId = `${from}_${to}_${Date.now()}`;
  await fb.setDoc(fb.doc(fb.db, "rooms", roomId, "candidates", candidateId), { from, to, candidate, createdAt: Date.now() });
}

export function listenCandidates(roomId, targetPlayerId, onCandidate) {
  initFirebase().then(fb => {
    fb.onSnapshot(fb.collection(fb.db, "rooms", roomId, "candidates"), (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.to === targetPlayerId) {
            onCandidate(data.candidate, data.from);
          }
        }
      });
    });
  });
}

export async function cleanupRoomSignals(roomId) {
  const fb = await initFirebase();
  const signalsSnap = await fb.getDocs(fb.collection(fb.db, "rooms", roomId, "signals"));
  await Promise.all(signalsSnap.docs.map(d => fb.deleteDoc(d.ref)));
  const candidatesSnap = await fb.getDocs(fb.collection(fb.db, "rooms", roomId, "candidates"));
  await Promise.all(candidatesSnap.docs.map(d => fb.deleteDoc(d.ref)));
}

export async function deleteRoomFirestore(roomId) {
  const fb = await initFirebase();
  await cleanupRoomSignals(roomId);
  await fb.deleteDoc(fb.doc(fb.db, "rooms", roomId));
}
