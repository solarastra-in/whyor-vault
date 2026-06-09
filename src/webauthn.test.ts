import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkBiometricSupport, registerBiometrics, authenticateWithBiometrics } from './lib/webauthn';
import crypto from 'crypto';

// Setup mock for web crypto and base64 functions
if (typeof window === 'undefined') {
  globalThis.window = { location: { hostname: 'localhost' } } as any;
}
if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto as any;
}

if (!globalThis.btoa) {
  globalThis.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}
if (!globalThis.atob) {
  globalThis.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

// Local storage mock
const store = new Map();
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) || null,
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
  clear: () => store.clear(),
} as any;

// Mock navigator.credentials
const mockCreate = vi.fn();
const mockGet = vi.fn();
globalThis.navigator = {
  credentials: {
    create: mockCreate,
    get: mockGet,
  }
} as any;

const base64url = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

describe("WebAuthn PRF Entropy Binding", () => {
  beforeEach(() => {
    localStorage.clear();
    mockCreate.mockReset();
    mockGet.mockReset();
    globalThis.PublicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true)
    } as any;
  });

  it("should evaluate PRF during registration securely without exposing raw keys", async () => {
    const rawId = new Uint8Array([1,2,3,4,5]).buffer;
    const prfOutput = new Uint8Array([9,9,9,9,9]).buffer;

    mockCreate.mockResolvedValue({
      rawId,
      getClientExtensionResults: () => ({
        prf: { results: { first: prfOutput } }
      })
    });

    const result = await registerBiometrics("test_vault", "test_signature", "user@test.io");
    
    // The hardware entropy returned should match the PRF output, NOT the raw ID
    const expectedHex = Array.from(new Uint8Array(prfOutput)).map((b: any) => b.toString(16).padStart(2, '0')).join('');
    expect(result.hardwareEntropy).toBe(expectedHex);
    expect(result.credentialId).toBe(base64url(Buffer.from(rawId)));
    
    // PRF salt must be stored in localStorage
    const prfSaltStr = localStorage.getItem("whyor_webauthn_v3_prf_salt_test_vault");
    expect(prfSaltStr).toBeTruthy();
  });

  it("should enforce PRF evaluation during authentication and fail if missing", async () => {
    const rawId = new Uint8Array([1,2,3,4,5]).buffer;
    const prfOutput = new Uint8Array([9,9,9,9,9]).buffer;

    // Simulate successful registration
    mockCreate.mockResolvedValue({
      rawId,
      getClientExtensionResults: () => ({
        prf: { results: { first: prfOutput } }
      })
    });
    await registerBiometrics("test_vault", "test_signature", "user@test.io");

    // Simulate unlock with missing PRF support
    mockGet.mockResolvedValue({
      rawId,
      getClientExtensionResults: () => ({}) // PRF not returned
    });

    await expect(authenticateWithBiometrics("test_vault")).rejects.toThrow(
      "Hardware authenticator failed PRF verification. Cryptographic token possession cannot be verified."
    );
  });

  it("should successfully authenticate with valid PRF assertion", async () => {
    const rawId = new Uint8Array([1,2,3,4,5]).buffer;
    const prfOutput = new Uint8Array([9,9,9,9,9]).buffer;

    // Simulate successful registration
    mockCreate.mockResolvedValue({
      rawId,
      getClientExtensionResults: () => ({
        prf: { results: { first: prfOutput } }
      })
    });
    await registerBiometrics("test_vault", "test_signature", "user@test.io");

    // Simulate successful unlock
    mockGet.mockResolvedValue({
      rawId,
      getClientExtensionResults: () => ({
        prf: { results: { first: prfOutput } }
      })
    });

    const unlockResult = await authenticateWithBiometrics("test_vault");
    expect(unlockResult.combinedSignature).toBe("test_signature");
    
    const expectedHex = Array.from(new Uint8Array(prfOutput)).map((b: any) => b.toString(16).padStart(2, '0')).join('');
    expect(unlockResult.hardwareEntropy).toBe(expectedHex);
  });
});
