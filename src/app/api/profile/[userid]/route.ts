
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAuthSession()
    
    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check authorization
    if (session.user.id !== params.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Apply rate limiting
    const { success } = await rateLimit.check(
      request,
      10, // Max requests
      '1 m' // Time window
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const data = await request.json()

    const profile = await prisma.profile.update({
      where: { userId: params.userId },
      data: {
        name: data.name,
        bio: data.bio,
        location: data.location,
        website: data.website,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}