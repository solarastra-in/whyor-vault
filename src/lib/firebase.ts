import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Check if we are inside a sandboxed iframe or a preview environment
const isIframe = typeof window !== 'undefined' && (window.parent !== window || window.location.hostname.includes('run.app'));

let firestoreInstance;

if (isIframe) {
  console.log("Detecting sandboxed iframe or preview context. Initializing Firestore with memoryLocalCache and long polling for maximum security/compatibility.");
  try {
    firestoreInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: memoryLocalCache()
    }, firebaseConfig.firestoreDatabaseId);
  } catch (err) {
    console.warn("Failed to initialize with iframe-friendly memoryLocalCache, falling back directly:", err);
    try {
      firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } catch (fallbackErr) {
      firestoreInstance = getFirestore(app);
    }
  }
} else {
  try {
    firestoreInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseConfig.firestoreDatabaseId);
  } catch (e) {
    console.warn("Failed to initialize Firestore with persistent local cache (possible sandbox/cookie constraint in third-party iframe). Trying memoryLocalCache with long-polling.", e);
    try {
      firestoreInstance = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: memoryLocalCache()
      }, firebaseConfig.firestoreDatabaseId);
    } catch (initErr) {
      console.error("initializeFirestore with memory cache failed, falling back to getFirestore:", initErr);
      try {
        firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      } catch (getErr) {
        console.error("getFirestore failed, falling back to default instance:", getErr);
        firestoreInstance = getFirestore(app);
      }
    }
  }
}

export const db = firestoreInstance;
