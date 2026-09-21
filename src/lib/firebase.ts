import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  memoryLocalCache,
  setLogLevel 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Suppress benign transport-level connection stream warning traces during idle network poll refreshes
setLogLevel('error');

// Check if we are inside a sandboxed iframe or a preview environment
const isIframe = typeof window !== 'undefined' && (window.parent !== window || window.location.hostname.includes('run.app'));

let firestoreInstance;

// Long-polling with a 12s timeout keeps the hanging GET cycle well below the browser's 25-30s QUIC/HTTP3 idle timeout
const longPollingConfig = {
  experimentalForceLongPolling: true,
  experimentalLongPollingOptions: {
    timeoutSeconds: 12,
  },
};

if (isIframe) {
  console.log("Detecting sandboxed iframe or preview context. Initializing Firestore with memoryLocalCache and hardened 12s long-polling.");
  try {
    firestoreInstance = initializeFirestore(app, {
      ...longPollingConfig,
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
      ...longPollingConfig,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseConfig.firestoreDatabaseId);
  } catch (e) {
    console.warn("Failed to initialize Firestore with persistent local cache. Falling back to memoryLocalCache with 12s long-polling.", e);
    try {
      firestoreInstance = initializeFirestore(app, {
        ...longPollingConfig,
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
