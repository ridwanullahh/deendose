import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const adminSecret = process.env.ADMIN_SECRET

    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Admin authentication not configured' },
        { status: 500 }
      )
    }

    if (password !== adminSecret) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create session
    const sessionToken = Buffer.from(
      `${Date.now()}-${Math.random().toString(36)}`
    ).toString('base64')

    const response = NextResponse.json({ success: true })

    // Set cookie
    response.cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
