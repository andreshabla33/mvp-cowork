
import React, { useState } from 'react';

interface Props {
  onClose: () => void;
  onCreate: (nombre: string, tipo: 'publico' | 'privado') => void;
}

export const ModalCrearGrupo: React.FC<Props> = ({ onClose, onCreate }) => {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'publico' | 'privado'>('publico');
  const [creando, setCreando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setCreando(true);
    await onCreate(nombre.trim(), tipo);
    setCreando(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[2000] p-6">
      <div className="bg-[#181825] border border-white/5 rounded-[32px] p-8 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-tight text-white uppercase">Nuevo Canal</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej: desarrollo" className="w-full bg-[#1e1e2e] border border-white/5 rounded-2xl px-5 py-4 text-white focus:ring-1 focus:ring-indigo-600 outline-none font-bold" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setTipo('publico')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 ${tipo === 'publico' ? 'border-indigo-600 bg-indigo-600/10 text-white' : 'border-white/5 text-zinc-500'}`}><span className="text-xl">#</span><span className="text-[8px] font-black uppercase tracking-widest">Público</span></button>
            <button type="button" onClick={() => setTipo('privado')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 ${tipo === 'privado' ? 'border-indigo-600 bg-indigo-600/10 text-white' : 'border-white/5 text-zinc-500'}`}><span className="text-xl">🔒</span><span className="text-[8px] font-black uppercase tracking-widest">Privado</span></button>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={!nombre.trim() || creando} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] disabled:opacity-20 transition-all">Crear</button>
          </div>
        </form>
      </div>
    </div>
  );
};
