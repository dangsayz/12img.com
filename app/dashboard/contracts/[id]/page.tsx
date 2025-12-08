import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getContract } from '@/server/actions/contract.actions'
import { ContractEditor } from '@/components/contracts/ContractEditor'

export const metadata = {
  title: 'Contract Editor | 12IMG',
}

interface PageProps {
  params: Promise<{ id: string }>
}

async function ContractData({ contractId }: { contractId: string }) {
  const result = await getContract(contractId)

  if (!result.success || !result.data) {
    notFound()
  }

  const contract = result.data
  const clientName = contract.client
    ? `${contract.client.firstName} ${contract.client.lastName}${
        contract.client.partnerFirstName ? ` & ${contract.client.partnerFirstName}` : ''
      }`
    : 'Client'

  return (
    <ContractEditor
      contract={contract}
      clientName={clientName}
      clientId={contract.clientId}
    />
  )
}

export default async function ContractDetailPage({ params }: PageProps) {
  const { id } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-stone-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
            <p className="text-sm text-stone-500">Loading contract...</p>
          </div>
        </div>
      }
    >
      <ContractData contractId={id} />
    </Suspense>
  )
}
