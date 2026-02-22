import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';


interface CreateListDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (list: any) => void;
}

export const CreateListDialog: React.FC<CreateListDialogProps> = ({ open, onClose, onCreated }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data, error: insertError } = await supabase
        .from('lists')
        .insert([{ nombre, descripcion }])
        .select()
        .single();
      if (insertError) throw insertError;
      setError(null);
      onCreated(data);
      onClose();
    } catch (err) {
      setError('Error al crear la lista');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Cerrar al hacer click en el overlay
  const handleOverlayClick = () => {
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[100]" onClick={handleOverlayClick} />
      <div className="fixed inset-0 flex items-center justify-center z-[110]">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg pointer-events-auto" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-4">Crear nueva lista</h2>
          <input
            type="text"
            placeholder="Nombre de la lista"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
          />
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
            <button
              onClick={handleCreate}
              disabled={loading || !nombre}
              className="px-4 py-2 bg-pink-500 text-white rounded font-bold"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  listId: string;
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ open, onClose, listId }) => {
  const inviteUrl = `${window.location.origin}/invitar/${listId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!open) return null;

  const handleOverlayClick = () => {
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[100]" onClick={handleOverlayClick} />
      <div className="fixed inset-0 flex items-center justify-center z-[110]">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg pointer-events-auto" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-4">Invitar a la lista</h2>
          <input
            type="text"
            value={inviteUrl}
            readOnly
            className="w-full mb-3 p-2 border rounded"
            onClick={e => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-cyan-500 text-white rounded font-bold w-full mb-2"
          >
            {copied ? '¡Copiado!' : 'Copiar link'}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded w-full">Cerrar</button>
        </div>
      </div>
    </>
  );
};
