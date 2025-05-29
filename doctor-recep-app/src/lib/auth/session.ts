import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { SessionPayload } from '@/lib/types' // UNCOMMENT THIS LINE
// TODO: Remove this line (type SessionPayload = any)
// type SessionPayload = any // REMOVE THIS LINE

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload) {
  // Fix: Cast payload to Record<string, unknown> for SignJWT
  return new SignJWT(payload as unknown as Record<string, unknown>) // Keep this cast
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    if (!session) {
      return null
    }

    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    // Fix: cast to unknown first, then to SessionPayload for type safety
    return payload as unknown as SessionPayload // Keep this cast
  } catch {
    console.log('Failed to verify session')
    return null
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, expiresAt })
  const cookieStore = await cookies()

  console.log('DEBUG: Creating session for user:', userId)
  console.log('DEBUG: Session expires at:', expiresAt)

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: false, // Always false for debugging
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
  
  console.log('DEBUG: Session cookie set successfully')
}

export async function updateSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  console.log('DEBUG: Updating session - session exists:', !!session)
  console.log('DEBUG: Updating session - payload valid:', !!payload)

  if (!session || !payload) {
    console.log('DEBUG: Cannot update session - missing session or payload')
    return null
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: false, // Always false for debugging
    expires: expires,
    sameSite: 'lax',
    path: '/',
  })
  
  console.log('DEBUG: Session updated successfully')
}

export async function refreshSession(userId: string) {
  // Delete old session and create new one
  console.log('DEBUG: Refreshing session for user:', userId)
  await deleteSession()
  await createSession(userId)
  console.log('DEBUG: Session refresh completed')
}

export async function deleteSession() {
  const cookieStore = await cookies()
  console.log('DEBUG: Deleting session cookie')
  cookieStore.delete('session')
  console.log('DEBUG: Session cookie deleted')
}
