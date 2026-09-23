import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, terminate } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

async function testAuthAndWrite() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log("Testing Anonymous Auth...");
  try {
    const cred = await signInAnonymously(auth);
    console.log("Anonymous sign-in SUCCESS! UID:", cred.user.uid);

    console.log("Testing write to /users/" + cred.user.uid);
    await setDoc(doc(db, 'users', cred.user.uid), {
      termsAccepted: true,
      email: 'anon@test.com',
      updatedAt: Date.now()
    });
    console.log("SUCCESS: /users write completed!");

    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    console.log("SUCCESS: Read back user doc:", userDoc.data());
  } catch (err: any) {
    console.log("Anonymous auth or write note:", err?.code || err?.message || err);
  } finally {
    await terminate(db);
  }
}

testAuthAndWrite();
