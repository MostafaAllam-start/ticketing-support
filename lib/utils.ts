import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FormEvent } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// React 19 automatically resets an uncontrolled <form> once its action settles —
// even when the action returns a validation error instead of throwing — which
// wipes whatever the user typed. Wire this to a form's `onReset` to cancel that
// reset on failure so the input survives; a successful submit still clears it.
export function keepInputOnError(state: {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}) {
  return (event: FormEvent<HTMLFormElement>) => {
    if (!state.ok) event.preventDefault()
  }
}
