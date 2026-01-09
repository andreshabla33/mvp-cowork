
import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { VirtualSpace } from './VirtualSpace';
import { TaskBoard } from './TaskBoard';
import { MiembrosView } from './MiembrosView';
import { AvatarCustomizer } from './AvatarCustomizer';
import { ChatPanel } from './ChatPanel';
import { VibenAssistant } from './VibenAssistant';
import { AvatarPreview } from './Navbar';
import { Role, PresenceStatus, ThemeType } from '../types';
import { supabase } from '../lib/supabase';

export const WorkspaceLayout: React.FC = () => {
  const { activeWorkspace, activeSubTab, setActiveSubTab, setActiveWorkspace, currentUser, theme, setTheme, setView, session } = useStore();
  const [showViben, setShowViben] = useState(false);
  const presenceChannelRef = useRef<any>(null);

  const onVibenToggle = () => setShowViben(prev => !prev);

  useEffect(() => {
    if (!activeWorkspace) setView('dashboard');
  }, [activeWorkspace, setView]);

  // Realtime Presence - se mantiene activa mientras estemos en el workspace
  useEffect(() => {
    if (!activeWorkspace?.id || !session?.user?.id) return;

    const roomName = `workspace:${activeWorkspace.id}`;
    const channel = supabase.channel(roomName, {
      config: { presence: { key: session.user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // La sincronización se maneja en VirtualSpace
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: session.user.id,
            name: currentUser.name,
            role: currentUser.role,
            avatarConfig: currentUser.avatarConfig,
            x: currentUser.x,
            y: currentUser.y,
            direction: currentUser.direction,
            isMicOn: currentUser.isMicOn,
            isCameraOn: currentUser.isCameraOn,
          });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace?.id, session?.user?.id]);

  // Actualizar presencia cuando cambia la posición (desde cualquier tab)
  useEffect(() => {
    if (presenceChannelRef.current && session?.user?.id) {
      presenceChannelRef.current.track({
        user_id: session.user.id,
        name: currentUser.name,
        role: currentUser.role,
        avatarConfig: currentUser.avatarConfig,
        x: currentUser.x,
        y: currentUser.y,
        direction: currentUser.direction,
        isMicOn: currentUser.isMicOn,
        isCameraOn: currentUser.isCameraOn,
      });
    }
  }, [currentUser.x, currentUser.y, currentUser.isMicOn, currentUser.isCameraOn, session?.user?.id]);

  if (!activeWorkspace) return null;

  const themeStyles = {
    dark: {
      bg: 'bg-[#1a1d21]',
      text: 'text-zinc-100',
      globalNav: 'bg-[#3f0e40]',
      sidebar: 'bg-[#19171d]',
      border: 'border-white/5',
      header: 'bg-[#1a1d21]',
      accent: 'bg-indigo-600',
      btn: 'bg-indigo-600 hover:bg-indigo-500 text-white'
    },
    light: {
      bg: 'bg-white',
      text: 'text-zinc-900',
      globalNav: 'bg-zinc-200',
      sidebar: 'bg-zinc-100',
      border: 'border-zinc-300',
      header: 'bg-white',
      accent: 'bg-indigo-600',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
    },
    space: {
      bg: 'bg-[#020617]',
      text: 'text-indigo-100',
      globalNav: 'bg-[#0f172a]',
      sidebar: 'bg-[#1e1b4b]',
      border: 'border-indigo-500/30',
      header: 'bg-[#020617]',
      accent: 'bg-cyan-600',
      btn: 'bg-cyan-500 hover:bg-cyan-400 text-black font-black shadow-[0_0_20px_rgba(34,211,238,0.4)]'
    },
    arcade: {
      bg: 'bg-black',
      text: 'text-[#00ff41]',
      globalNav: 'bg-black',
      sidebar: 'bg-black',
      border: 'border-[#00ff41]/60',
      header: 'bg-black',
      accent: 'bg-[#00ff41]',
      btn: 'bg-[#00ff41] hover:bg-white text-black font-black uppercase tracking-tighter shadow-[0_0_15px_#00ff41]'
    }
  };

  const s = themeStyles[theme] || themeStyles.dark;

  const themes: {id: ThemeType, label: string, icon: string}[] = [
    { id: 'dark', label: 'Oscuro', icon: '🌑' },
    { id: 'light', label: 'Claro', icon: '☀️' },
    { id: 'space', label: 'Espacial', icon: '🚀' },
    { id: 'arcade', label: 'Arcade', icon: '🎮' }
  ];

  return (
    <div className={`flex h-screen w-screen overflow-hidden transition-all duration-500 ${s.bg} ${s.text}`}>
      
      {/* Sidebar Global */}
      <aside className={`w-[70px] ${s.globalNav} flex flex-col items-center py-8 gap-6 shrink-0 z-[100] border-r ${s.border}`}>
        <div 
          onClick={() => setView('dashboard')}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all shadow-2xl overflow-hidden ${theme === 'arcade' ? 'bg-[#00ff41] border-2 border-[#00ff41]' : 'bg-white'}`}
        >
          <img src="https://urpeai.com/wp-content/uploads/2024/03/Logotipo-Urpe-Ai-Lab-1.png" className={`w-9 h-9 object-contain ${theme === 'arcade' ? 'invert' : ''}`} alt="Logo" />
        </div>

        <nav className="flex-1 flex flex-col gap-5 mt-4">
          {[
            { id: 'space', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Espacio' },
            { id: 'chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'Mensajes' },
            { id: 'tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Tareas' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`p-3.5 rounded-2xl transition-all shadow-xl ${activeSubTab === item.id ? (theme === 'arcade' ? 'bg-[#00ff41] text-black shadow-[0_0_20px_#00ff41]' : 'bg-white/20 text-white') : 'opacity-40 hover:opacity-100 hover:bg-white/5'}`}
              title={item.label}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon}/></svg>
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-6 items-center">
          <div 
            onClick={() => setActiveSubTab('avatar')}
            className={`w-11 h-11 rounded-2xl overflow-hidden cursor-pointer hover:ring-4 transition-all relative group ${theme === 'arcade' ? 'ring-[#00ff41]' : 'ring-white/50'}`}
          >
            <AvatarPreview config={currentUser.avatarConfig!} size="small" />
          </div>
        </div>
      </aside>

      {/* Sidebar Workspace */}
      <aside className={`w-[260px] ${s.sidebar} flex flex-col shrink-0 border-r ${s.border} z-90 shadow-2xl relative overflow-hidden`}>
        {theme === 'arcade' && <div className="absolute top-0 left-0 w-full h-1 bg-[#00ff41] animate-pulse" />}
        <ChatPanel sidebarOnly={true} />
      </aside>

      {/* Main Content */}
      <main className={`flex-1 relative h-full flex flex-col min-w-0 ${s.bg}`}>
        <header className={`h-16 border-b ${s.border} flex items-center px-8 justify-between shrink-0 ${s.header} z-50 shadow-sm`}>
          <div className="flex items-center gap-4">
             <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${theme === 'arcade' ? 'text-[#00ff41] animate-pulse' : 'opacity-80'}`}>
               {activeSubTab === 'space' ? '🌎 Spatial World' : activeSubTab.toUpperCase()}
             </h2>
          </div>
          
          <div className="flex items-center gap-6">
            {/* SELECTOR DE TEMAS */}
            <div className={`flex items-center gap-2 p-1 rounded-[20px] border ${s.border} bg-black/20 shadow-inner`}>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-30 px-3 hidden lg:block">Estilo</span>
              {themes.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setTheme(t.id)} 
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg transition-all transform active:scale-90 ${theme === t.id ? 'bg-white/20 shadow-2xl scale-110 border border-white/20' : 'opacity-20 hover:opacity-100 hover:bg-white/5'}`}
                  title={t.label}
                >
                  {t.icon}
                </button>
              ))}
            </div>

            <button onClick={onVibenToggle} className={`flex items-center gap-3 px-7 py-2.5 rounded-full transition-all border-2 font-black uppercase text-[10px] tracking-[0.1em] group shadow-2xl ${theme === 'arcade' ? 'bg-[#00ff41] border-[#00ff41] text-black shadow-[0_0_20px_#00ff41]' : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-500'}`}>
              <span className={`w-2 h-2 rounded-full animate-ping ${theme === 'arcade' ? 'bg-black' : 'bg-white'}`}></span>
              Viben AI
            </button>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          {activeSubTab === 'space' && <VirtualSpace />}
          <div className={`h-full w-full overflow-y-auto ${activeSubTab !== 'space' ? 'animate-in fade-in duration-500' : ''}`}>
            {activeSubTab === 'tasks' && <TaskBoard />}
            {activeSubTab === 'miembros' && <MiembrosView />}
            {activeSubTab === 'avatar' && <AvatarCustomizer />}
            {(activeSubTab as any) === 'chat' && <ChatPanel chatOnly={true} />}
            {activeSubTab === 'settings' && (
              <div className="p-16 max-w-4xl mx-auto">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-10">Configuración</h2>
                <div className={`p-12 rounded-[50px] border-2 ${s.border} bg-black/10 backdrop-blur-3xl shadow-2xl`}>
                  <div className={`flex justify-between items-center pb-10 border-b-2 ${s.border}`}>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-30">Workspace en uso</p>
                      <p className="text-4xl font-bold mt-2">{activeWorkspace?.name}</p>
                    </div>
                    <button className={`px-10 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${s.btn}`}>Personalizar</button>
                  </div>
                  <div className="pt-10">
                    <button onClick={() => setActiveWorkspace(null)} className="text-red-500 text-[11px] font-black uppercase tracking-[0.2em] hover:text-red-400 flex items-center gap-3 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Cerrar Sesión de Espacio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* El contenedor ahora es puramente de posicionamiento, no tiene estilos propios */}
        {showViben && (
          <div className="fixed bottom-4 right-4 z-[200] w-[calc(100vw-2rem)] sm:w-[340px] flex flex-col items-end pointer-events-none">
            <div className="w-full pointer-events-auto animate-in slide-in-from-right-4 duration-500">
              <VibenAssistant onClose={() => setShowViben(false)} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
