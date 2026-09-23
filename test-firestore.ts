import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

async function runTest() {
  console.log("Testing Firestore connection to database:", firebaseConfig.firestoreDatabaseId);
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    console.log("Attempting to getDoc on /system/config...");
    const snap = await getDoc(doc(db, 'system', 'config'));
    console.log("SUCCESS! /system/config exists:", snap.exists(), "data:", snap.data());
  } catch (err: any) {
    console.error("FAILED to read /system/config:", err);
  }
}

runTest();
