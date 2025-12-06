import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Calendar, HardDrive, Image, Folder, Ban, CheckCircle, Shield, CreditCard } from 'lucide-react'
import { getUser, getUserGalleries } from '@/server/admin/users'
import { UserActions } from './UserActions'

interface Props {
  params: Promise<{ userId: string }>
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-gray-100 text-gray-600',
  support: 'bg-blue-100 text-blue-700',
  admin: 'bg-amber-100 text-amber-700',
  super_admin: 'bg-red-100 text-red-700',
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  essential: 'bg-amber-100 text-amber-700',
  pro: 'bg-emerald-100 text-emerald-700',
  studio: 'bg-violet-100 text-violet-700',
  elite: 'bg-purple-100 text-purple-700',
}

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params
  
  let user
  let galleries
  
  try {
    [user, galleries] = await Promise.all([
      getUser(userId),
      getUserGalleries(userId),
    ])
  } catch (error) {
    notFound()
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">{user.email}</h1>
          <p className="text-sm text-gray-500 font-mono">{user.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${PLAN_COLORS[user.plan] || PLAN_COLORS.free}`}>
            {user.plan || 'free'}
          </span>
          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
            {user.role?.replace('_', ' ') || 'user'}
          </span>
          {user.is_suspended ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
              <Ban className="w-3 h-3" />
              Suspended
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <HardDrive className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{formatBytes(user.usage.totalBytes)}</p>
                  <p className="text-xs text-gray-500">Storage Used</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Image className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{user.usage.imageCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Images</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Folder className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{user.usage.galleryCount}</p>
                  <p className="text-xs text-gray-500">Galleries</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Account Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Clerk ID</p>
                <p className="font-mono text-xs">{user.clerk_id}</p>
              </div>
              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Plan</p>
                <p className="font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  {user.plan || 'free'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Role</p>
                <p className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  {user.role?.replace('_', ' ') || 'user'}
                </p>
              </div>
              {user.stripe_customer_id && (
                <div>
                  <p className="text-gray-500">Stripe Customer</p>
                  <p className="font-mono text-xs">{user.stripe_customer_id}</p>
                </div>
              )}
            </div>
            
            {user.is_suspended && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">Suspended</p>
                <p className="text-sm text-red-600 mt-1">
                  Reason: {user.suspension_reason || 'No reason provided'}
                </p>
                {user.suspended_at && (
                  <p className="text-xs text-red-500 mt-1">
                    Suspended on {formatDate(user.suspended_at)}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Galleries */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Galleries ({galleries?.length || 0})
            </h2>
            {galleries && galleries.length > 0 ? (
              <div className="space-y-2">
                {galleries.map((gallery: any) => (
                  <div
                    key={gallery.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{gallery.title}</p>
                      <p className="text-xs text-gray-500">/{gallery.slug}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {gallery.images?.[0]?.count || 0} images
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No galleries yet</p>
            )}
          </div>
        </div>
        
        {/* Actions Sidebar */}
        <div className="lg:col-span-1">
          <UserActions user={user} />
        </div>
      </div>
    </div>
  )
}
