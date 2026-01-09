
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Role } from '../types';
import { ModalInvitarUsuario } from './invitaciones/ModalInvitarUsuario';

export const MiembrosView: React.FC = () => {
  const { activeWorkspace, userRoleInActiveWorkspace, theme } = useStore();
  const [miembros, setMiembros] = useState<any[]>([]);
  const [invitaciones, setInvitaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const isAdmin = userRoleInActiveWorkspace === Role.ADMIN || userRoleInActiveWorkspace === Role.SUPER_ADMIN;
  const isArcade = theme === 'arcade';

  const fetchData = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const { data: mData } = await supabase
        .from('miembros_espacio')
        .select('*, usuario:usuarios(*), departamento:departamentos(*)')
        .eq('espacio_id', activeWorkspace.id)
        .eq('aceptado', true);
      
      const { data: iData } = await supabase
        .from('invitaciones_pendientes')
        .select('*')
        .eq('espacio_id', activeWorkspace.id)
        .eq('usada', false);

      setMiembros(mData || []);
      setInvitaciones(iData || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeWorkspace]);

  const getRolColor = (rol: string) => {
    const map: any = { 
      super_admin: isArcade ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]' : 'bg-purple-500', 
      admin: isArcade ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-red-500', 
      moderador: 'bg-orange-500', 
      miembro: isArcade ? 'bg-[#00ff41]/10 text-[#00ff41]/80 border border-[#00ff41]/30' : 'bg-blue-500', 
      invitado: 'bg-zinc-500' 
    };
    return map[rol] || 'bg-zinc-500';
  };

  return (
    <div className="p-12 max-w-6xl mx-auto h-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-end mb-12">
        <div>
           <h2 className={`text-4xl font-black uppercase italic tracking-tighter ${isArcade ? 'text-[#00ff41] neon-text' : ''}`}>Miembros del Equipo</h2>
           <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-2 ${isArcade ? 'text-[#00ff41]/60' : 'text-zinc-500'}`}>Gestiona el acceso de tu organización</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowInvite(true)} 
            className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95 ${
              isArcade ? 'bg-[#00ff41] text-black shadow-[#00ff41]/30' : 'bg-indigo-600 text-white shadow-indigo-600/20'
            }`}
          >
            Invitar Usuario
          </button>
        )}
      </div>

      <div className="space-y-12">
        <section>
          <div className={`overflow-hidden rounded-[32px] border ${isArcade ? 'border-[#00ff41]/30 bg-black' : 'border-white/5 bg-zinc-950/40'} shadow-2xl`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${isArcade ? 'bg-[#00ff41]/5' : 'bg-black/40'}`}>
                  <th className={`p-6 text-[10px] font-black uppercase tracking-[0.2em] ${isArcade ? 'text-[#00ff41]/40' : 'text-zinc-500'}`}>Usuario</th>
                  <th className={`p-6 text-[10px] font-black uppercase tracking-[0.2em] ${isArcade ? 'text-[#00ff41]/40' : 'text-zinc-500'}`}>Rol</th>
                  <th className={`p-6 text-[10px] font-black uppercase tracking-[0.2em] ${isArcade ? 'text-[#00ff41]/40' : 'text-zinc-500'}`}>Departamento</th>
                  <th className={`p-6 text-[10px] font-black uppercase tracking-[0.2em] ${isArcade ? 'text-[#00ff41]/40' : 'text-zinc-500'}`}>Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isArcade ? 'divide-[#00ff41]/10' : 'divide-white/5'}`}>
                {miembros.map(m => (
                  <tr key={m.id} className={`${isArcade ? 'hover:bg-[#00ff41]/5' : 'hover:bg-white/[0.02]'} transition-colors`}>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-xl ${isArcade ? 'bg-[#00ff41] text-black' : 'bg-indigo-600 text-white'}`}>
                          {m.usuario?.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-sm font-black uppercase tracking-widest ${isArcade ? 'text-[#00ff41]' : 'text-white'}`}>{m.usuario?.nombre}</p>
                          <p className={`text-[10px] font-bold ${isArcade ? 'text-[#00ff41]/40' : 'text-zinc-500'}`}>{m.usuario?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                       <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${getRolColor(m.rol)}`}>
                         {m.rol.replace('_', ' ')}
                       </span>
                    </td>
                    <td className="p-6">
                       <p className={`text-[10px] font-black uppercase tracking-widest ${isArcade ? 'text-[#00ff41]/60' : 'text-zinc-400'}`}>
                         {m.departamento?.nombre || 'General'}
                       </p>
                    </td>
                    <td className="p-6">
                       {isAdmin && m.rol !== 'super_admin' && (
                         <button className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-400 hover:underline underline-offset-4">Eliminar</button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {isAdmin && invitaciones.length > 0 && (
          <section>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 ${isArcade ? 'text-[#00ff41]/60' : 'text-zinc-600'}`}>Invitaciones Pendientes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {invitaciones.map(inv => (
                 <div key={inv.id} className={`p-8 rounded-[40px] border shadow-2xl transition-all hover:scale-[1.02] ${isArcade ? 'bg-black border-[#00ff41]/20' : 'bg-zinc-900/40 border-white/5'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className={`p-3 rounded-2xl ${isArcade ? 'bg-[#00ff41]/10 text-[#00ff41]' : 'bg-indigo-600/10 text-indigo-400'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                       </div>
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isArcade ? 'bg-[#00ff41]/5 text-[#00ff41]/40' : 'bg-black/40 text-zinc-600'}`}>
                         Pendiente
                       </span>
                    </div>
                    <p className={`text-xs font-black uppercase tracking-widest mb-1 truncate ${isArcade ? 'text-[#00ff41]' : 'text-white'}`}>{inv.email}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mb-6 ${isArcade ? 'text-[#00ff41]/40' : 'text-zinc-500'}`}>{inv.rol}</p>
                    <button className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-400 hover:underline underline-offset-4">Cancelar</button>
                 </div>
               ))}
            </div>
          </section>
        )}
      </div>

      {activeWorkspace && (
        <ModalInvitarUsuario
          espacioId={activeWorkspace.id}
          espacioNombre={activeWorkspace.name}
          abierto={showInvite}
          onCerrar={() => setShowInvite(false)}
          onExito={fetchData}
        />
      )}
    </div>
  );
};
