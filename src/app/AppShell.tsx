import React, { useEffect, useState, Suspense, lazy } from 'react'
import { useLocation } from 'react-router-dom'
import { XCircle } from 'lucide-react'
import { useAuth } from '@/features/auth'
import UsernameSetupModal from '@/features/onboarding/components/UsernameSetupModal'
import PendingInviteModal from '@/features/invites/components/PendingInviteModal'
import { usePendingInvite } from '@/features/invites/hooks/usePendingInvite'
import AppRoutes from '@/app/AppRoutes'
import AppNavbar from '@/features/navigation/components/AppNavbar'
import AppBootScreen from '@/features/app/components/AppBootScreen'
import { useTheme } from '@/features/shared/hooks/useTheme'

const Login = lazy(() => import('@pages/Login'))
const JoinList = lazy(() => import('@pages/JoinList'))

const AppShell: React.FC = () => {
    const { session, loading, error: authError, needsUsername } = useAuth()
    const { theme } = useTheme()
    const location = useLocation()

    const [showError, setShowError] = useState(authError)
    const [prevAuthError, setPrevAuthError] = useState(authError)

    const {
        pendingInvite,
        inviteJoining,
        inviteError,
        clearPendingInvite,
        joinPendingInvite,
    } = usePendingInvite({
        userId: session?.user?.id,
    })

    // Derived state during render, avoids cascading renders
    if (authError !== prevAuthError) {
        setPrevAuthError(authError)
        setShowError(authError)
    }

    useEffect(() => {
        if (showError) {
            const timer = setTimeout(() => setShowError(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [showError])

    if (loading) {
        return <AppBootScreen />
    }

    if (location.pathname.match(/^\/join\/[^/]+$/)) {
        return (
            <Suspense fallback={<AppBootScreen />}>
                <JoinList />
            </Suspense>
        )
    }

    if (!session) {
        return (
            <Suspense fallback={<AppBootScreen />}>
                <Login />
            </Suspense>
        )
    }

    return (
        <div className={`min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans selection:bg-orange-500/30 ${theme === 'retro-cartoon' ? 'retro-fx' : ''}`}>
            {needsUsername && <UsernameSetupModal />}

            <PendingInviteModal
                pendingInvite={pendingInvite}
                inviteJoining={inviteJoining}
                inviteError={inviteError}
                onClose={clearPendingInvite}
                onJoin={joinPendingInvite}
            />

            {showError && (
                <div className="fixed top-4 right-4 z-50 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 max-w-md animate-in slide-in-from-top duration-300">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-red-200 text-sm">{showError}</span>
                </div>
            )}

            <AppNavbar />

            <main className="max-w-7xl mx-auto p-4">
                <AppRoutes />

            </main>
        </div>
    )
}

export default AppShell
