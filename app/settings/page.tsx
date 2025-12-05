import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserSettings, getUserStorageUsage } from '@/server/queries/user.queries'
import { Header } from '@/components/layout/Header'
import { SettingsForm } from '@/components/forms/SettingsForm'
import { AccountSection } from '@/components/settings/AccountSection'
import { DangerZone } from '@/components/settings/DangerZone'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const settings = await getUserSettings(userId)
  const storageUsage = await getUserStorageUsage(userId)

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-8">Settings</h1>

        {/* Profile Section (Clerk-managed) */}
        <section className="mb-12">
          <h2 className="text-lg font-medium mb-4">Profile</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-4">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
            <a
              href="/account"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              Manage account →
            </a>
          </div>
        </section>

        {/* Account & Usage Section */}
        <AccountSection storageUsage={storageUsage} />

        {/* Gallery Defaults Section */}
        <section>
          <h2 className="text-lg font-medium mb-4">Gallery Defaults</h2>
          <SettingsForm initialSettings={settings} />
        </section>

        {/* Danger Zone */}
        <DangerZone />
      </main>
    </>
  )
}
