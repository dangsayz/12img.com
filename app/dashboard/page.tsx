import { redirect } from 'next/navigation'

// Redirect /dashboard to home page which shows dashboard for logged-in users
export default function DashboardPage() {
  redirect('/')
}
