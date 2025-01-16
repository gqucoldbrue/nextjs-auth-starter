'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters'),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfileForm() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: async () => {
      // Fetch current profile data
      const response = await fetch(`/api/profile/${session?.user.id}`)
      if (!response.ok) throw new Error('Failed to fetch profile')
      return response.json()
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/profile/${session?.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Show success message or redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (form.formState.isLoading) {
    return <div>Loading profile...</div>
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name">Name</label>
        <input
          {...form.register('name')}
          className="w-full p-2 border rounded"
        />
        {form.formState.errors.name && (
          <span className="text-red-600">
            {form.formState.errors.name.message}
          </span>
        )}
      </div>

      {/* Similar fields for bio, location, website */}
      
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isLoading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}
