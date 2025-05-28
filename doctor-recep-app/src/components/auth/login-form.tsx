'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'
import { FormState } from '@/lib/types'

// CORRECTED initialState to conform to FormState interface
const initialState: FormState = {
  success: false,
  message: '',
  // fieldErrors is optional, so it can be omitted or set to an empty object if needed
  // fieldErrors: {},
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
          {/* Use state.fieldErrors consistent with FormState definition */}
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
          {/* Use state.fieldErrors consistent with FormState definition */}
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.password[0]}</p>
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
          {isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  )
}