import React, { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useUserProfile } from '@/features/profile'
import { LanguageSwitcher, ThemeSwitcher, usePushNotifications } from '@/features/shared'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/supabaseClient'
import { Eye, EyeOff, User, LockKeyhole, UserCircle, Mail, Key, Bell } from 'lucide-react'
import HudContainer from '@/features/shared/components/HudContainer'
import TechLabel from '@/features/shared/components/TechLabel'

type Section = 'perfil' | 'seguridad' | 'notificaciones'

const Ajustes: React.FC = () => {
  const { t } = useTranslation()
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
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false)
  const [verifyEmailPassword, setVerifyEmailPassword] = useState('')
  const [showVerifyEmailPassword, setShowVerifyEmailPassword] = useState(false)
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [pushMessage, setPushMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribing: isSubscribingPush,
    error: pushError,
    subscribeCurrentUser,
  } = usePushNotifications()
  
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
      alert(t('settings.username_error_empty'))
      return
    }

    if (username.length < 3) {
      alert(t('settings.username_error_short'))
      return
    }

    if (username.length > 20) {
      alert(t('settings.username_error_long'))
      return
    }

    if (bio.length > 150) {
      alert(t('settings.bio_error_long'))
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
      e.target.value = ''
    }
  }

  const handleLogout = async () => {
    if (confirm(t('settings.logout_confirm'))) {
      await signOut()
      navigate('/')
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEmail.trim()) {
      setSecurityMessage({ type: 'error', text: t('settings.email_error_empty') })
      return
    }

    if (newEmail === user?.email) {
      setSecurityMessage({ type: 'error', text: t('settings.email_error_same') })
      return
    }

    setShowVerifyEmailModal(true)
    setSecurityMessage(null)
  }

  const handleVerifyAndChangeEmail = async () => {
    if (!verifyEmailPassword.trim()) {
      setSecurityMessage({ type: 'error', text: t('settings.verify_email_placeholder') })
      return
    }

    setIsSaving(true)
    setSecurityMessage(null)
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: verifyEmailPassword
      })
      
      if (signInError) throw new Error(t('settings.password_error_wrong'))
      
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      
      if (error) throw error
      
      setSecurityMessage({ 
        type: 'success', 
        text: t('settings.email_success') 
      })
      setNewEmail('')
      setVerifyEmailPassword('')
      setShowVerifyEmailModal(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('settings.email_error')
      setSecurityMessage({ type: 'error', text: message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setSecurityMessage({ type: 'error', text: t('settings.password_error_empty') })
      return
    }

    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: t('settings.password_error_short') })
      return
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: t('settings.password_error_mismatch') })
      return
    }

    if (currentPassword === newPassword) {
      setSecurityMessage({ type: 'error', text: t('settings.password_error_same') })
      return
    }

    setIsSaving(true)
    setSecurityMessage(null)
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: currentPassword
      })
      
      if (signInError) throw new Error(t('settings.password_error_wrong'))
      
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) throw error
      
      setSecurityMessage({ 
        type: 'success', 
        text: t('settings.password_success') 
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const message = err instanceof Error ? err.message : t('settings.password_error')
      setSecurityMessage({ type: 'error', text: message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEnablePush = async () => {
    if (!user?.id) {
      setPushMessage({ type: 'error', text: t('settings.push_not_authenticated') })
      return
    }

    setPushMessage(null)
    const subscription = await subscribeCurrentUser(user.id)

    if (subscription) {
      setPushMessage({ type: 'success', text: t('settings.push_success') })
      return
    }

    if (pushPermission === 'denied') {
      setPushMessage({ type: 'error', text: t('settings.push_permission_denied') })
      return
    }

    if (pushError) {
      setPushMessage({ type: 'error', text: pushError })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="text-[var(--color-text-primary)] font-mono tracking-widest">{t('settings.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
          <TechLabel text="SYS.CONFIG" blink={false} />
          <div>
            <h1 
              className="text-3xl sm:text-4xl font-black font-mono tracking-tighter"
              style={{
                background: 'linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 10px rgba(var(--color-accent-primary-rgb), 0.3))'
              }}
            >
              {t('settings.title')}
            </h1>
            <p className="text-[var(--color-text-muted)] mt-1">{t('settings.description')}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64">
            <HudContainer className="p-4 sticky top-8">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection('perfil')}
                  className={`w-full text-left px-4 py-3 rounded font-mono uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${
                    activeSection === 'perfil'
                      ? 'bg-[var(--color-accent-primary)] text-black shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.5)]'
                      : 'text-[var(--color-text-muted)] hover:text-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)]'
                  }`}
                >
                  <User className="w-4 h-4" /> {t('settings.profile_section')}
                </button>
                <button
                  onClick={() => setActiveSection('seguridad')}
                  className={`w-full text-left px-4 py-3 rounded font-mono uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${
                    activeSection === 'seguridad'
                      ? 'bg-[var(--color-accent-primary)] text-black shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.5)]'
                      : 'text-[var(--color-text-muted)] hover:text-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)]'
                  }`}
                >
                  <LockKeyhole className="w-4 h-4" /> {t('settings.security_section')}
                </button>
                <button
                  onClick={() => setActiveSection('notificaciones')}
                  className={`w-full text-left px-4 py-3 rounded font-mono uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${
                    activeSection === 'notificaciones'
                      ? 'bg-[var(--color-accent-primary)] text-black shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.5)]'
                      : 'text-[var(--color-text-muted)] hover:text-accent-primary hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)]'
                  }`}
                >
                  <Bell className="w-4 h-4" /> {t('settings.notifications_section')}
                </button>
              </nav>
              
              {/* Language Switcher */}
              <div className="flex justify-center mt-6 mb-6 p-3 bg-black/40 rounded border border-[rgba(var(--color-accent-primary-rgb),0.2)]">
                <LanguageSwitcher />
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full mt-6 px-4 py-3 bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-accent-secondary text-accent-secondary font-mono tracking-widest text-xs uppercase rounded hover:bg-[rgba(var(--color-accent-secondary-rgb),0.2)] hover:shadow-[0_0_15px_rgba(var(--color-accent-secondary-rgb),0.4)] transition-all"
              >
                {t('settings.logout_button')}
              </button>
            </HudContainer>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeSection === 'perfil' && (
              <div className="space-y-6">
                <ThemeSwitcher />

                {/* Profile Card */}
                <HudContainer className="p-4 sm:p-8">
                  {/* Avatar Preview */}
                  <div className="flex justify-center mb-8">
                    <div 
                      className="relative w-32 h-32 rounded-full overflow-hidden border-4 flex items-center justify-center"
                      style={{ 
                        borderColor: 'rgba(var(--color-accent-primary-rgb), 0.5)',
                        background: 'radial-gradient(circle, rgba(var(--color-accent-primary-rgb), 0.2) 0%, transparent 70%)'
                      }}
                    >
                      {isUploading ? (
                        <div className="text-center">
                          <div 
                            className="animate-spin w-12 h-12 border-4 rounded-full mx-auto mb-2"
                            style={{ 
                              borderColor: 'rgba(var(--color-accent-primary-rgb), 0.3)', 
                              borderTopColor: 'var(--color-accent-primary)' 
                            }}
                          ></div>
                          <p className="text-xs text-[var(--color-text-primary)] font-mono">{t('settings.avatar_uploading')}</p>
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
                        <UserCircle className="w-16 h-16 text-accent-primary opacity-60" />
                      )}
                    </div>
                  </div>

                  {/* Username Form */}
                  <div className="mb-6 pb-6 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)]">
                    <label className="block text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                      {t('settings.username_label')}
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('settings.username_placeholder')}
                      disabled={isSaving}
                      maxLength={20}
                      className="w-full px-4 py-3 bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-2 font-mono"
                    />
                    <div className="text-xs text-[var(--color-text-muted)] font-mono">
                      {username.length}/20 {t('placeholders.character_count')}
                    </div>
                  </div>

                  {/* Avatar Form */}
                  <div className="mb-6 pb-6 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)]">
                    <label className="block text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                      {t('settings.avatar_label')}
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
                        <div className="w-full px-4 py-3 bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-accent-secondary text-accent-secondary font-mono tracking-widest text-xs uppercase rounded hover:bg-[rgba(var(--color-accent-secondary-rgb),0.2)] hover:shadow-[0_0_15px_rgba(var(--color-accent-secondary-rgb),0.4)] transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed">
                          {isUploading ? t('settings.avatar_uploading') : t('settings.avatar_button')}
                        </div>
                      </label>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono mt-2">
                        {t('settings.avatar_upload_hint')}
                      </p>
                    </div>
                  </div>

                  {/* Bio Form */}
                  <div className="mb-6">
                    <label className="block text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                      {t('settings.bio_label')}
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={t('settings.bio_placeholder')}
                      disabled={isSaving}
                      maxLength={150}
                      rows={3}
                      className="w-full px-4 py-3 bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-2 resize-none font-mono"
                    />
                    <div className="text-xs text-[var(--color-text-muted)] font-mono">
                      {bio.length}/150 {t('placeholders.character_count')}
                    </div>
                  </div>

                  {/* Error and Success Messages */}
                  {error && (
                    <div className="bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)] text-accent-secondary px-4 py-2 rounded text-sm mb-4 font-mono">
                      {error}
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] text-accent-primary px-4 py-2 rounded text-sm mb-4 font-mono">
                      {t('settings.save_success')}
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving || !username.trim()}
                    className="w-full px-4 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-accent-primary text-accent-primary font-mono tracking-widest text-xs uppercase hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                  >
                    {isSaving ? t('settings.saving_button') : t('settings.save_button')}
                  </button>
                </HudContainer>

                {/* Account Info */}
                <HudContainer className="p-6">
                  <h2 className="text-lg font-black font-mono tracking-widest uppercase mb-4 text-accent-primary">{t('account.info_title')}</h2>
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-[var(--color-text-muted)]">{t('account.email')}:</span>
                      <p className="text-[var(--color-text-primary)] break-all mt-1">{user?.email}</p>
                    </div>
                    {bio && (
                      <div className="pt-3 border-t border-[rgba(var(--color-accent-primary-rgb),0.2)]">
                        <span className="text-[var(--color-text-muted)]">{t('account.bio')}:</span>
                        <p className="text-[var(--color-text-primary)] mt-1 whitespace-pre-wrap">{bio}</p>
                      </div>
                    )}
                    <div className={bio ? 'pt-3 border-t border-[rgba(var(--color-accent-primary-rgb),0.2)]' : ''}>
                      <span className="text-[var(--color-text-muted)]">{t('account.user_id')}:</span>
                      <p className="text-[var(--color-text-primary)] break-all mt-1 opacity-60">{user?.id}</p>
                    </div>
                  </div>
                </HudContainer>
              </div>
            )}

            {activeSection === 'seguridad' && (
              <div className="space-y-6">
                {/* Change Email */}
                <HudContainer className="p-4 sm:p-8">
                  <h2 className="text-xl font-black font-mono tracking-widest uppercase mb-6 flex items-center gap-3 text-[var(--color-text-primary)]">
                    <Mail className="w-5 h-5 text-accent-primary" />
                    {t('settings.email_change_title')}
                  </h2>
                  
                  <form onSubmit={handleChangeEmail} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                        {t('settings.email_current_label')}
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded text-[var(--color-text-muted)] cursor-not-allowed font-mono"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                        {t('settings.email_new_label')}
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder={t('placeholders.email_new')}
                        disabled={isSaving}
                        className="w-full px-4 py-3 bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary transition-all disabled:opacity-50 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving || !newEmail.trim()}
                      className="w-full px-4 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-accent-primary text-accent-primary font-mono tracking-widest text-xs uppercase hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded mt-2"
                      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                    >
                      {isSaving ? t('settings.email_updating') : t('settings.email_button')}
                    </button>
                  </form>
                </HudContainer>

                {/* Change Password */}
                <HudContainer className="p-4 sm:p-8">
                  <h2 className="text-xl font-black font-mono tracking-widest uppercase mb-6 flex items-center gap-3 text-[var(--color-text-primary)]">
                    <Key className="w-5 h-5 text-accent-primary" />
                    {t('settings.password_change_title')}
                  </h2>
                  
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                        {t('settings.password_current_label')}
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder={t('settings.password_current_placeholder')}
                          disabled={isSaving}
                          className="w-full px-4 py-3 pr-12 bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary transition-all disabled:opacity-50 font-mono tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-accent-primary transition-colors"
                          disabled={isSaving}
                          aria-label={showCurrentPassword ? t('settings.password_hide_label') : t('settings.password_show_label')}
                        >
                          {showCurrentPassword ? <Eye className="w-5 h-5" aria-hidden="true" /> : <EyeOff className="w-5 h-5" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                        {t('settings.password_new_label')}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t('placeholders.password_hint')}
                          disabled={isSaving}
                          className="w-full px-4 py-3 pr-12 bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary transition-all disabled:opacity-50 font-mono tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-accent-primary transition-colors"
                          disabled={isSaving}
                          aria-label={showNewPassword ? t('settings.password_hide_label') : t('settings.password_show_label')}
                        >
                          {showNewPassword ? <Eye className="w-5 h-5" aria-hidden="true" /> : <EyeOff className="w-5 h-5" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                        {t('settings.password_confirm_label')}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('settings.password_confirm_placeholder')}
                          disabled={isSaving}
                          className="w-full px-4 py-3 pr-12 bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary transition-all disabled:opacity-50 font-mono tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-accent-primary transition-colors"
                          disabled={isSaving}
                          aria-label={showConfirmPassword ? t('settings.password_hide_label') : t('settings.password_show_label')}
                        >
                          {showConfirmPassword ? <Eye className="w-5 h-5" aria-hidden="true" /> : <EyeOff className="w-5 h-5" aria-hidden="true" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
                      className="w-full px-4 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-accent-primary text-accent-primary font-mono tracking-widest text-xs uppercase hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded mt-2"
                      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                    >
                      {isSaving ? t('settings.email_updating') : t('settings.password_button')}
                    </button>
                  </form>
                </HudContainer>

                {/* Security Messages */}
                {securityMessage && (
                  <div className={`px-4 py-3 rounded text-sm font-mono tracking-wide ${
                    securityMessage.type === 'success'
                      ? 'bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] text-accent-primary'
                      : 'bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)] text-accent-secondary'
                  }`}>
                    {securityMessage.text}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'notificaciones' && (
              <div className="space-y-6">
                <HudContainer className="p-4 sm:p-8">
                  <h2 className="text-xl font-black font-mono tracking-widest uppercase mb-3 flex items-center gap-3 text-[var(--color-text-primary)]">
                    <Bell className="w-5 h-5 text-accent-primary" />
                    {t('settings.push_title')}
                  </h2>
                  <p className="text-[var(--color-text-muted)] mb-6 font-mono text-sm">{t('settings.push_description')}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm font-mono">
                    <div className="bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded p-4">
                      <span className="text-[var(--color-text-muted)] text-xs uppercase tracking-widest">{t('settings.push_support_label')}:</span>
                      <p className="mt-1 font-semibold text-[var(--color-text-primary)]">
                        {isPushSupported ? t('settings.push_support_yes') : t('settings.push_support_no')}
                      </p>
                    </div>
                    <div className="bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded p-4">
                      <span className="text-[var(--color-text-muted)] text-xs uppercase tracking-widest">{t('settings.push_permission_label')}:</span>
                      <p className="mt-1 font-semibold text-[var(--color-text-primary)] opacity-80">{pushPermission}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={!isPushSupported || isSubscribingPush}
                    className="w-full px-4 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-accent-primary text-accent-primary font-mono tracking-widest text-xs uppercase hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                  >
                    {isSubscribingPush ? t('settings.push_button_loading') : t('settings.push_button')}
                  </button>

                  {pushMessage && (
                    <div className={`mt-4 px-4 py-3 rounded text-sm font-mono tracking-wide ${
                      pushMessage.type === 'success'
                        ? 'bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] text-accent-primary'
                        : 'bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)] text-accent-secondary'
                    }`}>
                      {pushMessage.text}
                    </div>
                  )}

                  {!pushMessage && pushError && (
                    <div className="mt-4 bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)] text-accent-secondary px-4 py-3 rounded text-sm font-mono tracking-wide">
                      {pushError}
                    </div>
                  )}
                </HudContainer>
              </div>
            )}
          </div>
        </div>

        {/* Verify Email Modal */}
        {showVerifyEmailModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <HudContainer className="p-8 max-w-md w-full bg-[var(--color-bg-elevated)] border-accent-primary shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.2)]">
              <h3 className="text-xl font-black font-mono tracking-widest uppercase mb-2 text-[var(--color-text-primary)]">{t('settings.verify_email_title')}</h3>
              <p className="text-[var(--color-text-muted)] text-sm mb-6 font-mono">
                {t('settings.verify_email_description')}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-3">
                    {t('settings.verify_email_label')}
                  </label>
                  <div className="relative">
                    <input
                      type={showVerifyEmailPassword ? 'text' : 'password'}
                      value={verifyEmailPassword}
                      onChange={(e) => setVerifyEmailPassword(e.target.value)}
                      placeholder={t('settings.verify_email_placeholder')}
                      disabled={isSaving}
                      className="w-full px-4 py-3 pr-12 bg-black/40 border border-[rgba(var(--color-accent-primary-rgb),0.2)] rounded text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary transition-all disabled:opacity-50 font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerifyEmailPassword(!showVerifyEmailPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-accent-primary transition-colors"
                      disabled={isSaving}
                      aria-label={showVerifyEmailPassword ? t('settings.password_hide_label') : t('settings.password_show_label')}
                    >
                      {showVerifyEmailPassword ? <Eye className="w-5 h-5" aria-hidden="true" /> : <EyeOff className="w-5 h-5" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {securityMessage && securityMessage.type === 'error' && (
                  <div className="bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)] text-accent-secondary px-4 py-2 rounded text-sm font-mono tracking-wide">
                    {securityMessage.text}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowVerifyEmailModal(false)
                      setVerifyEmailPassword('')
                      setSecurityMessage(null)
                    }}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 text-[var(--color-text-muted)] border border-[rgba(var(--color-text-muted-rgb,161,161,170),0.3)] rounded hover:bg-white/5 hover:text-[var(--color-text-primary)] transition-all disabled:opacity-50 font-mono text-xs uppercase tracking-widest"
                  >
                    {t('account.cancel')}
                  </button>
                  <button
                    onClick={handleVerifyAndChangeEmail}
                    disabled={isSaving || !verifyEmailPassword.trim()}
                    className="flex-1 px-4 py-3 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-accent-primary text-accent-primary font-mono tracking-widest text-xs uppercase hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    {isSaving ? t('account.verifying') : t('account.confirm')}
                  </button>
                </div>
              </div>
            </HudContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default Ajustes
