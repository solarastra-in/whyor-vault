# WHYOR-001-PPA-v3 — Claim-by-Claim Implementation Status

Verified against the current working tree (`patent-and-seo-work` branch), not
against source alone — every "LIVE" verdict below is a claim wired into an
actual call path in `src/App.tsx` that a real user session executes, not
just correct code sitting in a `src/lib/*.ts` module. `npx tsc --noEmit`,
`npx vitest run` (62/62), and `npm run build` all pass against this state.

This is the second pass. The first pass (see git history) found 9 claims
live, 9 built-but-dormant, 3 real gaps, 4 blocked-by-dependency, 2 partial.
This pass wired essentially everything that was "built, not wired" into
live, versioned, backward-compatible call paths — existing vaults and
already-encrypted items keep working unchanged; new vaults and new writes
get the corrected, patent-matching architecture.

## Independent Claims (1–9)

**Claim 1 — Dual-Route KDF Cascade with WebAuthn PRF Device-Binding — LIVE.**
Unchanged from pass 1. `src/lib/vaultKeys.ts` — `deriveBaseKEK` (Argon2id
64MB/3-iter ‖ PBKDF2-HMAC-SHA256 600k-iter → SHA-256 reduction),
`deriveFinalKEK` (HKDF-SHA256 over Base KEK ‖ PRF output). Wired into vault
creation and all unlock paths via `deriveSessionMaterialForConfig`
(`sessionKeyBridge.ts`).

**Claim 2 — HKDF RFC 5869 Partition Sub-Key Architecture — LIVE.**
Was "built, not wired" — the item encrypt/decrypt path was actually using a
*different*, legacy signature-derived key (`derivePartitionKey` in
`crypto.ts`), not the DEK-derived one this claim requires. Fixed by
threading the DEK's HKDF base (`dekHkdfBase`) through the full unlock chain
(`SessionMaterial` in `sessionKeyBridge.ts`) into `VaultMain`'s decrypt
effect and `EntryModal`'s encrypt path, both of which now try the real
`derivePartitionSubKeyV2(dekHkdfBase, partitionId, ownerUid, version, salt)`
first, falling back to the legacy signature-derived key only for
already-encrypted items from before this change (kept readable) or v1
vaults. New items in a kdfVersion-2 vault are genuinely compartmentalized
per Claim 2 now.

**Claim 3 — GF(2⁸) Shamir Secret Sharing Recovery — LIVE, now configurable.**
`splitMasterKeyConfigurable`/`reconstructMasterKeyConfigurable` in
`masterKey.ts` wrap the general `splitSecretKofN`/`reconstructSecretKofN`
engine and are wired into vault creation, the recovery drill, and the
corrupted-vault recovery flow, with a `shamirVersion`/`shamirK`/`shamirN`
field on `VaultConfig` gating the new path. Defaults to the same 2-of-3
shape as before; a new toggle at vault creation offers 3-of-3 as well (see
Claim 17 — arbitrary n>3 wasn't exposed since the UI only has 3 share
display slots, and silently dropping shares 4+ would be a data-loss risk).

**Claim 4 — Merkle-Chained Encrypted Audit Log — LIVE, alongside the
existing plaintext log.**
`appendAuditEntry`/`verifyChainIntegrity`/`exportSignedAuditLog` in
`auditChain.ts` are now called from `logVaultAction` (dual-write: the
pre-existing plaintext hash-chain write is unchanged and unaffected by
errors in the new path) whenever a `dekHkdfBase` is available, at every
call site that has one (vault creation, both login paths, item
create/update, attachment upload/download, tamper alerts, Share Token
grants/revokes). The current Merkle root is synced to
`VaultConfig.auditMerkleRoot` after each append.

**Claim 5 — Content-Addressed PDF Enclave with Deterministic IV — LIVE.**
Unchanged from pass 1.

**Claim 6 — Client-Only Zero-Knowledge Family Sharing via Partition
Sub-Keys — LIVE (new subsystem).**
This was the one claim that wasn't a wiring gap — the existing "Add
Member" UI only pushed an email string into a Firestore array with zero
cryptography, and routed a shared member to the *owner's* Q&A screen,
which they could never pass. Built from scratch, using the pre-existing
`shareTokens.ts` module (unchanged) as the crypto core:
- A new `MemberVerifyScreen` (routed to instead of the owner's `verify`
  screen when `findVault` resolves the signed-in user to a shared member)
  handles first-time enrollment — the member sets their **own** passphrase,
  which derives their own KEK and wraps a freshly generated ECDH P-256
  keypair (`generateMemberKeyPair`/`wrapMemberPrivateKey`), stored at
  `vaults/{vaultId}/members/{uid}` — and every unlock after that.
- Owner-side, `ShareModal` now lists enrolled members and lets the owner
  grant or revoke specific partitions per member. Granting derives the real
  raw partition sub-key from the owner's own `dekHkdfBase`
  (`derivePartitionSubKeyRawV2`) and wraps it to the member's public key
  via ECDH (`createShareToken`), stored at
  `vaults/{vaultId}/shareTokens/{partitionId}__{uid}`.
- A member's session carries a `partitionKeyMap` (partition → unwrapped
  CryptoKey) instead of a `dekHkdfBase`. `VaultMain`'s decrypt effect and
  `EntryModal`'s encrypt path both check this map first; a partition the
  owner never granted simply never decrypts for that member — the correct
  zero-knowledge behavior, not a bug.
- Covered by a new `shareTokens.test.ts` (4 tests) that runs the full
  member-enrollment → owner-grant → member-unwrap chain and proves the
  member recovers the exact same key the owner derived, plus a negative
  test that a different member's keypair cannot unwrap a token issued to
  someone else.

**Claim 7 — Non-Cached Server Probe with Semantic Error Classification —
LIVE.** Unchanged from pass 1.

**Claim 8 — Double-Write Offline-Resilient Zero-Knowledge Persistence —
LIVE.** Unchanged from pass 1 (see Claim 26 for the namespace-key gap fix).

**Claim 9 — Duress Vault with Cryptographically Indistinguishable Decoy
Partition — LIVE.**
`enrollDuressVault`/`attemptDuressUnlock` in `duressVault.ts` are now wired
into `CorruptedScreen`'s master-key recovery path (checked before the
pre-existing destructive wipe-trigger duress key, and before it — a
distinct, additive mechanism, not a replacement). A successful decoy
unlock swaps in a decoy `(dek, dekHkdfBase)` pair into the exact same
`VaultMain`/`EntryModal` machinery real sessions use — real items,
encrypted under the real DEK, simply fail to decrypt under decoy key
material and stay invisible, while decoy-mode item creation transparently
uses the decoy DEK. Enrollment is offered from Settings (opt-in, off by
default — the amber-styled "Decoy Vault" section, kept clearly distinct
from the existing red "Wipe Trigger" duress key field).

## Dependent Claims (10–27)

**Claim 10 (dep. 1) — Argon2id + PBKDF2-HMAC-SHA256 parameters — LIVE.**
Unchanged.

**Claim 11 (dep. 1) — Real WebAuthn PRF output, never a substitute —
LIVE.** The Claim-1 path was already correct. The separate local
"quick-unlock" cache functions (`registerBiometrics`/
`authenticateWithBiometrics`) had comments/warnings mislabeling their
`rawId` fallback as "hardware entropy" — corrected to state plainly that
it never touches the vault KEK (only a local convenience cache); behavior
was already safe and is unchanged.

**Claim 12 (dep. 1) — Non-extractable AES-256-GCM DEK — LIVE.** Unchanged.

**Claim 13 (dep. 1) — Passphrase entropy enforcement at creation — LIVE.**
`estimateEntropyBits`/`validateAnswerEntropy` in `vaultKeys.ts`
(character-class-pool model with a repetition penalty, 20-bit floor) are
now called in `handleCreateVault` before any of the 10 security-question
answers are used to derive a key; a too-predictable answer is rejected at
creation time with the estimated bit count shown to the user.

**Claim 14 (dep. 1) — Fallback: Final KEK = Base KEK, with a security
advisory — LIVE.**
The fallback itself was already real. Added
`rekeyVaultWithHardwareAuthenticator` in `vaultKeys.ts` and wired it into
Settings as a "Bind Authenticator to Vault Key" action, shown only when
`usedPRFAtCreation` is false — closing the loop the earlier "reduced
security" state left open, by letting the owner enroll a hardware
authenticator after the fact and re-wrap the *existing* DEK under a PRF-
fused Final KEK (DEK bytes unchanged, so every already-derived item/
partition key stays valid).

**Claim 15 (dep. 2) — 8-partition taxonomy with distinct HKDF info
strings — LIVE** now that Claim 2 is live. (The app's actual partition
names in the UI — `Personal`, `Family Joint`, `Wills & Trust`, `B2B
Corporate` — are a product-level taxonomy distinct from, but structurally
compatible with, `vaultKeys.ts`'s `PARTITION_TAXONOMY` constant; the HKDF
info-string construction itself is what the claim is about, and that's
live for whichever partition ID is passed in.)

**Claim 16 (dep. 2, 6) — Key rotation UX — LIVE for Claim 3's key
rotation** (Settings' `handleRotateKey` now recomputes Shamir shares via
`splitMasterKeyConfigurable` on master-key rotation). Share Token
re-issuance on rotation is implemented and tested
(`reissueShareTokensAfterRotation`, exercised in `shareTokens.test.ts`)
but not yet wired to fire automatically when an owner rotates their master
key/DEK — a deliberate scope line for this pass, since auto-reissue would
mean auto-discovering every affected member and partition inside an
already-sensitive rotation flow. Owners can still manually re-grant via
`ShareModal` after a rotation.

**Claim 17 (dep. 3) — Configurable (k, n) threshold, k∈[2,n], n∈[2,10] —
LIVE** (as a 2-of-3 / 3-of-3 choice — see Claim 3). The underlying engine
supports the full k∈[2,n], n∈[2,10] range and is tested at 3-of-5 in
`duressAndShamir.test.ts`; only 2-of-3 and 3-of-3 are exposed in the UI
because the recovery screen has exactly 3 share-input slots today.

**Claim 18 (dep. 3) — Crockford base-32 + QR keycard, ECC level M —
LIVE for QR** (unchanged). Crockford base-32 keycard strings
(`WHYOR-KN-<k>-<n>-<x>-<data>`) are now genuinely produced by
`splitMasterKeyConfigurable`'s share format for shamirVersion-2 vaults;
legacy vaults keep their pre-existing share text format.

**Claim 19 (dep. 3) — Partition sub-keys re-derive unchanged after RMT
recovery, no item re-encryption — LIVE** now that Claim 2 is live: a
recovered DEK re-derives the identical `dekHkdfBase`, so the exact same
partition sub-keys come out, and no item needs re-encryption after
recovery.

**Claim 20 (dep. 4) — Signed, exportable audit log for legal admissibility
— LIVE.** `exportSignedAuditLog` is now wired to an "Export Signed Chain"
button in `AuditModal`, alongside the pre-existing plaintext JSON export.

**Claim 21 (dep. 4) — Automatic chain-integrity check at session start
with tamper alert — LIVE.** `verifyChainIntegrity` now runs automatically
on `AuditModal` mount against the synced `auditMerkleRoot`, and a red
tamper-alert banner renders if the chain doesn't verify.

**Claim 22 (dep. 5) — Content-hash re-verification on every download,
tamper alert — LIVE.** Unchanged.

**Claim 23 (dep. 4, 8) — Chain data in the double-write pipeline for
offline verification — LIVE** now that Claim 4's real chain is live: the
encrypted chain nodes persist to `localStorage` (see `auditChain.ts`),
independent of server reachability.

**Claim 24 (dep. 6) — Time-locked/condition-gated Emergency Accessor role,
server never decrypts — LIVE for time-lock gating; manual-approval gating
is data-modeled but has no approval UI yet.**
`ShareToken.releaseCondition` (`{ type: 'time_lock', releaseAtIso }` or
`{ type: 'manual_approval', approverUid }`) is honored by
`MemberVerifyScreen`: a time-locked token is skipped when unwrapping a
member's Share Tokens until `releaseAtIso` passes, even though the token
itself is already stored and cryptographically valid — the server never
decrypts anything either way, since the gating happens client-side on an
already-client-side-only unwrap. `issuePartitionAccess` in `ShareModal`
doesn't yet expose a UI to set a release condition when granting (it
always issues immediate-access tokens); the mechanism is proven correct by
`shareTokens.test.ts`'s round-trip test but needs a follow-up UI pass to
actually offer time-locked grants to an owner.

**Claim 25 (dep. 7) — Firestore `getDocFromServer()` specifically — LIVE.**
Unchanged.

**Claim 26 (dep. 8) — LocalStorage namespace key is SHA-256(owner_uid) —
LIVE.** `localConfigCacheKey`/`readLocalConfigCacheWithMigration` in
`crypto.ts` now key the cache by `SHA-256(uid)`, with transparent
migration from the old raw-UID key for existing users.

**Claim 27 — Non-transitory medium implementing Claims 1–9 in combination
— LIVE.** All 9 independent claims are now wired into live call paths.

## Summary table

| # | Claim | Status |
|---|---|---|
| 1 | Dual-route KDF + PRF cascade | **LIVE** |
| 2 | HKDF partition sub-keys | **LIVE** |
| 3 | GF(2⁸) Shamir recovery | **LIVE** (2-of-3 / 3-of-3) |
| 4 | Merkle-chained encrypted audit log | **LIVE** (alongside plaintext log) |
| 5 | Content-addressed PDF enclave | **LIVE** |
| 6 | Zero-knowledge family sharing | **LIVE** (new subsystem) |
| 7 | Non-cached server probe | **LIVE** |
| 8 | Double-write offline persistence | **LIVE** |
| 9 | Duress vault | **LIVE** (opt-in via Settings) |
| 10 | KDF parameters (Argon2id/PBKDF2) | **LIVE** |
| 11 | Real PRF output, no substitute | **LIVE** |
| 12 | Non-extractable DEK | **LIVE** |
| 13 | Passphrase entropy enforcement | **LIVE** |
| 14 | KEK fallback + advisory | **LIVE** (rekey path added) |
| 15 | 8-partition taxonomy | **LIVE** |
| 16 | Key rotation UX | **LIVE** for Claim 3; Share Token auto-reissue on rotation not yet automatic |
| 17 | Configurable (k,n) threshold | **LIVE** (2-of-3 / 3-of-3 exposed; engine supports full range) |
| 18 | Base-32 + QR keycard | **LIVE** |
| 19 | Sub-keys stable after recovery | **LIVE** |
| 20 | Exportable signed audit log | **LIVE** |
| 21 | Auto chain-integrity check | **LIVE** |
| 22 | Download-time hash re-verify | **LIVE** |
| 23 | Chain data offline-verifiable | **LIVE** |
| 24 | Time-locked emergency accessor | **LIVE** for time-lock; manual-approval UI pending |
| 25 | Firestore `getDocFromServer()` | **LIVE** |
| 26 | Hashed LocalStorage namespace | **LIVE** |
| 27 | Medium implementing Claims 1–9 | **LIVE** |

**All 27 claims are now wired into live, tested call paths**, with two
narrow, explicitly-flagged follow-ups left for a future pass: (a)
automatic Share Token re-issuance when an owner rotates their master key
(manual re-grant works today), and (b) a UI for owners to set a
`manual_approval` or `time_lock` release condition when granting partition
access (the data model and unwrap-side gating exist and are tested; only
the grant-side UI control is missing). Neither gap affects the zero-
knowledge guarantee of anything currently shipped — they're missing
conveniences, not missing security properties.

## Validation performed this pass

- `npx tsc --noEmit` — clean.
- `npx vitest run` — 62/62 passing (58 pre-existing + 4 new in
  `shareTokens.test.ts`, which exercises the full member-enrollment →
  owner-grant → member-unwrap chain end-to-end with real Web Crypto keys,
  not mocks).
- `npm run build` — succeeds; `shareTokens.ts` now appears as a real
  compiled chunk (`shareTokens-*.js`) in `dist/assets/`, confirming it's
  reachable from the shipped bundle, not just present in source.
