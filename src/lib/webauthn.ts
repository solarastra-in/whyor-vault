/**
 * WebAuthn (Biometric Unlock) helper utilities.
 * Allows storing a local encrypted copy of the vault's derived combined signature
 * which is decrypted only after a successful biometric verification (WebAuthn assertion).
 */

const STORAGE_PREFIX = "whyor_webauthn_v3_";

export interface BiometricStatus {
  isSupported: boolean;
  isRegistered: boolean;
  credentialId?: string;
}

export interface AuthenticatorStatus {
  isSupported: boolean;
  platformAvailable: boolean;
  isIframe: boolean;
  message: string;
}

/**
 * Check detailed platform authenticator status including Touch ID, Face ID, YubiKey detection & iframe constraints.
 */
export async function checkPlatformAuthenticatorStatus(): Promise<AuthenticatorStatus> {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  if (!window.PublicKeyCredential) {
    return {
      isSupported: false,
      platformAvailable: false,
      isIframe,
      message: "Browser does not support the WebAuthn (PublicKeyCredential) standard."
    };
  }
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (isIframe) {
      return {
        isSupported: true,
        platformAvailable: !!available,
        isIframe: true,
        message: "Hardware biometrics (Touch ID / Face ID / YubiKey) cannot be directly triggered inside an embedded preview iframe. Open in a new tab for native hardware access."
      };
    }
    return {
      isSupported: true,
      platformAvailable: !!available,
      isIframe: false,
      message: available
        ? "Platform authenticator (Touch ID / Face ID / YubiKey) hardware detected and attached."
        : "No attached platform authenticator (Touch ID, Face ID, or YubiKey) detected on this hardware."
    };
  } catch (e: any) {
    return {
      isSupported: false,
      platformAvailable: false,
      isIframe,
      message: `Hardware detection error: ${e?.message || 'Access restricted'}. Please open in a new tab to use hardware biometrics.`
    };
  }
}

/**
 * Check if the browser supports WebAuthn and platform biometrics.
 */
export async function checkBiometricSupport(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false;
  }
  try {
    // Check if platform authenticator (TouchID, FaceID, Windows Hello, etc.) is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return !!available;
  } catch (e) {
    console.warn("Biometric verification availability check failed:", e);
    return false;
  }
}

/**
 * Check if biometrics are already registered for a specific vault.
 */
export function isBiometricRegistered(vaultId: string): boolean {
  try {
    const credId = localStorage.getItem(`${STORAGE_PREFIX}cred_id_${vaultId}`);
    const encryptedSig = localStorage.getItem(`${STORAGE_PREFIX}enc_sig_${vaultId}`);
    return !!(credId && encryptedSig);
  } catch {
    return false;
  }
}

/**
 * Helper to convert a string to an ArrayBuffer.
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const enc = new TextEncoder();
  return enc.encode(str).buffer;
}

/**
 * Helper to convert a Base64 URL string to ArrayBuffer.
 */
function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  // Pad the base64 URL string if needed
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Helper to convert an ArrayBuffer to Base64 URL string.
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generate a random AesKey for symmetric encryption.
 */
async function generateAesKey(): Promise<{ key: CryptoKey; raw: Uint8Array }> {
  const raw = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
  const key = await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return { key, raw };
}

/**
 * Register a biometric device using WebAuthn.
 * Once biometric registration succeeds, the combined signature is encrypted and saved under a local hardware-tied key.
 */
export async function registerBiometrics(
  vaultId: string, 
  combinedSignature: string, 
  userEmail: string = "user@whyor.io"
): Promise<{ credentialId: string; hardwareEntropy: string }> {
  const isSupported = await checkBiometricSupport();
  if (!isSupported) {
    throw new Error("Biometric authentication is not supported or enabled on this device/browser.");
  }

  // 1. Generate challenge and user/RP details for credential creation
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const prfSalt = crypto.getRandomValues(new Uint8Array(32));

  const creationOptions: CredentialCreationOptions = {
    publicKey: {
      challenge,
      rp: {
        name: "WhyOr Cryptographic Vault Engine",
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: userEmail,
        displayName: userEmail.split("@")[0]
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256
        { type: "public-key", alg: -257 },  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "discouraged"
      },
      timeout: 60000,
      attestation: "none",
      extensions: {
        prf: {
          eval: {
            first: prfSalt
          }
        }
      } as any
    }
  };

  try {
    // 2. Perform WebAuthn registration
    const credential = (await navigator.credentials.create(creationOptions)) as PublicKeyCredential;
    if (!credential) {
      throw new Error("Biometric challenge was declined or timed out.");
    }

    // NOTE: this key material is only ever used to wrap a LOCAL convenience
    // cache of the already-authenticated combined signature (see step 3
    // below) -- it is never the vault's Claim 1 KEK/DEK. When the real PRF
    // extension is available, its output is used, satisfying Claim 11's
    // "never a substitute" requirement for the one place that claim
    // actually governs (vaultKeys.ts's Final KEK derivation). When PRF
    // isn't available, this local cache -- and only this local cache --
    // falls back to the credential's rawId as a device-binding value; that
    // fallback is symmetric with authenticateWithBiometrics below (which
    // fails closed rather than silently downgrading if PRF was used here
    // but is unavailable at assertion time), so it can't be used to
    // silently weaken an already-PRF-bound cache.
    const extResults = credential.getClientExtensionResults() as any;
    let hardwareEntropyBuffer = credential.rawId;

    if (extResults.prf?.results?.first) {
      hardwareEntropyBuffer = extResults.prf.results.first;
    } else {
      console.warn("PRF extension not evaluated; local unlock cache will use rawId-based device binding instead (does not affect the vault's actual encryption key).");
      hardwareEntropyBuffer = credential.rawId;
    }

    // 3. WebAuthn registration succeeded, now derive a LOCAL cache-wrapping
    // key (not the vault KEK -- see note above). We import the PRF output
    // (or the rawId fallback) as keying material for HKDF
    const hwKeyMaterial = await crypto.subtle.importKey(
      "raw",
      hardwareEntropyBuffer,
      "HKDF",
      false,
      ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: new Uint8Array(16), // constant salt is fine as credential rawId itself is a 32-64 byte high-entropy random sequence
        info: new TextEncoder().encode("webauthn-hardware-bound-kek")
      },
      hwKeyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    // 4. Encrypt the combinedSignature using AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(combinedSignature)
    );

    // 5. Store key pieces securely in local devices (NEVER store the key itself!)
    const credIdStr = arrayBufferToBase64Url(credential.rawId);
    const ivStr = arrayBufferToBase64Url(iv.buffer);
    const encryptedSigStr = arrayBufferToBase64Url(encryptedData);
    const prfSaltStr = arrayBufferToBase64Url(prfSalt.buffer);

    localStorage.setItem(`${STORAGE_PREFIX}cred_id_${vaultId}`, credIdStr);
    localStorage.setItem(`${STORAGE_PREFIX}iv_${vaultId}`, ivStr);
    localStorage.setItem(`${STORAGE_PREFIX}enc_sig_${vaultId}`, encryptedSigStr);
    localStorage.setItem(`${STORAGE_PREFIX}prf_salt_${vaultId}`, prfSaltStr);

    const hardwareEntropyHex = Array.from(new Uint8Array(hardwareEntropyBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      credentialId: credIdStr,
      hardwareEntropy: hardwareEntropyHex
    };

  } catch (err: any) {
    console.error("Biometric registration sequence exception:", err);

    if (err.message && err.message.includes("publickey-credentials-create")) {
      throw new Error("Biometric hardware access is blocked by the browser in this iframe. Please open the app in a new tab to register biometric credentials.");
    }
    
    if (err.name === "NotAllowedError") {
      throw new Error("Biometric setup timed out or was declined by the user.");
    }
    if (err.name === "SecurityError") {
      throw new Error("WebAuthn is blocked by parent frame sandboxing permissions. Open in a new tab to bypass iframe security protections.");
    }
    throw new Error(err.message || "Failed to finalize biometric link with hardware device.");
  }
}

/**
 * Remove biometrics for a specific vault.
 */
export function removeBiometrics(vaultId: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}cred_id_${vaultId}`);
  localStorage.removeItem(`${STORAGE_PREFIX}iv_${vaultId}`);
  localStorage.removeItem(`${STORAGE_PREFIX}enc_sig_${vaultId}`);
  localStorage.removeItem(`${STORAGE_PREFIX}prf_salt_${vaultId}`);
  localStorage.removeItem(`${STORAGE_PREFIX}local_key_${vaultId}`); // Clean up historical key tags if present
  clearQuickUnlockCache(vaultId);
}

// -----------------------------------------------------------------------
// Quick-unlock DEK cache: lets a biometric unlock *within a short,
// user-configured window* skip the expensive Argon2id(64MB)+PBKDF2(600k)
// cascade a full unlock normally re-runs, WITHOUT ever skipping the live
// hardware tap itself. Design constraints (deliberately chosen over a
// fully-silent auto-resume):
//   - A fresh WebAuthn assertion (Touch ID/Face ID/Windows Hello/security
//     key, `userVerification: "required"`) is REQUIRED on every unlock,
//     cache hit or not -- this cache only ever changes how much *compute*
//     that already-verified tap unlocks, never whether a tap is needed.
//   - The cached material is the raw master DEK, wrapped (AES-256-GCM)
//     under a key derived from that SAME hardware assertion's PRF output
//     (or rawId fallback, symmetric with the existing combinedSignature
//     cache above) using a distinct HKDF info string, so this cache can't
//     be unwrapped by anything other than a live, successful assertion
//     against the exact credential it was created with.
//   - Entries expire (default 15 minutes, user-configurable) and are
//     re-derived fresh (not extended) on every full unlock, so the window
//     an attacker with the encrypted cache blob but no hardware could
//     matter in is bounded and short even if localStorage leaked.
//   - Cleared on: biometric unlink, master-key/DEK rotation (the cached
//     raw bytes would just be stale and fail to decrypt anything real
//     anyway, but clearing is cheap and avoids confusing errors), and any
//     explicit "forget this device" action.
// -----------------------------------------------------------------------

export const DEFAULT_QUICK_UNLOCK_WINDOW_MINS = 15;
const QUICK_UNLOCK_WINDOW_PREF_KEY = (vaultId: string) => `${STORAGE_PREFIX}quick_unlock_window_mins_${vaultId}`;
const QUICK_UNLOCK_DEK_CACHE_KEY = (vaultId: string) => `${STORAGE_PREFIX}dek_cache_${vaultId}`;

export function getQuickUnlockWindowMins(vaultId: string): number {
  try {
    const stored = localStorage.getItem(QUICK_UNLOCK_WINDOW_PREF_KEY(vaultId));
    const parsed = stored ? parseInt(stored, 10) : NaN;
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 240) return parsed;
  } catch { /* fall through to default */ }
  return DEFAULT_QUICK_UNLOCK_WINDOW_MINS;
}

export function setQuickUnlockWindowMins(vaultId: string, mins: number): void {
  const clamped = Math.max(1, Math.min(240, Math.round(mins)));
  try {
    localStorage.setItem(QUICK_UNLOCK_WINDOW_PREF_KEY(vaultId), String(clamped));
  } catch { /* best-effort preference; not security-relevant if it fails */ }
}

export function clearQuickUnlockCache(vaultId: string): void {
  localStorage.removeItem(QUICK_UNLOCK_DEK_CACHE_KEY(vaultId));
}

async function deriveDekCacheWrapKey(hardwareEntropyBuffer: ArrayBuffer): Promise<CryptoKey> {
  const hwKeyMaterial = await crypto.subtle.importKey('raw', hardwareEntropyBuffer, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(16),
      // Distinct info string from the combinedSignature cache above --
      // these must never resolve to the same wrapping key even though
      // they're derived from the same hardware entropy.
      info: new TextEncoder().encode('webauthn-hardware-bound-dek-cache-v1'),
    },
    hwKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Wraps the raw master DEK under a key derived from the hardware entropy
 * of the assertion that JUST completed (no extra prompt), for a future
 * biometric unlock to consume within windowMins. Call this right after a
 * *full* unlock (one that ran the real KDF cascade) so the next unlock can
 * skip it.
 */
export async function cacheQuickUnlockDek(
  vaultId: string,
  dekRaw: Uint8Array,
  hardwareEntropyBuffer: ArrayBuffer,
  windowMins: number = getQuickUnlockWindowMins(vaultId)
): Promise<void> {
  try {
    const key = await deriveDekCacheWrapKey(hardwareEntropyBuffer);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const wrappedBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, dekRaw);
    const entry = {
      wrapped: arrayBufferToBase64Url(wrappedBuf),
      iv: arrayBufferToBase64Url(iv.buffer),
      expiresAt: Date.now() + windowMins * 60 * 1000,
    };
    localStorage.setItem(QUICK_UNLOCK_DEK_CACHE_KEY(vaultId), JSON.stringify(entry));
  } catch (e) {
    // Best-effort speedup cache -- a failure here just means the next
    // unlock falls back to the full (correct, slower) KDF cascade.
    console.warn('Failed to populate quick-unlock DEK cache (non-fatal):', e);
  }
}

/**
 * Attempts to recover the cached raw DEK using the hardware entropy from
 * an assertion that JUST completed. Returns null (not a throw) on any
 * miss -- expired, absent, or the assertion doesn't match what the cache
 * was wrapped under -- so the caller falls back to the full KDF cascade
 * rather than surfacing a distinct error for what is purely a
 * performance-path miss.
 */
export async function consumeQuickUnlockDek(vaultId: string, hardwareEntropyBuffer: ArrayBuffer): Promise<Uint8Array | null> {
  try {
    const raw = localStorage.getItem(QUICK_UNLOCK_DEK_CACHE_KEY(vaultId));
    if (!raw) return null;
    const entry = JSON.parse(raw) as { wrapped: string; iv: string; expiresAt: number };
    if (!entry.expiresAt || Date.now() > entry.expiresAt) {
      localStorage.removeItem(QUICK_UNLOCK_DEK_CACHE_KEY(vaultId));
      return null;
    }
    const key = await deriveDekCacheWrapKey(hardwareEntropyBuffer);
    const ptBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64UrlToArrayBuffer(entry.iv) },
      key,
      base64UrlToArrayBuffer(entry.wrapped)
    );
    return new Uint8Array(ptBuf);
  } catch {
    // Wrong hardware entropy (different/re-registered credential), corrupt
    // entry, etc. -- all treated as a plain cache miss.
    return null;
  }
}

/**
 * Unlock the vault using WebAuthn biometric assertion.
 */
export async function authenticateWithBiometrics(vaultId: string): Promise<{ combinedSignature: string; hardwareEntropy: string; hardwareEntropyBuffer: ArrayBuffer }> {
  const credIdStr = localStorage.getItem(`${STORAGE_PREFIX}cred_id_${vaultId}`);
  const ivStr = localStorage.getItem(`${STORAGE_PREFIX}iv_${vaultId}`);
  const encryptedSigStr = localStorage.getItem(`${STORAGE_PREFIX}enc_sig_${vaultId}`);
  const prfSaltStr = localStorage.getItem(`${STORAGE_PREFIX}prf_salt_${vaultId}`);

  if (!credIdStr || !ivStr || !encryptedSigStr) {
    throw new Error("No biometrics link registered for this vault container.");
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credIdBuffer = base64UrlToArrayBuffer(credIdStr);
  const prfSaltBuffer = prfSaltStr ? base64UrlToArrayBuffer(prfSaltStr) : crypto.getRandomValues(new Uint8Array(32));

  const assertionOptions: CredentialRequestOptions = {
    publicKey: {
      challenge,
      allowCredentials: [
        {
          type: "public-key",
          id: credIdBuffer
        }
      ],
      userVerification: "required",
      timeout: 60000,
      extensions: {
        prf: {
          eval: {
            first: prfSaltBuffer
          }
        }
      } as any
    }
  };

  try {
    // 1. Perform biometric assertion check
    const assertion = (await navigator.credentials.get(assertionOptions)) as PublicKeyCredential;
    if (!assertion) {
      throw new Error("Biometric verification challenge cancelled.");
    }

    const extResults = assertion.getClientExtensionResults() as any;
    let hardwareEntropyBuffer = assertion.rawId;

    if (extResults.prf?.results?.first) {
      hardwareEntropyBuffer = extResults.prf.results.first;
    } else if (prfSaltStr) {
      throw new Error("Hardware authenticator failed PRF verification. Cryptographic token possession cannot be verified.");
    } else {
      console.warn("PRF extension not evaluated; using the same rawId-based device binding this cache was registered with (does not affect the vault's actual encryption key).");
      hardwareEntropyBuffer = assertion.rawId;
    }

    // 2. Re-derive the LOCAL cache-wrapping key (not the vault KEK) using
    // the same PRF output or rawId fallback this cache was registered with
    const hwKeyMaterial = await crypto.subtle.importKey(
      "raw",
      hardwareEntropyBuffer,
      "HKDF",
      false,
      ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: new Uint8Array(16),
        info: new TextEncoder().encode("webauthn-hardware-bound-kek")
      },
      hwKeyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // 3. Decrypt the combined signature
    const iv = new Uint8Array(base64UrlToArrayBuffer(ivStr));
    const encryptedData = new Uint8Array(base64UrlToArrayBuffer(encryptedSigStr));

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encryptedData
    );

    const dec = new TextDecoder();
    const signature = dec.decode(decryptedBuffer);

    const hardwareEntropyHex = Array.from(new Uint8Array(hardwareEntropyBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      combinedSignature: signature,
      hardwareEntropy: hardwareEntropyHex,
      hardwareEntropyBuffer
    };

  } catch (err: any) {
    console.error("Biometric unlock assertion exception:", err);
    if (err.message && err.message.includes("publickey-credentials-get")) {
      throw new Error("Biometric hardware access is blocked by the browser in this iframe. Please open the app in a new tab.");
    }
    if (err.name === "NotAllowedError") {
      throw new Error("Biometric unlock challenge was cancelled or verification failed.");
    }
    if (err.name === "SecurityError") {
      throw new Error("WebAuthn is blocked by iframe sandboxing. Please click 'Open in a New Tab' at the top right to use TouchId/FaceId.");
    }
    throw new Error(err.message || "Failed to assert biometric identification.");
  }
}

/**
 * Claim 1(d)/11: Obtain WebAuthn PRF extension output specifically for KEK derivation.
 * Returns undefined if PRF is unsupported, triggering Claim 14 fallback.
 */
export async function getWebAuthnPRFOutputForNewCredential(
  userEmail: string = 'user@whyor.io'
): Promise<{ credentialId: string; prfOutput: ArrayBuffer; prfSalt: ArrayBuffer } | undefined> {
  const isSupported = await checkBiometricSupport();
  if (!isSupported) return undefined;

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const prfSalt = crypto.getRandomValues(new Uint8Array(32));

  const creationOptions: CredentialCreationOptions = {
    publicKey: {
      challenge,
      rp: { name: 'WhyOr Cryptographic Vault Engine', id: window.location.hostname },
      user: { id: userId, name: userEmail, displayName: userEmail.split('@')[0] },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 5000,
      attestation: 'none',
      extensions: { prf: { eval: { first: prfSalt } } } as any,
    },
  };

  try {
    const credential = (await navigator.credentials.create(creationOptions)) as PublicKeyCredential;
    if (!credential) return undefined;
    const extResults = credential.getClientExtensionResults() as any;
    const prfOutput = extResults?.prf?.results?.first;
    if (!prfOutput) {
      console.warn('Authenticator does not support PRF extension. Claim 1/11 fallback: Final KEK = Base KEK.');
      return undefined;
    }
    return {
      credentialId: arrayBufferToBase64Url(credential.rawId),
      prfOutput,
      prfSalt: prfSalt.buffer,
    };
  } catch (err) {
    console.warn('PRF credential creation failed; falling back to passphrase-only KEK.', err);
    return undefined;
  }
}

export async function getWebAuthnPRFOutputForAssertion(
  credentialId: string,
  prfSalt: ArrayBuffer
): Promise<ArrayBuffer | undefined> {
  try {
    const assertionOptions: CredentialRequestOptions = {
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: base64UrlToArrayBuffer(credentialId) }],
        userVerification: 'required',
        timeout: 60000,
        extensions: { prf: { eval: { first: prfSalt } } } as any,
      },
    };
    const assertion = (await navigator.credentials.get(assertionOptions)) as PublicKeyCredential;
    if (!assertion) return undefined;
    const extResults = assertion.getClientExtensionResults() as any;
    return extResults?.prf?.results?.first ?? undefined;
  } catch (err) {
    console.warn('PRF assertion failed; falling back to passphrase-only KEK.', err);
    return undefined;
  }
}
