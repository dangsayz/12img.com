import { MinimalNotFound } from '@/components/ui/MinimalNotFound'

export default function NotFound() {
  return (
    <MinimalNotFound
      title="Gone"
      message="This image has expired or the link is incorrect"
      redirectTo="/"
      redirectLabel="Go home"
    />
  )
}
