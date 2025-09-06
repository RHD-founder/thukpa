import { requireAuth } from '@/lib/auth-server'
import DashboardClient from './dashboard-client'

export default async function Dashboard() {
    // This will redirect to login if not authenticated
    await requireAuth()

    return <DashboardClient />
}