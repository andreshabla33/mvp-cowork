
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Role } from '../types';

export const Dashboard: React.FC = () => {
  const { workspaces, setActiveWorkspace, currentUser, signOut, setAuthFeedback, authFeedback, fetchWorkspaces } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newSpaceName.trim()) return;
    setLoading(true);
    setAuthFeedback(null);
    
    try {
      const { data, error } = await supabase.rpc('crear_espacio_trabajo', {
        p_nombre: newSpaceName,
        p_descripcion: 'Espacio creado desde Dashboard'
      });
      
      if (error) throw error;
      
      setAuthFeedback({ type: 'success', message: '¡Espacio creado con éxito!' });
      
      await fetchWorkspaces();
      setShowCreate(false);
      setNewSpaceName('');
    } catch (e: any) {
      const msg = e?.message || e?.error_description || (typeof e === 'string' ? e : 'Error al crear el espacio');
      console.error("Create Workspace Error:", e);
      setAuthFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-12 max-w-7xl mx-auto min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-20 animate-in slide-in-from-top-4 duration-500 gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center font-black italic shadow-lg shadow-indigo-500/20 text-white">C</div>
              <h1 className="text-6xl font-black tracking-tighter italic uppercase text-white">Cowork</h1>
           </div>
           <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">Bienvenido, {currentUser.name}</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowCreate(true)} 
             className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-indigo-600/30 text-white"
           >
             Nuevo Espacio
           </button>
           <button 
             onClick={signOut} 
             className="bg-zinc-900 border border-white/5 hover:bg-zinc-800 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-zinc-400"
           >
             Salir
           </button>
        </div>
      </header>

      {/* Feedback de la operación */}
      {authFeedback && (
        <div className={`mb-10 p-5 rounded-[24px] border-2 animate-in slide-in-from-top-2 flex items-center justify-between gap-4 ${
          authFeedback.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{authFeedback.type === 'success' ? '🚀' : '⚠️'}</span>
            <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
              {authFeedback.message}
            </p>
          </div>
          <button onClick={() => setAuthFeedback(null)} className="opacity-50 hover:opacity-100 p-2 text-xl font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {workspaces.map((ws: any) => (
          <div 
            key={ws.id} 
            onClick={() => setActiveWorkspace(ws, ws.userRole)}
            className="group glass-card p-10 rounded-[48px] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden animate-in fade-in duration-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] group-hover:bg-indigo-600/20 transition-all" />
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-16 h-16 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-3xl font-black text-indigo-500 group-hover:scale-110 transition-transform shadow-xl">
                {ws.name ? ws.name.charAt(0).toUpperCase() : 'W'}
              </div>
              <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Activo</span>
              </div>
            </div>

            <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2 group-hover:text-indigo-400 transition-colors truncate">{ws.name}</h3>
            
            <div className="flex items-center gap-3 mt-6">
               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${
                 ws.userRole === Role.SUPER_ADMIN ? 'bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 
                 ws.userRole === Role.ADMIN ? 'bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
               }`}>
                 {ws.userRole ? ws.userRole.replace('_', ' ') : 'Miembro'}
               </span>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
               <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Entrar al espacio</p>
               <svg className="w-5 h-5 text-indigo-500 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
               </svg>
            </div>
          </div>
        ))}

        {workspaces.length === 0 && !authFeedback && !loading && (
          <div className="col-span-full py-40 border-2 border-dashed border-zinc-800 rounded-[60px] flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-1000">
             <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center text-5xl mb-2 opacity-30">🏢</div>
             <div className="space-y-2">
                <p className="text-white font-black uppercase tracking-[0.3em] text-sm">No tienes espacios de trabajo</p>
                <p className="text-zinc-600 text-[10px] font-bold uppercase">Comienza creando tu propia sede virtual</p>
             </div>
             <button 
               onClick={() => setShowCreate(true)} 
               className="mt-4 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black uppercase tracking-widest text-xs text-white shadow-2xl shadow-indigo-600/40 transition-all hover:scale-105"
             >
               Crea tu primer espacio
             </button>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="max-w-md w-full bg-[#0d0d0f] border border-white/10 rounded-[48px] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-in zoom-in duration-300">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-10 text-white">Lanzar Sede</h2>
            <div className="space-y-8">
              <div>
                <label className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-3 block">Nombre de la Compañía</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ej. Cyberdyne Systems"
                  value={newSpaceName}
                  onChange={e => setNewSpaceName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-lg focus:ring-2 focus:ring-indigo-600 outline-none text-white placeholder:text-zinc-800 font-bold"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowCreate(false)} 
                  className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-500 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={loading || !newSpaceName.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl disabled:opacity-50 text-white"
                >
                  {loading ? 'Preparando...' : 'Crear Sede'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
