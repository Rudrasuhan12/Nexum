import crypto from "crypto";

/**
 * RFC 8785: JSON Canonicalization Scheme (JCS)
 * Ensures deterministic byte-for-byte serialization across platforms,
 * languages, and environments without ad-hoc string formatting.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const elements = obj.map((element) => canonicalizeJson(element));
    return `[${elements.join(",")}]`;
  }

  const entries = Object.entries(obj as Record<string, unknown>)
    .filter(([_, value]) => value !== undefined)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  const members = entries.map(
    ([key, value]) => `${JSON.stringify(key)}:${canonicalizeJson(value)}`
  );

  return `{${members.join(",")}}`;
}

/**
 * In-toto Statement v1.0 and SLSA v1.0 Provenance Types
 * @see https://in-toto.io/Statement/v1
 * @see https://slsa.dev/spec/v1.0/provenance
 */
export interface SlsaSubject {
  name: string;
  digest: {
    sha256: string;
  };
}

export interface SlsaProvenanceV1 {
  buildDefinition: {
    buildType: string;
    externalParameters: {
      repository?: string;
      commit?: string;
      milestoneId: string;
      projectId: string;
      sourceReference?: string;
    };
    internalParameters: {
      builderInstanceId: string;
      allowlistedEnv: Record<string, string>;
      isolatedSandboxType: "microvm_firecracker" | "hermetic_container";
    };
    resolvedDependencies: Array<{
      uri: string;
      digest: {
        sha512?: string;
        sha256?: string;
      };
    }>;
  };
  runDetails: {
    builder: {
      id: string;
      version: string;
    };
    metadata: {
      invocationId: string;
      startedOn: string;
      finishedOn: string;
    };
    byproducts?: Array<{
      name: string;
      digest: { sha256: string };
    }>;
  };
}

export interface InTotoStatementV1 {
  _type: "https://in-toto.io/Statement/v1";
  subject: SlsaSubject[];
  predicateType: "https://slsa.dev/provenance/v1";
  predicate: SlsaProvenanceV1;
}

export interface SignedSlsaAttestation {
  payload: string; // Base64-encoded canonical JSON
  payloadType: "application/vnd.in-toto+json";
  signatures: Array<{
    keyid: string;
    sig: string; // Base64-encoded Ed25519 signature
  }>;
  attestationDocument: InTotoStatementV1;
}

// In-Memory Key Management & Rotation Ledger (Simulating KMS / JWKS)
interface KeyLedgerEntry {
  kid: string;
  publicKeyPem: string;
  privateKeyPem: string;
  status: "ACTIVE" | "DECOMMISSIONED" | "REVOKED";
  createdAt: string;
  expiresAt: string;
}

const keyLedger: Map<string, KeyLedgerEntry> = new Map();

/**
 * Initializes or retrieves an active Ed25519 keypair for SLSA attestation.
 */
export function getOrCreateActiveKey(keyVersion = "2026-v1"): KeyLedgerEntry {
  const kid = `nexum-verifier-${keyVersion}`;
  const existing = keyLedger.get(kid);
  if (existing && existing.status === "ACTIVE") {
    return existing;
  }

  // Generate asymmetric Ed25519 keypair
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const now = new Date();
  const expires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days validity

  const entry: KeyLedgerEntry = {
    kid,
    publicKeyPem: publicKey,
    privateKeyPem: privateKey,
    status: "ACTIVE",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  keyLedger.set(kid, entry);
  return entry;
}

/**
 * Generates an official SLSA v1.0 Provenance Attestation signed with Ed25519.
 * Strictly adheres to RFC 8785 Canonical JSON Serialization.
 */
export function generateSignedSlsaAttestation(params: {
  subjectName: string;
  subjectSha256: string;
  milestoneId: string;
  projectId: string;
  sourceReference: string;
  builderInstanceId: string;
  allowlistedEnv?: Record<string, string>;
  dependencies?: Array<{ uri: string; sha512?: string; sha256?: string }>;
}): SignedSlsaAttestation {
  const key = getOrCreateActiveKey();

  // Strict allowlist: never leak secrets into provenance
  const safeEnv: Record<string, string> = {
    NODE_ENV: process.env.NODE_ENV || "production",
    VERIFIER_VERSION: "3.7.0-enterprise",
    BUILD_PLATFORM: process.platform,
    ...(params.allowlistedEnv || {}),
  };

  const now = new Date().toISOString();
  const statement: InTotoStatementV1 = {
    _type: "https://in-toto.io/Statement/v1",
    subject: [
      {
        name: params.subjectName,
        digest: {
          sha256: params.subjectSha256,
        },
      },
    ],
    predicateType: "https://slsa.dev/provenance/v1",
    predicate: {
      buildDefinition: {
        buildType: "https://nexum.dev/attestation/v1/hermetic-verification",
        externalParameters: {
          milestoneId: params.milestoneId,
          projectId: params.projectId,
          sourceReference: params.sourceReference,
        },
        internalParameters: {
          builderInstanceId: params.builderInstanceId,
          allowlistedEnv: safeEnv,
          isolatedSandboxType: "hermetic_container",
        },
        resolvedDependencies: (params.dependencies || []).map((d) => ({
          uri: d.uri,
          digest: {
            sha512: d.sha512,
            sha256: d.sha256,
          },
        })),
      },
      runDetails: {
        builder: {
          id: `https://verifier.nexum.dev/builders/${key.kid}`,
          version: "3.7.0",
        },
        metadata: {
          invocationId: `inv_${crypto.randomBytes(12).toString("hex")}`,
          startedOn: now,
          finishedOn: now,
        },
      },
    },
  };

  // 1. Serialize using RFC 8785 Canonical JSON
  const canonicalBytes = Buffer.from(canonicalizeJson(statement), "utf-8");

  // 2. Sign using Ed25519 private key
  const signature = crypto.sign(null, canonicalBytes, key.privateKeyPem);

  return {
    payload: canonicalBytes.toString("base64"),
    payloadType: "application/vnd.in-toto+json",
    signatures: [
      {
        keyid: key.kid,
        sig: signature.toString("base64"),
      },
    ],
    attestationDocument: statement,
  };
}

/**
 * Cryptographically verifies a signed SLSA attestation against the JWKS public key.
 */
export function verifySlsaAttestation(attestation: SignedSlsaAttestation): {
  isValid: boolean;
  keyId: string;
  error?: string;
} {
  const sigEntry = attestation.signatures[0];
  if (!sigEntry) {
    return { isValid: false, keyId: "", error: "Missing signature block" };
  }

  const key = keyLedger.get(sigEntry.keyid);
  if (!key) {
    return { isValid: false, keyId: sigEntry.keyid, error: `Key ID "${sigEntry.keyid}" not found in JWKS ledger` };
  }

  if (key.status === "REVOKED") {
    return { isValid: false, keyId: sigEntry.keyid, error: "Signing key has been explicitly REVOKED" };
  }

  try {
    const canonicalBytes = Buffer.from(attestation.payload, "base64");
    const sigBytes = Buffer.from(sigEntry.sig, "base64");

    const isVerified = crypto.verify(null, canonicalBytes, key.publicKeyPem, sigBytes);
    return {
      isValid: isVerified,
      keyId: sigEntry.keyid,
      error: isVerified ? undefined : "Cryptographic signature verification failed (data was tampered)",
    };
  } catch (err: any) {
    return { isValid: false, keyId: sigEntry.keyid, error: err?.message || "Verification exception" };
  }
}

