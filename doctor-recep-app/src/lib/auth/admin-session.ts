import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export interface AdminSessionPayload {
  adminId: string;
  role: 'admin' | 'super_admin';
  expiresAt: Date;
}

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function encryptAdminSession(payload: AdminSessionPayload) {
  // Fix: Cast payload to Record<string, unknown> for SignJWT
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decryptAdminSession(session: string | undefined = '') {
  try {
    if (!session) {
      return null
    }

    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    // Fix: cast to unknown first, then to AdminSessionPayload for type safety
    return payload as unknown as AdminSessionPayload
  } catch {
    console.log('Failed to verify admin session')
    return null
  }
}

export async function createAdminSession(adminId: string, role: 'admin' | 'super_admin' = 'admin') {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encryptAdminSession({ adminId, role, expiresAt })
  const cookieStore = await cookies()

  console.log('DEBUG: Creating admin session for admin:', adminId, 'role:', role)
  console.log('DEBUG: Admin session expires at:', expiresAt)

  cookieStore.set('admin_session', session, {
    httpOnly: true,
    secure: false, // Always false for debugging
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
  
  console.log('DEBUG: Admin session cookie set successfully')
}

export async function updateAdminSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  const payload = await decryptAdminSession(session)

  if (!session || !payload) {
    return null
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  cookieStore.set('admin_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteAdminSession() {
  const cookieStore = await cookies()
  console.log('DEBUG: Deleting admin session cookie')
  cookieStore.delete('admin_session')
  console.log('DEBUG: Admin session cookie deleted')
}

// For backward compatibility with regular session functions
export { deleteAdminSession as deleteSession }
