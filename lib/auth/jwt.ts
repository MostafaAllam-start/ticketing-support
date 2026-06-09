import { SignJWT, jwtVerify } from "jose";

// Name of the httpOnly cookie that stores the signed JWT. Marked httpOnly so the
// token is never readable from client-side JavaScript.
export const AUTH_COOKIE = "token";

// Token / cookie lifetime in seconds (7 days).
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

export interface AuthTokenPayload {
  sub: string; // user id (stringified)
  username: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

// Signs an HS256 JWT for the given user. Edge-runtime safe (jose), so the same
// token can be verified in middleware.
export async function signToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

// Verifies a token's signature/expiry and returns its payload. Throws if invalid
// or expired.
//
// NOTE: this is a stateless, cryptographic check only — it does NOT confirm the
// user still exists, is enabled, or is not soft-deleted. For request
// authentication that must reflect live account status, use
// `userService.currentUser()`, which re-reads the user from the database.
export async function verifyToken(token: string): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return {
    sub: String(payload.sub),
    username: String(payload.username),
  };
}
