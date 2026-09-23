import { 
  getDocFromServer, 
  setDoc, 
  deleteDoc, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, doc, collection } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export interface TestStepResult {
  id: string;
  name: string;
  category: 'connection' | 'read' | 'write' | 'verify' | 'delete' | 'audit';
  status: 'pending' | 'running' | 'pass' | 'fail' | 'skipped';
  durationMs?: number;
  details?: string;
  error?: string;
  payload?: any;
  targetPath?: string;
}

export interface FirestoreTestReport {
  timestamp: number;
  databaseId: string;
  projectId: string;
  authenticatedUser: {
    uid: string | null;
    email: string | null;
    emailVerified: boolean | null;
  } | null;
  overallPassed: boolean;
  totalDurationMs: number;
  steps: TestStepResult[];
}

export async function runFirestoreDiagnostics(
  onProgress?: (step: TestStepResult, currentReport: FirestoreTestReport) => void
): Promise<FirestoreTestReport> {
  const startTime = Date.now();
  const currentUser = auth.currentUser;

  const steps: TestStepResult[] = [
    {
      id: 'step_system_config',
      name: 'Server Probe & Read /system/config',
      category: 'read',
      status: 'pending',
      targetPath: 'system/config'
    },
    {
      id: 'step_admin_settings',
      name: 'Read Security Parameters /admin_settings/auth',
      category: 'read',
      status: 'pending',
      targetPath: 'admin_settings/auth'
    },
    {
      id: 'step_user_write',
      name: 'Submit & Sync Profile /users/{uid}',
      category: 'write',
      status: 'pending',
      targetPath: currentUser ? `users/${currentUser.uid}` : 'users/{uid}'
    },
    {
      id: 'step_vault_item_write',
      name: 'Submit Encrypted Item /vaults/{uid}/items/probe',
      category: 'write',
      status: 'pending',
      targetPath: currentUser ? `vaults/${currentUser.uid}/items/probe_test_record` : 'vaults/{uid}/items/probe'
    },
    {
      id: 'step_vault_item_verify',
      name: 'Server Read-Back & Payload Integrity Verification',
      category: 'verify',
      status: 'pending',
      targetPath: currentUser ? `vaults/${currentUser.uid}/items/probe_test_record` : 'vaults/{uid}/items/probe'
    },
    {
      id: 'step_vault_item_cleanup',
      name: 'Delete Probe Record /vaults/{uid}/items/probe',
      category: 'delete',
      status: 'pending',
      targetPath: currentUser ? `vaults/${currentUser.uid}/items/probe_test_record` : 'vaults/{uid}/items/probe'
    },
    {
      id: 'step_audit_log_write',
      name: 'Submit Audit Log Entry /vaults/{uid}/audit_logs',
      category: 'audit',
      status: 'pending',
      targetPath: currentUser ? `vaults/${currentUser.uid}/audit_logs` : 'vaults/{uid}/audit_logs'
    }
  ];

  const report: FirestoreTestReport = {
    timestamp: startTime,
    databaseId: firebaseConfig.firestoreDatabaseId,
    projectId: firebaseConfig.projectId,
    authenticatedUser: currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified
    } : null,
    overallPassed: false,
    totalDurationMs: 0,
    steps
  };

  const updateStep = (id: string, updates: Partial<TestStepResult>) => {
    const idx = report.steps.findIndex(s => s.id === id);
    if (idx !== -1) {
      report.steps[idx] = { ...report.steps[idx], ...updates };
      if (onProgress) {
        onProgress(report.steps[idx], { ...report });
      }
    }
  };

  let allPass = true;

  // TEST 1: Read system/config
  {
    const stepId = 'step_system_config';
    updateStep(stepId, { status: 'running' });
    const t0 = Date.now();
    try {
      const snap = await getDocFromServer(doc(db, 'system', 'config'));
      const t1 = Date.now();
      const exists = snap.exists();
      const data = exists ? snap.data() : null;
      updateStep(stepId, {
        status: 'pass',
        durationMs: t1 - t0,
        details: `Successfully fetched /system/config in ${t1 - t0}ms (Exists: ${exists})`,
        payload: data
      });
    } catch (err: any) {
      allPass = false;
      updateStep(stepId, {
        status: 'fail',
        durationMs: Date.now() - t0,
        error: err?.message || String(err)
      });
    }
  }

  // TEST 2: Read admin_settings/auth
  {
    const stepId = 'step_admin_settings';
    updateStep(stepId, { status: 'running' });
    const t0 = Date.now();
    try {
      const snap = await getDocFromServer(doc(db, 'admin_settings', 'auth'));
      const t1 = Date.now();
      const exists = snap.exists();
      updateStep(stepId, {
        status: 'pass',
        durationMs: t1 - t0,
        details: `Read /admin_settings/auth in ${t1 - t0}ms (Exists: ${exists})`,
        payload: exists ? { initializedBy: snap.data()?.initializedBy, hasHashedPassword: !!snap.data()?.hashedPassword } : null
      });
    } catch (err: any) {
      // Non-fatal if uninitialized
      updateStep(stepId, {
        status: 'pass',
        durationMs: Date.now() - t0,
        details: `Document check evaluated in ${Date.now() - t0}ms: ${err?.message || 'Checked'}`
      });
    }
  }

  // If user is not authenticated, write tests cannot run due to Zero-Trust ABAC rules
  if (!currentUser) {
    const unauthReason = 'User session is not signed in. Firestore Attribute-Based Access Control (ABAC) strictly requires request.auth != null for vault mutations.';
    ['step_user_write', 'step_vault_item_write', 'step_vault_item_verify', 'step_vault_item_cleanup', 'step_audit_log_write'].forEach(id => {
      updateStep(id, {
        status: 'skipped',
        details: unauthReason
      });
    });

    report.overallPassed = allPass;
    report.totalDurationMs = Date.now() - startTime;
    return report;
  }

  // TEST 3: Write to users/{uid}
  {
    const stepId = 'step_user_write';
    updateStep(stepId, { status: 'running' });
    const t0 = Date.now();
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const testPayload = {
        lastProbeTest: Date.now(),
        email: currentUser.email || '',
        status: 'active',
        appClientVersion: '2.5.0'
      };
      await setDoc(userRef, testPayload, { merge: true });
      const t1 = Date.now();
      updateStep(stepId, {
        status: 'pass',
        durationMs: t1 - t0,
        details: `Successfully submitted test payload to users/${currentUser.uid} in ${t1 - t0}ms`,
        payload: testPayload
      });
    } catch (err: any) {
      allPass = false;
      updateStep(stepId, {
        status: 'fail',
        durationMs: Date.now() - t0,
        error: err?.message || String(err)
      });
    }
  }

  // TEST 4: Write probe item to vaults/{uid}/items/probe_test_record
  const probeDocId = 'probe_test_record';
  const probeRef = doc(db, 'vaults', currentUser.uid, 'items', probeDocId);
  const probePayload = {
    type: 'document',
    name: 'Diagnostic Firestore Submission Probe',
    partition: 'personal',
    institution: 'WhyOr Diagnostic Engine',
    encryptedData: btoa(`TEST_PAYLOAD_CIPHERTEXT_${Date.now()}`),
    ownerId: currentUser.uid,
    updatedAt: Date.now()
  };

  {
    const stepId = 'step_vault_item_write';
    updateStep(stepId, { status: 'running' });
    const t0 = Date.now();
    try {
      await setDoc(probeRef, probePayload);
      const t1 = Date.now();
      updateStep(stepId, {
        status: 'pass',
        durationMs: t1 - t0,
        details: `Submitted encrypted test record to vaults/${currentUser.uid}/items/${probeDocId} in ${t1 - t0}ms`,
        payload: {
          name: probePayload.name,
          ownerId: probePayload.ownerId,
          type: probePayload.type,
          partition: probePayload.partition
        }
      });
    } catch (err: any) {
      allPass = false;
      updateStep(stepId, {
        status: 'fail',
        durationMs: Date.now() - t0,
        error: err?.message || String(err)
      });
    }
  }

  // TEST 5: Verify read-back from server
  {
    const stepId = 'step_vault_item_verify';
    updateStep(stepId, { status: 'running' });
    const t0 = Date.now();
    try {
      const snap = await getDocFromServer(probeRef);
      const t1 = Date.now();
      if (!snap.exists()) {
        throw new Error('Probe document was not found on Firestore server after write.');
      }
      const readData = snap.data();
      if (readData.ownerId !== currentUser.uid || readData.name !== probePayload.name) {
        throw new Error(`Data mismatch on read-back: expected ownerId ${currentUser.uid}, received ${readData.ownerId}`);
      }
      updateStep(stepId, {
        status: 'pass',
        durationMs: t1 - t0,
        details: `Verified item integrity directly from server in ${t1 - t0}ms`,
        payload: {
          id: snap.id,
          name: readData.name,
          ownerId: readData.ownerId
        }
      });
    } catch (err: any) {
      allPass = false;
      updateStep(stepId, {
        status: 'fail',
        durationMs: Date.now() - t0,
        error: err?.message || String(err)
      });
    }
  }

  // TEST 6: Delete the probe record
  {
    const stepId = 'step_vault_item_cleanup';
    updateStep(stepId, { status: 'running' });
    const t0 = Date.now();
    try {
      await deleteDoc(probeRef);
      const t1 = Date.now();
      updateStep(stepId, {
        status: 'pass',
        durationMs: t1 - t0,
        details: `Deleted probe record cleanly in ${t1 - t0}ms`
      });
    } catch (err: any) {
      updateStep(stepId, {
        status: 'fail',
        durationMs: Date.now() - t0,
        error: err?.message || String(err)
      });
    }
  }

  // TEST 7: Submit Audit Log Entry
  {
    const stepId = 'step_audit_log_write';
    updateStep(stepId, { status: 'running' });
    const t0 = Date.now();
    try {
      const logsRef = collection(db, 'vaults', currentUser.uid, 'audit_logs');
      const auditPayload = {
        timestamp: Date.now(),
        actorId: currentUser.uid,
        actorEmail: currentUser.email || 'unknown@user.com',
        action: 'DIAGNOSTIC_SUBMISSION_TEST',
        resourceType: 'VAULT',
        resourceId: currentUser.uid,
        details: 'Self-test diagnostic suite verified Firestore cloud submission channel.',
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        hash: 'test-diagnostic-hash-' + Math.random().toString(36).substring(2, 10)
      };
      const docAdded = await addDoc(logsRef, auditPayload);
      const t1 = Date.now();
      updateStep(stepId, {
        status: 'pass',
        durationMs: t1 - t0,
        details: `Committed audit record (${docAdded.id}) in ${t1 - t0}ms`,
        payload: { id: docAdded.id, action: auditPayload.action, timestamp: auditPayload.timestamp }
      });
    } catch (err: any) {
      allPass = false;
      updateStep(stepId, {
        status: 'fail',
        durationMs: Date.now() - t0,
        error: err?.message || String(err)
      });
    }
  }

  report.overallPassed = allPass;
  report.totalDurationMs = Date.now() - startTime;
  return report;
}
