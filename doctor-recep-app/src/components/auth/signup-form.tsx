'use client'

import { useActionState } from 'react'
import { signup } from '@/lib/actions/auth'
import { FormState } from '@/lib/types'

// CORRECTED initialState to conform to FormState interface
const initialState: FormState = {
  success: false,
  message: '',
  // fieldErrors is optional, so it can be omitted or set to an empty object if needed
  // fieldErrors: {},
}

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState)

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Dr. John Doe"
          />
          {/* Use state.fieldErrors consistent with FormState definition */}
          {state?.fieldErrors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="doctor@example.com"
          />
          {/* Use state.fieldErrors consistent with FormState definition */}
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Password"
          />
          {/* Use state.fieldErrors consistent with FormState definition */}
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="clinic_name" className="block text-sm font-medium text-gray-700">
            Clinic Name (Optional)
          </label>
          <input
            id="clinic_name"
            name="clinic_name"
            type="text"
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="ABC Medical Center"
          />
          {/* Use state.fieldErrors consistent with FormState definition */}
          {state?.fieldErrors?.clinic_name && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.clinic_name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number (Optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="+91 9876543210"
          />
          {/* Use state.fieldErrors consistent with FormState definition */}
          {state?.fieldErrors?.phone && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.phone[0]}</p>
          )}
        </div>
      </div>

      {state?.message && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{state.message}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating account...' : 'Create account'}
        </button>
      </div>
    </form>
  )
}