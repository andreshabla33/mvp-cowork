
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export const WorkspaceCreator: React.FC = () => {
  const [name, setName] = useState('');
  const [dim, setDim] = useState({ w: 2000, h: 2000 });
  const [loading, setLoading] = useState(false);
  const { fetchWorkspaces, setAuthFeedback } = useStore();

  const handleLaunch = async () => {
    if (!name.trim()) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('crear_espacio_trabajo', {
        p_nombre: name,
        p_descripcion: `Mapa de ${dim.w}x${dim.h}`
      });
      
      if (error) throw error;
      
      setAuthFeedback({ type: 'success', message: `Espacio "${name}" lanzado con éxito!` });
      await fetchWorkspaces();
      setName('');
    } catch (e: any) {
      setAuthFeedback({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-12 max-w-2xl mx-auto h-full overflow-y-auto">
      <div className="mb-12">
        <h2 className="text-4xl font-black tracking-tighter italic">CREAR ESPACIO</h2>
        <p className="text-sm opacity-50 mt-2">Define el mapa donde ocurrirá la colaboración.</p>
      </div>

      <div className="space-y-8">
        <div className="group">
          <label className="text-[10px] uppercase font-black tracking-widest opacity-40 group-focus-within:opacity-100 transition-opacity">Nombre del Workspace</label>
          <input 
            type="text" 
            placeholder="Ej. Oficina Central Creativa"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-transparent border-b-2 border-white/10 py-4 text-2xl font-bold focus:outline-none focus:border-indigo-500 transition-all placeholder:opacity-20 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="text-[10px] uppercase font-black tracking-widest opacity-40">Ancho (px)</label>
            <input 
              type="number" 
              value={dim.w}
              onChange={e => setDim({...dim, w: parseInt(e.target.value) || 0})}
              className="w-full bg-black/10 border border-white/5 rounded-xl px-4 py-3 mt-2 focus:ring-1 focus:ring-indigo-500 text-white"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-black tracking-widest opacity-40">Largo (px)</label>
            <input 
              type="number" 
              value={dim.h}
              onChange={e => setDim({...dim, h: parseInt(e.target.value) || 0})}
              className="w-full bg-black/10 border border-white/5 rounded-xl px-4 py-3 mt-2 focus:ring-1 focus:ring-indigo-500 text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-black tracking-widest opacity-40 block mb-4">Plantilla Base</label>
          <div className="grid grid-cols-3 gap-4">
            {['Minimal', 'Open Office', 'Zen Garden'].map(p => (
              <div key={p} className="p-4 rounded-2xl border-2 border-white/5 bg-black/5 hover:border-indigo-500/50 cursor-pointer transition-all group">
                <div className="w-full aspect-square bg-zinc-800 rounded-lg mb-2 group-hover:bg-indigo-900/20 transition-colors"></div>
                <span className="text-[10px] font-black uppercase text-center block tracking-widest text-white">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8">
          <button 
            onClick={handleLaunch}
            disabled={!name.trim() || loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-2xl disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {loading ? 'Lanzando...' : 'Lanzar Espacio'}
          </button>
        </div>
      </div>
    </div>
  );
};
