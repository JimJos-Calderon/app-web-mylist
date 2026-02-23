import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@hooks/useAuth'
import { List } from '@typings/index'
import { CheckCircle, XCircle, Users, ArrowRight, Loader2 } from 'lucide-react'

type Status = 'loading' | 'found' | 'joining' | 'success' | 'already_member' | 'not_found' | 'error'

const JoinList: React.FC = () => {
    const { code } = useParams<{ code: string }>()
    const navigate = useNavigate()
    const { session } = useAuth()

    const [status, setStatus] = useState<Status>('loading')
    const [list, setList] = useState<List | null>(null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        if (!code) {
            setStatus('not_found')
            return
        }

        // If not logged in: save code and redirect to login
        if (!session) {
            localStorage.setItem('pendingInviteCode', code.toUpperCase())
            navigate('/', { replace: true })
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
    }, [code, session, navigate])

    const handleJoin = async () => {
        if (!list || !session?.user?.id) return

        setStatus('joining')
        try {
            const { error } = await supabase.from('list_members').insert({
                list_id: list.id,
                user_id: session.user.id,
                role: 'member',
            })

            if (error) {
                if (error.code === '23505') {
                    setStatus('already_member')
                } else {
                    throw error
                }
                return
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

            <div className="relative w-full max-w-md">
                <div className="relative rounded-2xl border border-cyan-500/30 bg-black/90 backdrop-blur-xl shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

                    <div className="px-8 py-10">
                        {status === 'loading' && (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                                </div>
                                <p className="text-zinc-400 font-medium">Verificando invitación…</p>
                            </div>
                        )}

                        {(status === 'found' || status === 'joining') && list && (
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                                    <Users className="w-8 h-8 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-500/70 mb-2">
                                        Has sido invitado/a a
                                    </p>
                                    <h1 className="text-3xl font-black text-white mb-2">{list.name}</h1>
                                    {list.description && (
                                        <p className="text-zinc-400 text-sm">{list.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={handleJoin}
                                    disabled={status === 'joining'}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl
                                       hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all
                                       disabled:opacity-60 disabled:cursor-not-allowed
                                       flex items-center justify-center gap-2 text-lg"
                                >
                                    {status === 'joining' ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Uniéndote…</>
                                    ) : (
                                        <>Unirme a la lista <ArrowRight className="w-5 h-5" /></>
                                    )}
                                </button>
                            </div>
                        )}

                        {status === 'success' && list && (
                            <div className="flex flex-col items-center gap-5 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/40 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white mb-1">¡Te has unido!</h1>
                                    <p className="text-zinc-400 text-sm">
                                        Ahora formas parte de{' '}
                                        <span className="text-cyan-400 font-semibold">{list.name}</span>. Redirigiendo…
                                    </p>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full animate-[grow_2.5s_linear_forwards]" />
                                </div>
                            </div>
                        )}

                        {status === 'already_member' && list && (
                            <div className="flex flex-col items-center gap-5 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-cyan-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white mb-1">Ya eres miembro</h1>
                                    <p className="text-zinc-400 text-sm">
                                        Ya perteneces a{' '}
                                        <span className="text-cyan-400 font-semibold">{list.name}</span>.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/peliculas')}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black rounded-xl
                                       hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all
                                       flex items-center justify-center gap-2"
                                >
                                    Ir a la lista <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {status === 'not_found' && (
                            <div className="flex flex-col items-center gap-5 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center">
                                    <XCircle className="w-8 h-8 text-red-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white mb-1">Link inválido</h1>
                                    <p className="text-zinc-400 text-sm">Este link de invitación no existe o ha expirado.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full px-6 py-3 border border-zinc-700 text-zinc-300 rounded-xl font-bold hover:bg-zinc-800 hover:text-white transition-all"
                                >
                                    Volver al inicio
                                </button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex flex-col items-center gap-5 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center">
                                    <XCircle className="w-8 h-8 text-red-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-white mb-1">Algo salió mal</h1>
                                    <p className="text-zinc-400 text-sm">{errorMsg}</p>
                                </div>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full px-6 py-3 border border-zinc-700 text-zinc-300 rounded-xl font-bold hover:bg-zinc-800 hover:text-white transition-all"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                </div>

                {code && (
                    <p className="text-center mt-4 text-xs text-zinc-600 font-mono">
                        código: {code.toUpperCase()}
                    </p>
                )}
            </div>
        </div>
    )
}

export default JoinList
