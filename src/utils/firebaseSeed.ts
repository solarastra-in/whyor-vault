import { getDoc, setDoc } from 'firebase/firestore';
import { db, doc } from '../lib/firebase';

/**
 * Initializes essential documents and persistent collections in Cloud Firestore
 * if they do not already exist. Runs idempotently.
 */
export async function seedInitialFirebaseData(userEmail?: string | null) {
  try {
    // 1. Seed system/config
    const systemConfigRef = doc(db, 'system', 'config');
    const systemConfigSnap = await getDoc(systemConfigRef);
    if (!systemConfigSnap.exists()) {
      await setDoc(systemConfigRef, {
        rateMonthly: 4.99,
        rateYearly: 39.99,
        rateDecade: 299.00,
        freeLimit: 3,
        paymentGatewayDetails: "Standard Stripe / Web3 Ledger Sandbox Active",
        updatedAt: Date.now(),
        version: "2.5.0",
        maintenanceMode: false
      }, { merge: true });
      console.log("✅ Seeded system/config in Firestore");
    }

    // 2. Seed admin_settings/auth default salt & hash if missing
    const adminAuthRef = doc(db, 'admin_settings', 'auth');
    const adminAuthSnap = await getDoc(adminAuthRef);
    if (!adminAuthSnap.exists()) {
      // Default initial admin key initialization: 'admin-portal-key'
      const { generateSalt, hashAnswer } = await import('../lib/crypto');
      const defaultSalt = generateSalt();
      const defaultHashed = await hashAnswer('admin-portal-key', defaultSalt);
      await setDoc(adminAuthRef, {
        hashedPassword: defaultHashed,
        salt: defaultSalt,
        updatedAt: Date.now(),
        initializedBy: userEmail || 'system_bootstrap'
      }, { merge: true });
      console.log("✅ Seeded admin_settings/auth in Firestore");
    }
  } catch (err: any) {
    // Non-blocking catch so security rules or offline state don't halt app boot
    console.info("Firebase initial seed check note:", err?.message || err);
  }
}
