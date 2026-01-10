import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChatGroup, ChatMessage, User } from '../types';
import { useStore } from '../store/useStore';
import { ModalCrearGrupo } from './chat/ModalCrearGrupo';
import { AgregarMiembros } from './chat/AgregarMiembros';

interface ChatPanelProps {
  sidebarOnly?: boolean;
  chatOnly?: boolean;
  onChannelSelect?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sidebarOnly = false, chatOnly = false, onChannelSelect }) => {
  const { activeWorkspace, currentUser, setActiveSubTab, theme } = useStore();
  const [grupos, setGrupos] = useState<ChatGroup[]>([]);
  const [grupoActivo, setGrupoActivo] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [miembrosEspacio, setMiembrosEspacio] = useState<any[]>([]);
  
  const mensajesRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    const cargarGrupos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('grupos_chat')
        .select('*')
        .eq('espacio_id', activeWorkspace.id)
        .order('creado_en', { ascending: true });
      
      if (!error && data) {
        setGrupos(data);
        if (data.length > 0 && !grupoActivo) {
          const general = data.find(g => g.nombre.toLowerCase() === 'general');
          setGrupoActivo(general ? general.id : data[0].id);
        }
      }
      setLoading(false);
    };
    cargarGrupos();

    // Cargar miembros del espacio
    const cargarMiembros = async () => {
      // Obtener el usuario actual de la sesión
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      // Query directa a usuarios a través del usuario_id
      const { data, error } = await supabase
        .from('miembros_espacio')
        .select('usuario_id')
        .eq('espacio_id', activeWorkspace.id)
        .eq('aceptado', true);
      
      console.log('Miembros IDs:', data, 'Error:', error, 'CurrentUserId:', currentUserId);
      
      if (data && data.length > 0) {
        // Filtrar el usuario actual y obtener datos de usuarios
        const otrosIds = data
          .map((m: any) => m.usuario_id)
          .filter((id: string) => id !== currentUserId);
        
        if (otrosIds.length > 0) {
          const { data: usuarios } = await supabase
            .from('usuarios')
            .select('id, nombre, email')
            .in('id', otrosIds);
          
          console.log('Usuarios encontrados:', usuarios);
          setMiembrosEspacio(usuarios || []);
        }
      }
    };
    cargarMiembros();
  }, [activeWorkspace]);

  useEffect(() => {
    if (!grupoActivo) return;
    const cargarMensajes = async () => {
      const { data, error } = await supabase
        .from('mensajes_chat')
        .select(`id, contenido, creado_en, usuario_id, tipo, usuario:usuarios(id, nombre)`)
        .eq('grupo_id', grupoActivo)
        .order('creado_en', { ascending: true });
      
      if (!error && data) { 
        setMensajes(data as any); 
        scrollToBottom(); 
      }
    };
    cargarMensajes();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase.channel(`chat_realtime_${grupoActivo}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensajes_chat', 
        filter: `grupo_id=eq.${grupoActivo}` 
      }, async (payload) => {
        const { data: userData } = await supabase.from('usuarios').select('id, nombre').eq('id', payload.new.usuario_id).single();
        const nuevoMsg = { ...payload.new, usuario: userData || { id: payload.new.usuario_id, nombre: 'Usuario' } } as unknown as ChatMessage;
        setMensajes(prev => [...prev, nuevoMsg]);
        scrollToBottom();
      }).subscribe();

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [grupoActivo]);

  const scrollToBottom = () => {
    setTimeout(() => { if (mensajesRef.current) mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight; }, 150);
  };

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !grupoActivo || !currentUser.id) return;
    const content = nuevoMensaje.trim();
    setNuevoMensaje(''); 
    const { error } = await supabase.from('mensajes_chat').insert({ grupo_id: grupoActivo, usuario_id: currentUser.id, contenido: content, tipo: 'texto' });
    if (error) setNuevoMensaje(content);
  };

  const handleChannelSelect = (id: string) => {
    setGrupoActivo(id);
    setActiveSubTab('chat' as any);
    if (onChannelSelect) onChannelSelect();
  };

  const chatStyles = {
    dark: {
      sidebarBg: 'bg-[#19171d]',
      chatBg: 'bg-[#1a1d21]',
      bubbleOther: 'bg-[#2d3136] text-zinc-100',
      bubbleSelf: 'bg-indigo-600 text-white',
      input: 'bg-black/40 border-white/10 text-white',
      btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg',
      activeItem: 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
    },
    light: {
      sidebarBg: 'bg-zinc-100',
      chatBg: 'bg-white',
      bubbleOther: 'bg-zinc-200 text-zinc-900',
      bubbleSelf: 'bg-indigo-600 text-white',
      input: 'bg-zinc-50 border-zinc-300 text-zinc-900',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md',
      activeItem: 'bg-white text-indigo-600 border border-zinc-200 shadow-md font-black'
    },
    space: {
      sidebarBg: 'bg-[#1e1b4b]',
      chatBg: 'bg-[#020617]',
      bubbleOther: 'bg-[#1e293b] text-indigo-100 border border-indigo-500/20',
      bubbleSelf: 'bg-cyan-700 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]',
      input: 'bg-indigo-950/50 border-indigo-900/50 text-indigo-100',
      btn: 'bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg',
      activeItem: 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
    },
    arcade: {
      sidebarBg: 'bg-black',
      chatBg: 'bg-black',
      bubbleOther: 'bg-black border-2 border-[#00ff41]/40 text-[#00ff41]',
      bubbleSelf: 'bg-[#00ff41] text-black font-black shadow-[0_0_20px_#00ff41]',
      input: 'bg-black border-2 border-[#00ff41] text-[#00ff41]',
      btn: 'bg-[#00ff41] hover:bg-white text-black font-black uppercase tracking-tighter',
      activeItem: 'bg-[#00ff41] text-black font-black shadow-[0_0_10px_#00ff41]'
    }
  };

  const s = chatStyles[theme] || chatStyles.dark;
  const grupoActivoData = grupos.find(g => g.id === grupoActivo);

  if (sidebarOnly) {
    return (
      <div className={`h-full flex flex-col overflow-hidden transition-all duration-500 ${s.sidebarBg}`}>
        {/* Workspace Header */}
        <div className={`p-5 border-b border-white/5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors group`}>
          <h2 className={`font-black text-xs uppercase tracking-tight truncate ${theme === 'arcade' ? 'text-[#00ff41]' : ''}`}>{activeWorkspace?.name || 'Workspace'}</h2>
          <svg className="w-4 h-4 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Navegación Principal: Hilos, Juntas */}
          <div className="px-2 py-4 space-y-0.5">
            {[
              { id: 'hilos', icon: '💬', label: 'Hilos' },
              { id: 'juntas', icon: '🎧', label: 'Juntas' },
              { id: 'borradores', icon: '📝', label: 'Borradores' },
            ].map(item => (
              <button key={item.id} className="w-full text-left px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-3">
                <span className="w-4 text-center opacity-60">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="h-px bg-white/5 mx-4 my-2" />

          {/* Canales */}
          <div className="px-2 py-4">
            <div className="px-3 mb-2 group flex items-center justify-between">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${theme === 'arcade' ? 'text-[#00ff41]' : ''}`}>Canales</h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${theme === 'arcade' ? 'bg-[#00ff41] text-black shadow-[0_0_10px_#00ff41]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Crear Canal"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>
            <div className="space-y-0.5">
              {grupos.map(g => (
                <button 
                  key={g.id} 
                  onClick={() => handleChannelSelect(g.id)} 
                  className={`w-full text-left px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 truncate ${grupoActivo === g.id ? s.activeItem : 'opacity-50 hover:opacity-100 hover:bg-white/5'}`}
                >
                  <span className="opacity-40">{g.tipo === 'privado' ? '🔒' : '#'}</span>
                  <span className="truncate">{g.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/5 mx-4 my-2" />

          {/* Mensajes Directos / Personas */}
          <div className="px-2 py-4">
            <div className="px-3 mb-2">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${theme === 'arcade' ? 'text-[#00ff41]' : ''}`}>Personas</h3>
            </div>
            <div className="space-y-0.5">
              {miembrosEspacio.length > 0 ? miembrosEspacio.map((u: any) => (
                <button key={u.id} className="w-full text-left px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-3 truncate opacity-50 hover:opacity-100">
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] font-black">{u.nombre?.charAt(0)}</div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#19171d] bg-green-500`} />
                  </div>
                  <span className="truncate">{u.nombre}</span>
                </button>
              )) : (
                 <p className="px-4 py-2 text-[9px] opacity-30 italic font-bold">No hay otros miembros</p>
              )}
              {/* Botón para invitar */}
              <button 
                onClick={() => setActiveSubTab('miembros')}
                className="w-full text-left px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:bg-indigo-500/10 transition-all flex items-center gap-3 mt-2"
              >
                <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/20 rounded-lg text-lg">+</span>
                Invitar personas
              </button>
            </div>
          </div>
        </div>

        {showCreateModal && <ModalCrearGrupo onClose={() => setShowCreateModal(false)} onCreate={async (n, t) => {
          const { data, error } = await supabase.from('grupos_chat').insert({ espacio_id: activeWorkspace!.id, nombre: n, tipo: t, creado_por: currentUser.id, icono: '#' }).select().single();
          if (!error && data) { setGrupos(prev => [...prev, data]); handleChannelSelect(data.id); setShowCreateModal(false); }
        }} />}
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col transition-all duration-500 overflow-hidden ${s.chatBg}`}>
      <div className={`px-8 py-5 border-b border-white/5 flex items-center justify-between shrink-0 shadow-sm`}>
         <div className="flex items-center gap-4">
            <span className={`text-2xl opacity-40 ${theme === 'arcade' ? 'text-[#00ff41]' : ''}`}>{grupoActivoData?.tipo === 'privado' ? '🔒' : '#'}</span>
            <div>
              <h3 className={`font-black text-sm uppercase tracking-widest truncate ${theme === 'arcade' ? 'text-[#00ff41] neon-text' : ''}`}>{grupoActivoData?.nombre || 'General'}</h3>
              <p className="text-[9px] font-bold opacity-30 uppercase tracking-tighter">Espacio de colaboración abierta</p>
            </div>
         </div>
         {/* BOTÓN DE AÑADIR MIEMBROS REPARADO Y MEJORADO */}
         <button 
           onClick={() => setShowAddMembers(true)} 
           className={`p-3 rounded-2xl transition-all shadow-xl flex items-center gap-2 group ${theme === 'arcade' ? 'bg-[#00ff41] text-black font-black' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
         >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            <span className="hidden md:block text-[10px] uppercase font-black tracking-widest px-1">Añadir</span>
         </button>
      </div>

      <div ref={mensajesRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
             <span className="text-6xl mb-4">💬</span>
             <p className="font-black uppercase tracking-[0.3em] text-[10px]">No hay mensajes en este canal</p>
          </div>
        ) : mensajes.map(m => (
          <div key={m.id} className={`flex gap-4 ${m.usuario_id === currentUser.id ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[12px] font-black text-white shrink-0 shadow-2xl ${m.usuario_id === currentUser.id ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
              {m.usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 max-w-[80%] flex flex-col ${m.usuario_id === currentUser.id ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-3 mb-1.5 px-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'arcade' ? 'text-[#00ff41]' : 'opacity-40'}`}>{m.usuario?.nombre}</span>
                <span className="text-[8px] opacity-20 font-bold">{new Date(m.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={`text-[13px] p-5 rounded-[28px] leading-relaxed break-words shadow-2xl ${m.usuario_id === currentUser.id ? `${s.bubbleSelf} rounded-tr-none` : `${s.bubbleOther} rounded-tl-none`}`}>
                {m.contenido}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 shrink-0 border-t border-white/5 bg-black/5">
        <form onSubmit={enviarMensaje} className={`flex gap-3 p-2.5 rounded-[32px] border-2 transition-all ${s.input}`}>
          <input 
            type="text" 
            value={nuevoMensaje} 
            onChange={(e) => setNuevoMensaje(e.target.value)} 
            placeholder={`Enviar un mensaje a #${grupoActivoData?.nombre || 'canal'}...`} 
            className="flex-1 bg-transparent border-none text-[13px] font-bold focus:outline-none px-6 placeholder:opacity-20" 
          />
          <button 
            type="submit" 
            disabled={!nuevoMensaje.trim()} 
            className={`w-12 h-12 rounded-[22px] flex items-center justify-center disabled:opacity-20 transition-all shadow-2xl active:scale-90 shrink-0 ${s.btn}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </form>
      </div>
      {showAddMembers && grupoActivo && <AgregarMiembros grupoId={grupoActivo} espacioId={activeWorkspace!.id} onClose={() => setShowAddMembers(false)} />}
    </div>
  );
};