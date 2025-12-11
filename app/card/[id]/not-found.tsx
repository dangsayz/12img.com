import { MinimalNotFound } from '@/components/ui/MinimalNotFound'

export default function CardNotFound() {
  return (
    <MinimalNotFound
      title="Gone"
      message="This card has expired or been removed"
      redirectTo="/"
      redirectLabel="Go home"
    />
  )
}
