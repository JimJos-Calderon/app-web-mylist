import React, { useState, useEffect } from 'react'
import { useAuth } from '@hooks/useAuth'
import { useUserProfile } from '@hooks/useUserProfile'
import { useNavigate } from 'react-router-dom'

const Perfil: React.FC = () => {
  const { user, signOut } = useAuth()
  const { profile, loading, error, saveProfile, updateAvatar, updateBio } = useUserProfile()
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username)
      setAvatarUrl(profile.avatar_url || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      alert('El nombre de usuario no puede estar vacío')
      return
    }

    if (username.length < 3) {
      alert('El nombre de usuario debe tener al menos 3 caracteres')
      return
    }

    if (username.length > 20) {
      alert('El nombre de usuario no puede exceder 20 caracteres')
      return
    }

    setIsSaving(true)
    try {
      await saveProfile(username)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAvatar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!avatarUrl.trim()) {
      alert('La URL no puede estar vacía')
      return
    }

    setIsSaving(true)
    try {
      await updateAvatar(avatarUrl)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving avatar:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault()

    if (bio.length > 150) {
      alert('La bio no puede exceder 150 caracteres')
      return
    }

    setIsSaving(true)
    try {
      await updateBio(bio)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving bio:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await signOut()
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex items-center justify-center">
        <div className="text-white">Cargando perfil...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Mi Perfil
          </h1>
          <p className="text-zinc-400">Personaliza tu perfil en MyList</p>
        </div>

        {/* Profile Card */}
        <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-3xl p-8 mb-6">
          {/* Avatar Preview */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-400/30 bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <div className="text-5xl">👤</div>
              )}
            </div>
          </div>

          {/* Username Form */}
          <form onSubmit={handleSaveProfile} className="mb-6 pb-6 border-b border-zinc-700">
            <label className="block text-sm font-semibold text-zinc-400 mb-3">
              Nombre de Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre de usuario"
              disabled={isSaving}
              maxLength={20}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            />
            <div className="text-xs text-zinc-500 mb-4">
              {username.length}/20 caracteres
            </div>

            <button
              type="submit"
              disabled={isSaving || !username.trim()}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar Nombre'}
            </button>
          </form>

          {/* Avatar Form */}
          <form onSubmit={handleSaveAvatar} className="mb-6 pb-6 border-b border-zinc-700">
            <label className="block text-sm font-semibold text-zinc-400 mb-3">
              Foto de Perfil (URL)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://ejemplo.com/foto.jpg"
              disabled={isSaving}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            />

            <button
              type="submit"
              disabled={isSaving || !avatarUrl.trim()}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar Foto'}
            </button>
          </form>

          {/* Bio Form */}
          <form onSubmit={handleSaveBio}>
            <label className="block text-sm font-semibold text-zinc-400 mb-3">
              Sobre mí (Bio)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntanos sobre ti..."
              disabled={isSaving}
              maxLength={150}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-2 resize-none"
            />
            <div className="text-xs text-zinc-500 mb-4">
              {bio.length}/150 caracteres
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {saveSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm mb-4">
                ✓ Perfil actualizado correctamente
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar Bio'}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-black/40 border border-zinc-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Información de la Cuenta</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-zinc-400">Email:</span>
              <p className="text-zinc-300 break-all mt-1">{user?.email}</p>
            </div>
            {bio && (
              <div className="pt-3 border-t border-zinc-700">
                <span className="text-zinc-400">Bio:</span>
                <p className="text-zinc-300 mt-1 whitespace-pre-wrap">{bio}</p>
              </div>
            )}
            <div className={bio ? 'pt-3 border-t border-zinc-700' : ''}>
              <span className="text-zinc-400">ID de Usuario:</span>
              <p className="text-zinc-300 break-all font-mono text-xs mt-1">{user?.id}</p>
            </div>
            <div className="pt-3 border-t border-zinc-700">
              <span className="text-zinc-400">Usuario Activo Desde:</span>
              <p className="text-zinc-300 mt-1">
                {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-lg hover:bg-red-500/30 transition-all"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}

export default Perfil
