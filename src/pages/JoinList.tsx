import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { LanguageSwitcher, List } from '@/features/shared'
import { supabase } from '@/supabaseClient'
import { CheckCircle, XCircle, Users, ArrowRight, Loader2 } from 'lucide-react'

type Status = 'loading' | 'found' | 'joining' | 'success' | 'already_member' | 'not_found' | 'error' | 'login_required'

type JoinListRpcResult = {
    joined: boolean
    status: string
    list_id: string | null
    membership_role: string | null
}

const JoinList: React.FC = () => {
    const { t } = useTranslation()
    const { code: routeCode } = useParams<{ code: string }>()
    const { pathname } = useLocation()
    // When rendered outside a <Route>, useParams() is empty — fall back to parsing the URL
    const code = routeCode ?? pathname.match(/\/join\/([^/]+)/)?.[1]
    const navigate = useNavigate()
    const { session, loading } = useAuth()

    const [status, setStatus] = useState<Status>('loading')
    const [list, setList] = useState<List | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        if (!code) {
            setStatus('not_found')
            return
        }

        // Wait until auth is resolved to avoid redirecting while session is briefly null
        if (loading) return

        // If not logged in: save code and show login prompt
        if (!session) {
            localStorage.setItem('pendingInviteCode', code.toUpperCase())
            setStatus('login_required')
            return
        }

        const resolveCode = async () => {
            try {
                const { data, error } = await supabase
                    .from('lists')
                    .select('*')
                    .eq('invite_code', code.toUpperCase())
                    .single()

                if (error || !data) {
                    setStatus('not_found')
                    return
                }

                setList(data as List)

                const { data: membership } = await supabase
                    .from('list_members')
                    .select('id')
                    .eq('list_id', data.id)
                    .eq('user_id', session.user.id)
                    .maybeSingle()

                setStatus(membership ? 'already_member' : 'found')
            } catch {
                setStatus('error')
                setErrorMsg('Ocurrió un error inesperado. Inténtalo de nuevo.')
            }
        }

        resolveCode()
    }, [code, session, loading, navigate])

    const handleJoin = async () => {
        if (!list || !session?.user?.id) return

        setStatus('joining')
        try {
            const { data, error } = await supabase.rpc('join_list_with_code', {
                p_user_id: session.user.id,
                p_invite_code: code?.toUpperCase() ?? list.invite_code,
            })

            if (error) throw error

            const result = Array.isArray(data)
                ? (data[0] as JoinListRpcResult | undefined)
                : (data as JoinListRpcResult | null)

            if (!result) {
                throw new Error('Respuesta vacía del servidor al unirse a la lista')
            }

            if (result.status === 'ALREADY_MEMBER') {
                setStatus('already_member')
                return
            }

            if (result.status === 'LIST_NOT_FOUND' || result.status === 'INVALID_CODE') {
                setStatus('not_found')
                return
            }

            if (result.status !== 'JOINED') {
                throw new Error('Estado inesperado al unirse a la lista')
            }

            setStatus('success')
            setTimeout(() => navigate('/peliculas'), 2500)
        } catch (err) {
            console.error(err)
            setStatus('error')
            setErrorMsg('No se pudo unir a la lista. Inténtalo de nuevo.')
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-2xl">
                <div className="relative rounded-2xl border border-cyan-500/30 bg-black/90 backdrop-blur-xl shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

                    <div className="px-12 py-14">
                        {status === 'loading' && (
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                                </div>
                                <p className="text-zinc-400 font-medium text-lg">{t('states.verifying_invitation')}</p>
                            </div>
                        )}

                        {(status === 'found' || status === 'joining') && list && (
                            <div className="flex flex-col items-center gap-8 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                                    <Users className="w-10 h-10 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-widest text-cyan-500/70 mb-3">
                                        {t('join_list.invited_intro')}
                                    </p>
                                    <h1 className="text-4xl font-black text-white mb-3">{list.name}</h1>
                                    {list.description && (
                                        <p className="text-zinc-400 text-base">{list.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={handleJoin}
                                    disabled={status === 'joining'}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl
                                       hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all
                                       disabled:opacity-60 disabled:cursor-not-allowed
                                       flex items-center justify-center gap-3 text-lg"
                                >
                                    {status === 'joining' ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> {t('list.joining')}</>
                                    ) : (
                                        <>{t('list.join_button')} <ArrowRight className="w-5 h-5" /></>
                                    )}
                                </button>
                            </div>
                        )}

                        {status === 'success' && list && (
                            <div className="flex flex-col items-center gap-7 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/40 flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-green-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white mb-2">{t('join_list.joined_title')}</h1>
                                    <p className="text-zinc-400 text-base">
                                        {t('join_list.joined_description')}{' '}
                                        <span className="text-cyan-400 font-semibold">{list.name}</span>. {t('join_list.redirecting')}
                                    </p>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full animate-[grow_2.5s_linear_forwards]" />
                                </div>
                            </div>
                        )}

                        {status === 'already_member' && list && (
                            <div className="flex flex-col items-center gap-7 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-cyan-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white mb-2">{t('states.already_member')}</h1>
                                    <p className="text-zinc-400 text-base">
                                        {t('join_list.already_member_description')}{' '}
                                        <span className="text-cyan-400 font-semibold">{list.name}</span>.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/peliculas')}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl
                                       hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all
                                       flex items-center justify-center gap-3 text-lg"
                                >
                                    {t('join_list.go_to_list')} <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {status === 'login_required' && (
                            <div className="flex flex-col items-center gap-7 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                                    <Users className="w-10 h-10 text-cyan-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white mb-2">{t('join_list.login_required_title')}</h1>
                                    <p className="text-zinc-400 text-base">
                                        {t('join_list.login_required_description')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/', { replace: true })}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl
                                       hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all
                                       flex items-center justify-center gap-3 text-lg"
                                >
                                    {t('login.button_login')} <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {status === 'not_found' && (
                            <div className="flex flex-col items-center gap-7 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center">
                                    <XCircle className="w-10 h-10 text-red-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white mb-2">{t('states.invalid_link')}</h1>
                                    <p className="text-zinc-400 text-base">{t('states.link_expired')}</p>
                                </div>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full px-8 py-4 border border-zinc-700 text-zinc-300 rounded-xl font-bold hover:bg-zinc-800 hover:text-white transition-all text-lg"
                                >
                                    {t('common.back_to_home')}
                                </button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex flex-col items-center gap-7 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center">
                                    <XCircle className="w-10 h-10 text-red-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-white mb-2">{t('states.error_occurred')}</h1>
                                    <p className="text-zinc-400 text-base">{errorMsg}</p>
                                </div>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full px-8 py-4 border border-zinc-700 text-zinc-300 rounded-xl font-bold hover:bg-zinc-800 hover:text-white transition-all text-lg"
                                >
                                    {t('common.retry')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                </div>

                {code && (
                    <p className="text-center mt-4 text-xs text-zinc-400 font-mono">
                        código: {code.toUpperCase()}
                    </p>
                )}
            </div>
            <div className="fixed bottom-6 right-6">
                <LanguageSwitcher />
            </div>
        </div>
    )
}

export default JoinList
