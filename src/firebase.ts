import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { Receipt } from './types';

export const firebaseConfig = {
  projectId: "jumping-river-pmln4",
  appId: "1:216302433019:web:b29797d5bb79e60d99765e",
  apiKey: "AIzaSyDyM8qXdCyxwNgxjybbr7jGBiGKqetsTX8",
  authDomain: "jumping-river-pmln4.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-sistemresithma-62897562-38ee-48a9-b3bd-e80045f26852",
  storageBucket: "jumping-river-pmln4.firebasestorage.app",
  messagingSenderId: "216302433019",
  measurementId: "",
  oAuthClientId: "216302433019-njlbl9gmq9c8gefva1mbtvejoe4f2t34.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export const COLLECTION_NAME = 'receipts';

/**
 * Format simple butiran summary (NAME / DATE / BUTIRAN / TOTAL)
 */
export function getSimpleButiran(r: Partial<Receipt>): string {
  if (r.items && r.items.length > 0) {
    const validItems = r.items.filter(i => i && i.description && i.description.trim().length > 0);
    if (validItems.length > 0) {
      return validItems.map(i => i.description.trim()).join(', ');
    }
  }
  return (r.butiran && r.butiran.trim()) || (r.item && r.item.trim()) || '-';
}

/**
 * Save receipt document to Cloud Firestore
 */
export async function saveReceiptToCloud(receipt: Receipt): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, receipt.id);
  const butiranSummary = getSimpleButiran(receipt);
  
  const payload = {
    id: receipt.id,
    nama: receipt.nama || '',
    tarikh: receipt.tarikh || '',
    butiran: butiranSummary,
    jumlah: Number(receipt.jumlah) || 0,
    item: receipt.item || butiranSummary,
    alamat: receipt.alamat || '',
    paymentMethod: receipt.paymentMethod || 'CASH',
    kategori: receipt.kategori || 'GUAMAN',
    bakiTerdahulu: Number(receipt.bakiTerdahulu) || 0,
    items: receipt.items || [],
    documentType: receipt.documentType || 'RESIT',
    timestamp: receipt.timestamp || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Delete receipt document from Cloud Firestore
 */
export async function deleteReceiptFromCloud(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Delete multiple receipts from Cloud Firestore
 */
export async function deleteBulkReceiptsFromCloud(ids: string[]): Promise<void> {
  const batch = writeBatch(db);
  for (const id of ids) {
    const docRef = doc(db, COLLECTION_NAME, id);
    batch.delete(docRef);
  }
  await batch.commit();
}

/**
 * Real-time listener for receipts collection (Auto-Sync Online)
 */
export function subscribeReceipts(
  onData: (receipts: Receipt[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Receipt[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: d.id || docSnap.id,
          nama: d.nama || '',
          tarikh: d.tarikh || '',
          butiran: d.butiran || d.item || '',
          jumlah: Number(d.jumlah) || 0,
          item: d.item || d.butiran || '',
          alamat: d.alamat || '',
          paymentMethod: d.paymentMethod || 'CASH',
          kategori: d.kategori || 'GUAMAN',
          bakiTerdahulu: Number(d.bakiTerdahulu) || 0,
          items: Array.isArray(d.items) ? d.items : [],
          documentType: d.documentType || 'RESIT',
          timestamp: d.timestamp || new Date().toISOString()
        });
      });
      // Sort newest first by default
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(list);
    },
    (err) => {
      console.error('Firestore sync error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Sync local receipts to cloud if not already synced
 */
export async function syncLocalReceiptsToCloud(localReceipts: Receipt[]): Promise<number> {
  if (!localReceipts || localReceipts.length === 0) return 0;
  let count = 0;
  for (const r of localReceipts) {
    if (r.id) {
      await saveReceiptToCloud(r);
      count++;
    }
  }
  return count;
}
