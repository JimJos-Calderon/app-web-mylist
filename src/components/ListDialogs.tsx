import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '@/supabaseClient';
import { List } from '@typings/index';
import { X, Plus, Copy, Check, Users } from 'lucide-react';

// ─── Hook para cerrar con Escape ─────────────────────────────────────────────
function useEscapeKey(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
}

// ─── CreateListDialog ────────────────────────────────────────────────────────

interface CreateListDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (list: List) => void;
}

export const CreateListDialog: React.FC<CreateListDialogProps> = ({ open, onClose, onCreated }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEscapeKey(open, onClose);

  const handleCreate = async () => {
    if (!nombre.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      const { data, error: insertError } = await supabase
        .from('lists')
        .insert([{
          name: nombre.trim(),
          description: descripcion.trim() || null,
          owner_id: userId,
          invite_code: inviteCode,
          is_private: false,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      if (data && userId) {
        await supabase.from('list_members').insert({
          list_id: data.id,
          user_id: userId,
          role: 'owner',
        });
      }

      setNombre('');
      setDescripcion('');
      onCreated(data as List);
      onClose();
    } catch (err) {
      setError('Error al crear la lista. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      {/* Overlay — clic directo aquí cierra */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — stopPropagation para no cerrar al clicar dentro */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-pink-500/30 bg-black/90 backdrop-blur-xl shadow-[0_0_60px_rgba(219,39,119,0.2)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Línea de brillo */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-pink-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
              <Plus className="w-4 h-4 text-pink-400" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              Nueva Lista
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-pink-400 mb-2">
              Nombre de la lista
            </label>
            <input
              type="text"
              placeholder="Mi lista favorita..."
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && nombre.trim() && handleCreate()}
              autoFocus
              maxLength={60}
              className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700 rounded-xl text-white placeholder-zinc-500
                         focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20
                         transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
              Descripción{' '}
              <span className="text-zinc-600 normal-case tracking-normal font-normal">(opcional)</span>
            </label>
            <textarea
              placeholder="Una lista de películas y series para ver juntos..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700 rounded-xl text-white placeholder-zinc-500
                         focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20
                         transition-all font-medium resize-none"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 rounded-xl font-bold
                       hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !nombre.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-black
                       hover:shadow-[0_0_25px_rgba(219,39,119,0.5)] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Crear lista
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── InviteDialog ─────────────────────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  list: List;
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ open, onClose, list }) => {
  const [copiedCode, setCopiedCode] = useState(false);

  useEscapeKey(open, onClose);

  const inviteUrl = `${window.location.origin}/join/${list.invite_code}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      {/* Overlay — clic directo aquí cierra */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — stopPropagation para no cerrar al clicar dentro */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-black/90 backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.2)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Línea de brillo */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              Invitar a la lista
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          <div className="px-4 py-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400/70 mb-1">Lista</p>
            <p className="text-white font-bold">{list.name}</p>
            {list.description && (
              <p className="text-zinc-400 text-sm mt-1">{list.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
              Link de invitación
            </label>
            <p className="text-zinc-400 text-sm mb-3">
              Comparte este enlace. Cualquier persona con el link puede unirse a la lista.
            </p>
            <div className="flex gap-2">
              <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-3 bg-zinc-900/80 border border-zinc-700 rounded-xl flex items-center min-w-0
                           hover:border-cyan-500/50 transition-all group"
              >
                <span className="text-sm font-mono text-cyan-400 group-hover:text-cyan-300 truncate transition-colors">
                  {inviteUrl}
                </span>
              </a>
              <button
                onClick={handleCopyCode}
                className={`px-4 py-3 rounded-xl font-bold border transition-all flex items-center gap-2 whitespace-nowrap ${copiedCode
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  }`}
              >
                {copiedCode ? (
                  <><Check className="w-4 h-4" /> Copiado</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-zinc-700 text-zinc-300 rounded-xl font-bold
                       hover:bg-zinc-800 hover:text-white transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
