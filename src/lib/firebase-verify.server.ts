import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/robot/v1/metadata/jwks/securetoken@system.gserviceaccount.com"
  )
);

export type FirebaseClaims = {
  uid: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function verifyFirebaseIdToken(
  token: string
): Promise<FirebaseClaims> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID missing");

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const sub = payload.sub;
  const email = (payload as { email?: string }).email;
  if (!sub || !email) throw new Error("Invalid Firebase token");

  return {
    uid: sub,
    email,
    email_verified: Boolean((payload as { email_verified?: boolean }).email_verified),
    name: (payload as { name?: string }).name,
    picture: (payload as { picture?: string }).picture,
  };
}

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function requireAdmin(token: string | null | undefined) {
  if (!token) {
    const err = new Error("Unauthorized");
    (err as { statusCode?: number }).statusCode = 401;
    throw err;
  }
  const claims = await verifyFirebaseIdToken(token);
  if (!isAdminEmail(claims.email)) {
    const err = new Error("Forbidden");
    (err as { statusCode?: number }).statusCode = 403;
    throw err;
  }
  return claims;
}