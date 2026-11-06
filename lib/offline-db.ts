/**
 * Gestion du stockage IndexedDB pour le mode hors ligne UniConnect.
 * Permet à l'enseignant d'émarger sans connexion et de synchroniser automatiquement dès le retour du réseau.
 */

const DB_NAME = 'uniconnect_offline_db';
const DB_VERSION = 2;
const STORE_PENDING_ABSENCES = 'pending_absences';
const STORE_CACHE = 'view_cache';

export interface PendingAttendanceBatch {
  id?: number;
  seanceId: string;
  date: string;
  records: {
    etudiantId: string;
    statut: 'absent' | 'retard' | 'present';
    justifiee?: boolean;
    remarque?: string;
  }[];
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non disponible dans cet environnement'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PENDING_ABSENCES)) {
        db.createObjectStore(STORE_PENDING_ABSENCES, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sauvegarder une feuille d'appel dans la file d'attente hors ligne
 */
export async function saveOfflineAttendance(batch: Omit<PendingAttendanceBatch, 'id' | 'timestamp'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING_ABSENCES, 'readwrite');
    const store = tx.objectStore(STORE_PENDING_ABSENCES);
    const item: PendingAttendanceBatch = {
      ...batch,
      timestamp: Date.now(),
    };
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Récupérer toutes les feuilles d'appel en attente de synchronisation
 */
export async function getPendingAttendances(): Promise<PendingAttendanceBatch[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING_ABSENCES, 'readonly');
      const store = tx.objectStore(STORE_PENDING_ABSENCES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Supprimer une feuille d'appel synchronisée avec succès
 */
export async function removePendingAttendance(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING_ABSENCES, 'readwrite');
    const store = tx.objectStore(STORE_PENDING_ABSENCES);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Vider toutes les saisies synchronisées
 */
export async function clearAllPending(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING_ABSENCES, 'readwrite');
    const store = tx.objectStore(STORE_PENDING_ABSENCES);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Sauvegarde de consultation locale (Emploi du temps, Notes, Absences)
 */
export async function cacheViewData(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CACHE, 'readwrite');
    const store = tx.objectStore(STORE_CACHE);
    store.put({ key, data, updatedAt: Date.now() });
  } catch {
    // ignore
  }
}

export async function getCachedViewData<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
