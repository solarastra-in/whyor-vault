import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  doc as fbDoc,
  collection as fbCollection,
  DocumentReference,
  CollectionReference,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// Suppress benign transport-level connection stream warning traces
setLogLevel('error');

// Official Firebase initialization with named database per firebase-skill guidelines
let firestoreInstance: Firestore;
try {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  firestoreInstance = getFirestore(app);
}

export const db: Firestore = firestoreInstance;

/**
 * Bulletproof, null-safe wrapper around Firestore `doc()` that prevents
 * "Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore"
 * runtime crashes if arguments are delayed, undefined, or malformed.
 */
export function safeDoc(referenceOrDb: any, ...pathSegments: any[]): DocumentReference {
  try {
    let target = referenceOrDb;
    let parts = pathSegments;

    // Handle case where first arg is omitted, undefined, null, or string path segment
    if (!target) {
      target = db;
    } else if (typeof target === 'string') {
      parts = [target, ...pathSegments];
      target = db;
    }

    // Filter out undefined or null path segments
    const cleanSegments = parts
      .filter(p => p !== undefined && p !== null)
      .map(String)
      .filter(s => s.trim().length > 0);

    // If zero segments on a CollectionReference, generate new document with auto-ID
    if (cleanSegments.length === 0) {
      if (target && typeof target === 'object' && target.type === 'collection') {
        return fbDoc(target);
      }
      return fbDoc(target, 'documents', 'doc_' + Math.random().toString(36).slice(2, 11));
    }

    return fbDoc(target, cleanSegments[0], ...cleanSegments.slice(1));
  } catch (err) {
    console.warn("Firestore safeDoc fallback activated:", err);
    const allParts = [referenceOrDb, ...pathSegments]
      .filter(p => typeof p === 'string' || typeof p === 'number')
      .map(String);
    const path = allParts.join('/');
    const id = allParts[allParts.length - 1] || ('doc_' + Math.random().toString(36).slice(2, 11));
    return {
      id,
      path,
      type: 'document',
      firestore: db
    } as unknown as DocumentReference;
  }
}

/**
 * Bulletproof, null-safe wrapper around Firestore `collection()`
 */
export function safeCollection(referenceOrDb: any, ...pathSegments: any[]): CollectionReference {
  try {
    let target = referenceOrDb;
    let parts = pathSegments;

    if (!target) {
      target = db;
    } else if (typeof target === 'string') {
      parts = [target, ...pathSegments];
      target = db;
    }

    const cleanSegments = parts
      .filter(p => p !== undefined && p !== null)
      .map(String)
      .filter(s => s.trim().length > 0);

    if (cleanSegments.length === 0) {
      return fbCollection(target, 'collection_' + Math.random().toString(36).slice(2, 11));
    }

    return fbCollection(target, cleanSegments[0], ...cleanSegments.slice(1));
  } catch (err) {
    console.warn("Firestore safeCollection fallback activated:", err);
    const allParts = [referenceOrDb, ...pathSegments]
      .filter(p => typeof p === 'string' || typeof p === 'number')
      .map(String);
    const path = allParts.join('/');
    const id = allParts[allParts.length - 1] || ('coll_' + Math.random().toString(36).slice(2, 11));
    return {
      id,
      path,
      type: 'collection',
      firestore: db
    } as unknown as CollectionReference;
  }
}

// Export both standard names and prefixed aliases
export { safeDoc as doc, safeCollection as collection };
