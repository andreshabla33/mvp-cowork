
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

interface Props {
  espacioId: string;
  espacioNombre: string;
  abierto: boolean;
  onCerrar: () => void;
  onExito?: () => void;
}

const ROLES = [
  { id: 'miembro', label: 'Miembro', desc: 'Acceso estándar al espacio' },
  { id: 'moderador', label: 'Moderador', desc: 'Puede moderar chats y usuarios' },
  { id: 'admin', label: 'Administrador', desc: 'Control total del espacio' },
];

export const ModalInvitarUsuario: React.FC<Props> = ({ 
  espacioId, 
  espacioNombre, 
  abierto, 
  onCerrar,
  onExito 
}) => {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('miembro');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const { theme } = useStore();

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExito(false);

    if (!email || !email.includes('@')) {
      setError('Ingresa un correo válido');
      return;
    }

    setEnviando(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Debes iniciar sesión');

      const response = await fetch(
        `https://lcryrsdyrzotjqdxcwtp.supabase.co/functions/v1/enviar-invitacion`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            espacio_id: espacioId,
            rol,
            nombre_invitado: nombre.trim() || undefined,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok || (result.success === false)) {
        throw new Error(result.error || 'Error al enviar la invitación');
      }

      setExito(true);
      setEmail('');
      setNombre('');
      setRol('miembro');
      
      setTimeout(() => {
        onExito?.();
        onCerrar();
        setExito(false);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Error al enviar la invitación');
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  const isArcade = theme === 'arcade';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onCerrar} />
      
      <div 
        className={`relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 border ${
          isArcade ? 'bg-black border-[#00ff41]' : 'bg-zinc-900 border-white/10'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between border-b shrink-0 ${isArcade ? 'border-[#00ff41]/30' : 'border-white/5'}`}>
          <div>
            <h2 className={`text-lg font-black uppercase tracking-tight ${isArcade ? 'text-[#00ff41]' : 'text-white'}`}>
              ✉️ Invitar Usuario
            </h2>
            <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 ${isArcade ? 'text-[#00ff41]/60' : 'text-zinc-500'}`}>
              {espacioNombre}
            </p>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-2xl opacity-50 hover:opacity-100">×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleEnviar} className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isArcade ? 'text-[#00ff41]/80' : 'text-zinc-500'}`}>
              Correo electrónico *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              required
              className={`w-full px-5 py-3.5 rounded-xl outline-none border transition-all text-sm ${
                isArcade 
                ? 'bg-black text-[#00ff41] border-[#00ff41]/30 focus:border-[#00ff41]' 
                : 'bg-black/40 text-white border-white/5 focus:border-indigo-500'
              }`}
            />
          </div>

          <div className="space-y-2">
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isArcade ? 'text-[#00ff41]/80' : 'text-zinc-500'}`}>
              Nombre <span className="opacity-40 font-normal lowercase">(opcional)</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              className={`w-full px-5 py-3.5 rounded-xl outline-none border transition-all text-sm ${
                isArcade 
                ? 'bg-black text-[#00ff41] border-[#00ff41]/30 focus:border-[#00ff41]' 
                : 'bg-black/40 text-white border-white/5 focus:border-indigo-500'
              }`}
            />
          </div>

          <div className="space-y-3">
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isArcade ? 'text-[#00ff41]/80' : 'text-zinc-500'}`}>Rol de acceso</label>
            <div className="grid grid-cols-1 gap-2">
              {ROLES.map(r => (
                <label
                  key={r.id}
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    rol === r.id 
                    ? (isArcade ? 'bg-[#00ff41]/10 border-[#00ff41]' : 'bg-indigo-600/10 border-indigo-600') 
                    : (isArcade ? 'bg-black border-white/5' : 'bg-black/20 border-white/5')
                  }`}
                >
                  <input 
                    type="radio" 
                    name="rol" 
                    value={r.id} 
                    checked={rol === r.id} 
                    onChange={(e) => setRol(e.target.value)} 
                    className={`mt-1 h-4 w-4 ${isArcade ? 'accent-[#00ff41]' : 'accent-indigo-600'}`} 
                  />
                  <div className="flex-1">
                    <div className={`font-black uppercase text-[10px] tracking-widest ${isArcade ? 'text-[#00ff41]' : 'text-white'}`}>{r.label}</div>
                    <div className={`text-[9px] font-bold leading-tight mt-0.5 ${isArcade ? 'text-[#00ff41]/60' : 'text-zinc-500'}`}>{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/30 text-red-500 animate-in fade-in slide-in-from-top-1">
              ⚠️ {error}
            </div>
          )}
          {exito && (
            <div className="p-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-500/10 border border-green-500/30 text-green-500 animate-in fade-in slide-in-from-top-1">
              ✅ Invitación enviada correctamente
            </div>
          )}
        </form>

        <div className={`p-6 border-t flex flex-col md:flex-row gap-3 shrink-0 ${isArcade ? 'border-[#00ff41]/30 bg-[#00ff41]/5' : 'border-white/5 bg-black/20'}`}>
          <button 
            type="button" 
            onClick={onCerrar} 
            className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
              isArcade ? 'text-[#00ff41]/60 hover:text-[#00ff41]' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            onClick={handleEnviar}
            disabled={enviando || !email} 
            className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-20 ${
              isArcade ? 'bg-[#00ff41] text-black shadow-[#00ff41]/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'
            }`}
          >
            {enviando ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </div>
      </div>
    </div>
  );
};
