import { UserProfile } from '@clerk/nextjs'
import { Header } from '@/components/layout/Header'

export default function AccountPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <UserProfile 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-none',
            }
          }}
        />
      </main>
    </>
  )
}
