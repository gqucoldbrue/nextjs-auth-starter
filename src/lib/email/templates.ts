export function createPasswordResetEmail(resetToken: string, baseUrl: string) {
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`
    
    return {
      subject: 'Reset Your Password',
      text: `Click this link to reset your password: ${resetUrl}`,
      html: `
        <h1>Reset Your Password</h1>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetUrl}" style="padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      `
    }
  }
