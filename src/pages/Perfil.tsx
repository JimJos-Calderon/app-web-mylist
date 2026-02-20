import React, { useState, useEffect } from 'react'
import { useAuth } from '@hooks/useAuth'
import { useUserProfile } from '@hooks/useUserProfile'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/supabaseClient'

type Section = 'perfil' | 'seguridad'

const Perfil: React.FC = () => {
  const { user, signOut } = useAuth()
  const { profile, loading, error, saveProfile, uploadAvatar, updateBio } = useUserProfile()
  const [activeSection, setActiveSection] = useState<Section>('perfil')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Security section states
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setAvatarUrl(profile.avatar_url || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  const handleSaveChanges = async () => {
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

    if (bio.length > 150) {
      alert('La bio no puede exceder 150 caracteres')
      return
    }

    setIsSaving(true)
    try {
      await saveProfile(username)
      await updateBio(bio)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving changes:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadAvatar(file)
      setAvatarUrl(url || '')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error uploading file:', err)
      const message = err instanceof Error ? err.message : 'Error al subir imagen'
      alert(message)
    } finally {
      setIsUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await signOut()
      navigate('/')
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEmail.trim()) {
      setSecurityMessage({ type: 'error', text: 'Ingresa un correo electrónico' })
      return
    }

    if (newEmail === user?.email) {
      setSecurityMessage({ type: 'error', text: 'El correo es el mismo que el actual' })
      return
    }

    setIsSaving(true)
    setSecurityMessage(null)
    
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      
      if (error) throw error
      
      setSecurityMessage({ 
        type: 'success', 
        text: 'Se ha enviado un correo de confirmación a tu nueva dirección' 
      })
      setNewEmail('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar correo'
      setSecurityMessage({ type: 'error', text: message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setSecurityMessage({ type: 'error', text: 'Completa todos los campos' })
      return
    }

    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    setIsSaving(true)
    setSecurityMessage(null)
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) throw error
      
      setSecurityMessage({ 
        type: 'success', 
        text: '✓ Contraseña actualizada correctamente' 
      })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar contraseña'
      setSecurityMessage({ type: 'error', text: message })
    } finally {
      setIsSaving(false)
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Configuración
          </h1>
          <p className="text-zinc-400">Gestiona tu cuenta y preferencias</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64">
            <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-2xl p-4 sticky top-8">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('perfil')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${
                    activeSection === 'perfil'
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  👤 Modificar Perfil
                </button>
                <button
                  onClick={() => setActiveSection('seguridad')}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${
                    activeSection === 'seguridad'
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  🔒 Seguridad
                </button>
              </nav>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full mt-6 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-lg hover:bg-red-500/30 transition-all text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeSection === 'perfil' && (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-3xl p-8">
                  {/* Avatar Preview */}
                  <div className="flex justify-center mb-8">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-400/30 bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      {isUploading ? (
                        <div className="text-center">
                          <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-2"></div>
                          <p className="text-xs text-white">Subiendo...</p>
                        </div>
                      ) : avatarUrl ? (
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
                  <div className="mb-6 pb-6 border-b border-zinc-700">
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
                    <div className="text-xs text-zinc-500">
                      {username.length}/20 caracteres
                    </div>
                  </div>

                  {/* Avatar Form */}
                  <div className="mb-6 pb-6 border-b border-zinc-700">
                    <label className="block text-sm font-semibold text-zinc-400 mb-3">
                      Foto de Perfil
                    </label>
                    
                    {/* File Upload */}
                    <div className="mb-2">
                      <label className="block w-full">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploading || isSaving}
                          className="hidden"
                        />
                        <div className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed">
                          {isUploading ? '⏳ Subiendo...' : 'Cambiar foto de perfil'}
                        </div>
                      </label>
                      <p className="text-xs text-zinc-500 mt-2">
                        Formatos: JPG, PNG, GIF (máx. 2MB)
                      </p>
                    </div>
                  </div>

                  {/* Bio Form */}
                  <div className="mb-6">
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
                    <div className="text-xs text-zinc-500">
                      {bio.length}/150 caracteres
                    </div>
                  </div>

                  {/* Error and Success Messages */}
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

                  {/* Save Button */}
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving || !username.trim()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>

                {/* Account Info */}
                <div className="bg-black/40 border border-zinc-700/50 rounded-2xl p-6">
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
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'seguridad' && (
              <div className="space-y-6">
                {/* Change Email */}
                <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-3xl p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span>📧</span>
                    Cambiar Correo Electrónico
                  </h2>
                  
                  <form onSubmit={handleChangeEmail} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-400 mb-3">
                        Correo Actual
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-zinc-400 mb-3">
                        Nuevo Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="nuevo@ejemplo.com"
                        disabled={isSaving}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving || !newEmail.trim()}
                      className="w-full px-4 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Actualizando...' : 'Cambiar Correo'}
                    </button>
                  </form>
                </div>

                {/* Change Password */}
                <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-3xl p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span>🔑</span>
                    Cambiar Contraseña
                  </h2>
                  
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-400 mb-3">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        disabled={isSaving}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-zinc-400 mb-3">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        disabled={isSaving}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving || !newPassword.trim() || !confirmPassword.trim()}
                      className="w-full px-4 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Actualizando...' : 'Cambiar Contraseña'}
                    </button>
                  </form>
                </div>

                {/* Security Messages */}
                {securityMessage && (
                  <div className={`px-4 py-3 rounded-lg text-sm ${
                    securityMessage.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    {securityMessage.text}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Perfil
