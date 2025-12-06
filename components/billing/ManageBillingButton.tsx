'use client'

import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'

interface ManageBillingButtonProps {
  className?: string
}

export function ManageBillingButton({ className }: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to open billing portal')
      }
    } catch (error) {
      console.error('Billing portal error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleManageBilling}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Manage Billing
        </>
      )}
    </button>
  )
}
