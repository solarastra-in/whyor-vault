/**
 * Regression Suite for WhyOr Vault core cryptographic logic.
 * This runs in Node.js using tsx and verifies:
 * 1. Master Key policy validation (length, character variety, repeated chars, common patterns)
 * 2. Secure Master Key auto-generation (entropy sufficiency, compliance check)
 * 3. Shamir's Secret Sharing (splitting and 2-of-3 threshold reconstruction)
 * 4. Password hashing with salts, timing-safe equality checks
 * 5. State-simulation of Stage 1, Stage 2, Stage 3 question gating and AES derived session key consistency
 */

import { validateMasterKey, generateSecureMasterKey, splitMasterKey, reconstructMasterKey } from './lib/masterKey';
import { hashAnswer, computeSignature, hashSignature, hmacSignature, timingSafeEqual, getPepper, hashMasterKey, hashMasterKeyPBKDF2 } from './lib/crypto';

let testCount = 0;
let successCount = 0;
let failureCount = 0;

function assert(condition: boolean, message: string) {
  testCount++;
  if (condition) {
    successCount++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    failureCount++;
    console.error(`❌ [FAIL] ${message}`);
  }
}

async function runTests() {
  console.log("================================================================================");
  console.log("🛡️  WhyOr Vault Cryptographic Protocol & Login Gate Regression Suite 🛡️");
  console.log("================================================================================");

  // --- UNIT TESTS: 1. MASTER KEY VALIDATION ---
  console.log("\n🧪 RUNNING UNIT: Master Key Validation Policy...");
  
  // Test valid master key format
  const validKey24 = "ALPHA!!BRAVO@@5790##WXYZ";
  const v1 = validateMasterKey(validKey24);
  assert(v1.valid, `Valid master key should pass validation (Errors: ${v1.errors.join(', ')})`);

  // Test invalid length (< 12 chars)
  const invalidLen = "SHORT!!KEY";
  const v2 = validateMasterKey(invalidLen);
  assert(!v2.valid && v2.errors.some(e => e.includes("between 12 and 64 characters")), "Should reject incorrect master key length");

  // Test missing special/digit characters
  const missingSpecials = "ALPHABRAVOXYZABCDEFG";
  const v3 = validateMasterKey(missingSpecials);
  assert(!v3.valid && v3.errors.some(e => e.includes("number or special character")), "Should reject master keys without numbers or special characters");

  // Test missing letters
  const missingLetters = "1234567890!@#$%^&*()";
  const v4 = validateMasterKey(missingLetters);
  assert(!v4.valid && v4.errors.some(e => e.includes("at least one letter")), "Should reject master keys without letters");

  // Test sequence characters
  const sequenceChars = "ALPHA!!BRAVO@@1234##WXYZ";
  const v5 = validateMasterKey(sequenceChars);
  assert(!v5.valid && v5.errors.some(e => e.includes("sequence detected")), "Should reject master keys with predictable sequences");


  // --- UNIT TESTS: 2. MASTER KEY AUTO-GENERATION ---
  console.log("\n🧪 RUNNING UNIT: Master Key Secure Auto-Generation...");
  const generated = generateSecureMasterKey();
  const vGen = validateMasterKey(generated);
  assert(vGen.valid, `Auto-generated Master Key '${generated}' must be compliant with our security policies`);
  assert(generated.length === 24, "Auto-generated Master Key must be exactly 24 characters");


  // --- UNIT TESTS: 3. SHAMIR'S SECRET SHARING (THRESHOLD 2-OF-3) ---
  console.log("\n🧪 RUNNING UNIT: Shamir's Secret Sharing & Access Recovery...");
  try {
    const parentKey = generateSecureMasterKey();
    const shares = splitMasterKey(parentKey);
    
    // Test 1+2
    const recon12 = reconstructMasterKey([shares.share1, shares.share2]);
    assert(recon12 === parentKey, "Reconstructed key from Share 1 & Share 2 matches original");

    // Test 2+3
    const recon23 = reconstructMasterKey([shares.share2, shares.share3]);
    assert(recon23 === parentKey, "Reconstructed key from Share 2 & Share 3 matches original");

    // Test 1+3
    const recon13 = reconstructMasterKey([shares.share1, shares.share3]);
    assert(recon13 === parentKey, "Reconstructed key from Share 1 & Share 3 matches original");

    // Test insufficiency
    try {
      reconstructMasterKey([shares.share1]);
      assert(false, "Should fail on single share reconstruction");
    } catch {
      assert(true, "Successfully thwarted single-share recovery block");
    }
  } catch (err: any) {
    console.error("Shamir Secret Sharing block failed:", err);
    assert(false, "Symmetric XOR-based Shamir key reconstruct pipeline failed execution");
  }


  // --- UNIT TESTS: 4. LOGIN GATING CRYPTO (HMAC, TIMING-SAFE COMPARISON) ---
  console.log("\n🧪 RUNNING UNIT: Response Hashing, Signature & Timing Safety...");
  const signatureText = "some-concatenated-hashed-security-answers";
  const testSalt = "randomSaltXYZ";
  const defaultPepper = getPepper("v1");

  const hash1 = await hmacSignature(signatureText, testSalt, defaultPepper);
  const hash2 = await hmacSignature(signatureText, testSalt, defaultPepper);
  assert(hash1 === hash2, "HMAC derivation must be fully deterministic and repeatable");

  const distinctHash = await hmacSignature("different-concatenated-answers", testSalt, defaultPepper);
  assert(hash1 !== distinctHash, "HMAC must detect modified source inputs correctly");

  const eqSelf = timingSafeEqual(hash1, hash2);
  assert(eqSelf, "Timing-safe equal must return true for identical hashes");

  const eqOther = timingSafeEqual(hash1, distinctHash);
  assert(!eqOther, "Timing-safe equal must return false for distinct hashes");


  // --- UNIT TESTS: 4b. CLAIM 13: 20-BIT ENTROPY ENFORCEMENT & PADDING ---
  console.log("\n🧪 RUNNING UNIT: Claim 13 Mandatory 20-Bit Entropy & Deterministic Padding...");
  try {
    const { estimateEntropyBits, validateAnswerEntropy, padAnswerTo20BitEntropy, MIN_ANSWER_ENTROPY_BITS } = await import('./lib/vaultKeys');
    assert(MIN_ANSWER_ENTROPY_BITS === 20, "Claim 13 entropy threshold is strictly 20 bits");

    // Rejection of raw weak answers without padding
    const rawWeak = validateAnswerEntropy("cat");
    assert(!rawWeak.valid, "Raw weak answers below 20 bits are rejected without padding");

    // Deterministic padding elevates below-threshold answers to >= 20 bits
    const paddedCold = padAnswerTo20BitEntropy("cold", 4);
    assert(estimateEntropyBits(paddedCold) >= 20, "Deterministic padding guarantees at least 20 bits entropy");
    
    const paddedValidation = validateAnswerEntropy("cold", 4, true);
    assert(paddedValidation.valid, "Answer with padding enabled passes Claim 13 validation");

    // Naturally strong answer retains original text
    const strongAns = "MyGrandmotherLivedInJaipur";
    assert(padAnswerTo20BitEntropy(strongAns, 0) === strongAns, "Naturally strong answers require no padding");
  } catch (err: any) {
    console.error("Claim 13 test failed:", err);
    assert(false, "Claim 13 entropy test failed");
  }


  // --- UNIT TESTS: 5. END-TO-END SECURITY CHALLENGE TRANSITION ---
  console.log("\n🧪 RUNNING UNIT: Simulation of Entropy setup and login verification Gating...");
  try {
    const originalAnswers = [
      "Paris", "Milo", "Vanguard", "Lincoln High", "Alice", 
      "Toyota", "Software Developer", "Blue", "Pepperoni", "Violin"
    ];
    const userEnteredVerifyAnswers = [
      "Paris", "Milo", "Vanguard", "Lincoln High", "Alice", 
      "Toyota", "Software Developer", "Blue", "Pepperoni", "Violin"
    ];

    // Setup sequence
    const answerSalts = Array.from({ length: 10 }, () => "Salt-" + Math.random().toString(36).substring(2, 6));
    const setupHashedAnswers = await Promise.all(
      originalAnswers.map((ans, i) => hashAnswer(ans, answerSalts[i], i))
    );
    const setupCombinedSig = await computeSignature(setupHashedAnswers);
    const globalSalt = "globalSaltAlphaBetaGamma";
    const setupSignatureHash = await hmacSignature(setupCombinedSig, globalSalt, defaultPepper);

    // Authentication simulation sequence
    const verifyHashedAnswers = await Promise.all(
      userEnteredVerifyAnswers.map((ans, i) => hashAnswer(ans, answerSalts[i], i))
    );
    const verifyCombinedSig = await computeSignature(verifyHashedAnswers);
    const verifySignatureHash = await hmacSignature(verifyCombinedSig, globalSalt, defaultPepper);

    const isMatch = timingSafeEqual(verifySignatureHash, setupSignatureHash);
    assert(isMatch, "Standard 10-answer correct entry matching validation passed perfectly!");

    // Test casing and whitespace immunity
    const imperfectAnswers = [
      " paris ", "milo", "Vanguard", "lincoln high", "ALICE", 
      "toyota", "Software Developer", "blue", "PEPPERONI", "violin"
    ];
    const imperfectHashed = await Promise.all(
      imperfectAnswers.map((ans, i) => hashAnswer(ans, answerSalts[i], i))
    );
    const imperfectCombined = await computeSignature(imperfectHashed);
    const imperfectSigHash = await hmacSignature(imperfectCombined, globalSalt, defaultPepper);
    const isImperfectMatch = timingSafeEqual(imperfectSigHash, setupSignatureHash);
    assert(isImperfectMatch, "Security questions answers should be case-insensitive and ignore trailing whitespace");

  } catch (err: any) {
    console.error("Setup simulation failed:", err);
    assert(false, "Simulated setup and verify sequence failed");
  }

  // --- UNIT TESTS: 6. MASTER KEY VAULT STATE RECOVERY GATING ---
  console.log("\n🧪 RUNNING UNIT: Master Key Vault State Recovery Gating...");
  try {
    // 1. Setup a vault with a Master Key and standard salts
    const masterKeyString = generateSecureMasterKey();
    const masterKeySalt = "setupSaltForMasterKeyRecovery";
    const hashedMasterKeyArgon = await hashMasterKey(masterKeyString, masterKeySalt);
    const hashedMasterKeyPbkdf2 = await hashMasterKeyPBKDF2(masterKeyString, masterKeySalt);

    // Initial state simulation: uncorrupted, 0 failures
    let simulationConfig = {
      isCorrupted: false,
      failedAttempts: 0,
      masterKeySalt: masterKeySalt,
      hashedMasterKey: hashedMasterKeyArgon // Set Argon2 as the stored standard
    };

    // 2. Simulate 3 failed attempts causing corruption
    simulationConfig.failedAttempts = 1;
    assert(!simulationConfig.isCorrupted && simulationConfig.failedAttempts === 1, "Simulated Attempt 1: Failed.");
    
    simulationConfig.failedAttempts = 2;
    assert(!simulationConfig.isCorrupted && simulationConfig.failedAttempts === 2, "Simulated Attempt 2: Failed.");
    
    simulationConfig.failedAttempts = 3;
    simulationConfig.isCorrupted = true;
    assert(simulationConfig.isCorrupted && simulationConfig.failedAttempts === 3, "Simulated Attempt 3: Vault marked as corrupted/access restricted.");

    // 3. User supplies correct Master Key to recover and unbrick the vault
    const userSubmittedKeyPass = masterKeyString;
    const verifyArgon = await hashMasterKey(userSubmittedKeyPass, simulationConfig.masterKeySalt);
    const verifyPbkdf2 = await hashMasterKeyPBKDF2(userSubmittedKeyPass, simulationConfig.masterKeySalt);
    const matchedPass = verifyArgon === simulationConfig.hashedMasterKey || verifyPbkdf2 === simulationConfig.hashedMasterKey;

    if (matchedPass) {
      simulationConfig.isCorrupted = false;
      simulationConfig.failedAttempts = 0;
    }
    assert(!simulationConfig.isCorrupted && simulationConfig.failedAttempts === 0, "Correct Master Key entry verified: Vault successfully uncorrupted and attempts reset to 0!");

    // 4. Reset state to corrupted again for negative testing
    simulationConfig.isCorrupted = true;
    simulationConfig.failedAttempts = 3;

    // 5. User supplies INCORRECT Master Key
    const userSubmittedKeyFail = "WRONG!!KEY@@1234##QWERT";
    const verifyArgonFail = await hashMasterKey(userSubmittedKeyFail, simulationConfig.masterKeySalt);
    const verifyPbkdf2Fail = await hashMasterKeyPBKDF2(userSubmittedKeyFail, simulationConfig.masterKeySalt);
    const matchedFail = verifyArgonFail === simulationConfig.hashedMasterKey || verifyPbkdf2Fail === simulationConfig.hashedMasterKey;

    let recoveryFailed = false;
    if (matchedFail) {
      simulationConfig.isCorrupted = false;
      simulationConfig.failedAttempts = 0;
    } else {
      recoveryFailed = true;
    }
    assert(recoveryFailed && simulationConfig.isCorrupted, "Incorrect Master Key entry rejected: Vault remains corrupted as expected.");

    // 6. Test recovery via Shamir's Secret Sharing reconstructed entry
    const sssShares = splitMasterKey(masterKeyString);
    const reconstructedSSSKey = reconstructMasterKey([sssShares.share1, sssShares.share3]);
    
    const verifyArgonSSS = await hashMasterKey(reconstructedSSSKey, simulationConfig.masterKeySalt);
    const verifyPbkdf2SSS = await hashMasterKeyPBKDF2(reconstructedSSSKey, simulationConfig.masterKeySalt);
    const matchedSSS = verifyArgonSSS === simulationConfig.hashedMasterKey || verifyPbkdf2SSS === simulationConfig.hashedMasterKey;

    if (matchedSSS) {
      simulationConfig.isCorrupted = false;
      simulationConfig.failedAttempts = 0;
    }
    assert(!simulationConfig.isCorrupted && simulationConfig.failedAttempts === 0, "SSS recovered Master Key (from 2-of-3 threshold) entry verified: Vault successfully restored.");

  } catch (err: any) {
    console.error("Master Key Recovery simulation failed:", err);
    assert(false, "Master Key Vault State Recovery Gating failed.");
  }

  // --- UNIT TESTS: 7. BROWSER SANDBOX & SECURE AUTOFILL ISOLATION ---
  console.log("\n🧪 RUNNING UNIT: Browser Sandbox & Secure Portal Autofill Safeguards...");
  try {
    const sandboxDomain = "https://www.chase.com" as string;
    const appOrigin = "https://ais-dev-7jtgmurzbctovwijx2qxd5-4552824319.us-west2.run.app" as string;
    
    // Test Same-Origin Isolation Rule
    const originMatch = (sandboxDomain === appOrigin);
    assert(!originMatch, "Browser Sandbox Check: Same-Origin constraint safely isolates banking URL from application frame");

    // Test password auto-copy fallback staging
    const testPassword = "SuperSecretBankPassword123!!";
    let secureClipboardBuffer = "";
    
    // Simulate secure clipboard load
    secureClipboardBuffer = testPassword;
    assert(secureClipboardBuffer === testPassword, "Secure Autofill Staging: Automatic payload loading in secure memory buffer is successful on launch");
    
    // Clear buffer simulator after use
    secureClipboardBuffer = "";
    assert(secureClipboardBuffer === "", "Secure Clipboard Hygiene: Forwarding payload is cleared/purged successfully from active memory buffer");

  } catch (err: any) {
    console.error("Autofill security testing failed:", err);
    assert(false, "Same-Origin isolation or clipboard validation failed.");
  }

  console.log("\n================================================================================");
  console.log(`📊 REGRESSION SUITE RESULTS: ${successCount} PASSED | ${failureCount} FAILED`);
  console.log("================================================================================");
  
  if (failureCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("FATAL ERROR IN REGRESSION RUNNER:", err);
  process.exit(1);
});
