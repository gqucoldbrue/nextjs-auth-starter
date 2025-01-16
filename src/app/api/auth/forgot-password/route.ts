
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateResetToken, hashToken } from '@/lib/auth/tokens'
import { sendEmail } from '@/lib/email/send'
import { createPasswordResetEmail } from '@/lib/email/templates'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Apply rate limiting
    const { success } = await rateLimit.check(request, 3, '1 h')
    if (!success) {
      return NextResponse.json(
        { error: 'Too many password reset attempts' },
        { status: 429 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    
    // Don't reveal if user exists
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset email has been sent' })
    }

    const token = generateResetToken()
    const hashedToken = hashToken(token)
    const expires = new Date(Date.now() + 3600000) // 1 hour

    // Store reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expires,
      },
    })

    // Send email
    const emailContent = createPasswordResetEmail(
      token,
      process.env.NEXTAUTH_URL!
    )
    
    await sendEmail({
      to: email,
      ...emailContent,
    })

    return NextResponse.json({
      message: 'If an account exists, a reset email has been sent',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset' },
      { status: 500 }
    )
  }
}
