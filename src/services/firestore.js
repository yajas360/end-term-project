// Firestore CRUD operations for MedTrack AI
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================
// MEDICATIONS CRUD
// ============================================================

/** Get all medications for a user */
export function subscribeMedications(userId, callback) {
  const q = query(
    collection(db, 'medications'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snap) => {
    const meds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort client-side to avoid needing a composite index
    meds.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    callback(meds);
  }, (err) => {
    console.warn('subscribeMedications error:', err.message);
    callback([]);
  });
}

/** Add a new medication */
export async function addMedication(userId, med) {
  return addDoc(collection(db, 'medications'), {
    ...med,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Update an existing medication */
export async function updateMedication(medId, updates) {
  return updateDoc(doc(db, 'medications', medId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a medication */
export async function deleteMedication(medId) {
  return deleteDoc(doc(db, 'medications', medId));
}

// ============================================================
// DOSE INTAKE LOGS (Daily Intake Tracking)
// ============================================================

/** Subscribe to today's intake logs for a user */
export function subscribeIntakeLogs(userId, dateStr, callback) {
  const q = query(
    collection(db, 'intakeLogs'),
    where('userId', '==', userId),
    where('date', '==', dateStr)
  );
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(logs);
  }, (err) => {
    console.warn('subscribeIntakeLogs error:', err.message);
    callback([]);
  });
}

/** Subscribe to all intake logs for a user (for history) */
export function subscribeAllIntakeLogs(userId, callback) {
  const q = query(
    collection(db, 'intakeLogs'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort client-side to avoid needing a composite index
    logs.sort((a, b) => {
      const aTime = a.takenAt?.toMillis?.() || 0;
      const bTime = b.takenAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    callback(logs);
  }, (err) => {
    console.warn('subscribeAllIntakeLogs error:', err.message);
    callback([]);
  });
}

/** Log a dose taken */
export async function logDoseTaken(userId, log) {
  return addDoc(collection(db, 'intakeLogs'), {
    ...log,
    userId,
    takenAt: serverTimestamp(),
  });
}

/** Delete an intake log (undo) */
export async function deleteIntakeLog(logId) {
  return deleteDoc(doc(db, 'intakeLogs', logId));
}

// ============================================================
// PRN LOGS (As-Needed Medication Logs)
// ============================================================

/** Subscribe to PRN logs for a user */
export function subscribePRNLogs(userId, callback) {
  const q = query(
    collection(db, 'prnLogs'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Sort client-side to avoid needing a composite index
    logs.sort((a, b) => {
      const aTime = a.takenAt?.toMillis?.() || 0;
      const bTime = b.takenAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    callback(logs);
  }, (err) => {
    console.warn('subscribePRNLogs error:', err.message);
    callback([]);
  });
}

/** Log a PRN medication */
export async function logPRN(userId, log) {
  return addDoc(collection(db, 'prnLogs'), {
    ...log,
    userId,
    takenAt: serverTimestamp(),
  });
}

/** Delete a PRN log */
export async function deletePRNLog(logId) {
  return deleteDoc(doc(db, 'prnLogs', logId));
}

// ============================================================
// USER HEALTH PROFILE
// ============================================================

/** Get user health profile */
export async function getUserProfile(userId) {
  const docRef = doc(db, 'userProfiles', userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Subscribe to user health profile */
export function subscribeUserProfile(userId, callback) {
  return onSnapshot(doc(db, 'userProfiles', userId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, (err) => {
    console.warn('subscribeUserProfile error:', err.message);
    callback(null);
  });
}

/** Save user health profile (upsert — creates if not found) */
export async function saveUserProfile(userId, profile) {
  const docRef = doc(db, 'userProfiles', userId);
  return setDoc(docRef, {
    ...profile,
    userId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ============================================================
// DOCTOR REPORT GENERATION
// ============================================================

/** Get all data needed for doctor report */
export async function getDoctorReportData(userId) {
  const [medsSnap, logsSnap, prnSnap, profileSnap] = await Promise.all([
    getDocs(query(collection(db, 'medications'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'intakeLogs'), where('userId', '==', userId))),
    getDocs(query(collection(db, 'prnLogs'), where('userId', '==', userId))),
    getDoc(doc(db, 'userProfiles', userId)),
  ]);

  return {
    medications: medsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    intakeLogs: logsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    prnLogs: prnSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    profile: profileSnap.exists() ? profileSnap.data() : null,
  };
}
