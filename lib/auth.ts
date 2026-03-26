import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const COOKIE_NAME = "hf_token"

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("Missing JWT_SECRET env var")
  return new TextEncoder().encode(secret)
}

export async function signAuthToken(payload: { userId: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret())
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  const userId = payload.userId
  if (typeof userId !== "string") throw new Error("Invalid token payload")
  return { userId }
}

export async function getUserIdFromRequestCookie(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { userId } = await verifyAuthToken(token)
    return userId
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  ;(await cookies()).set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearAuthCookie() {
  ;(await cookies()).set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

