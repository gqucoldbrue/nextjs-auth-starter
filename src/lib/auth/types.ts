// src/lib/auth/types.ts
import { DefaultSession } from "next-auth"

// Extend next-auth types to include user ID
declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

// src/middleware.ts
import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname
  
  // Public paths that don't require authentication
  const isPublicPath = [
    "/auth/signin",
    "/auth/signup",
    "/auth/forgot-password",
  ].includes(path)

  // Get the token from the session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redirect logic
  if (isPublicPath && token) {
    // If user is signed in and tries to access auth pages,
    // redirect them to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isPublicPath && !token) {
    // If user is not signed in and tries to access protected pages,
    // redirect them to signin
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/auth/:path*",
  ],
}

// src/components/auth/protected-page.tsx
import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth/config"

interface ProtectedPageProps {
  children: React.ReactNode
}

export async function ProtectedPage({ children }: ProtectedPageProps) {
  const session = await getAuthSession()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return <>{children}</>
}

// src/app/dashboard/layout.tsx
import { ProtectedPage } from "@/components/auth/protected-page"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedPage>
      <main>{children}</main>
    </ProtectedPage>
  )
}
