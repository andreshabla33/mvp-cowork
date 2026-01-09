
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ThemeType, AvatarConfig, PresenceStatus } from '../types';

export const AvatarPreview: React.FC<{
  config: AvatarConfig, 
  size?: 'small' | 'large', 
  direction?: 'front' | 'left' | 'right' | 'back',
  isSitting?: boolean,
  isMoving?: boolean
}> = ({ config, size = 'small', direction = 'front', isSitting = false, isMoving = false }) => {
  const isLarge = size === 'large';
  const skin = config.skinColor || '#fcd34d';
  const clothes = config.clothingColor || '#6366f1';
  const hair = config.hairColor || '#4b2c20';
  const p = isLarge ? 4 : 2; 

  const flip = direction === 'left' ? 'scaleX(-1)' : 'none';

  return (
    <div 
      className={`relative flex flex-col items-center justify-center ${isMoving ? 'animate-bounce-short' : ''}`}
      style={{ width: isLarge ? '100px' : '40px', height: isLarge ? '120px' : '50px', transform: flip, imageRendering: 'pixelated' }}
    >
      <style>{`@keyframes walk-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } } .animate-bounce-short { animation: walk-bob 0.3s infinite ease-in-out; }`}</style>
      <div className="absolute bottom-[2px] w-[70%] h-[10%] bg-black/30 rounded-full blur-[1px]" />
      
      {/* Cabeza Cuadrada Procedural */}
      <div className="relative z-20 rounded-sm mb-[-1px]" style={{ width: p * 12, height: p * 12, backgroundColor: skin, border: `${p/2}px solid #000` }}>
        {/* Cabello */}
        <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[55%] z-10" style={{ backgroundColor: hair, border: `${p/2}px solid #000`, borderBottom: 'none' }} />
        {/* Ojos */}
        <div className="absolute top-[45%] left-0 w-full flex justify-around px-[15%]">
          <div className="bg-black relative" style={{ width: p * 2, height: p * 2 }}></div>
          <div className="bg-black relative" style={{ width: p * 2, height: p * 2 }}></div>
        </div>
      </div>
      
      {/* Cuerpo Cuadrado Procedural */}
      <div className="relative z-10 rounded-t-sm" style={{ width: p * 14, height: p * 10, backgroundColor: clothes, border: `${p/2}px solid #000` }}></div>
      
      {/* Piernas */}
      <div className="flex justify-around z-0 mt-[-1px]" style={{ width: p * 10 }}>
        <div className="bg-zinc-900" style={{ width: p * 4.5, height: p * 3, border: `${p/2}px solid #000`, borderTop: 'none' }} />
        <div className="bg-zinc-900" style={{ width: p * 4.5, height: p * 3, border: `${p/2}px solid #000`, borderTop: 'none' }} />
      </div>
    </div>
  );
};

interface NavbarProps {
  activeTab: 'space' | 'tasks' | 'settings' | 'avatar' | 'builder';
  setActiveTab: (tab: 'space' | 'tasks' | 'settings' | 'avatar' | 'builder') => void;
  onVibenToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onVibenToggle }) => {
  const { theme, setTheme, currentUser, updateStatus } = useStore();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const themes: {id: ThemeType, label: string, icon: string, color: string}[] = [
    { id: 'dark', label: 'Dark', icon: '🌑', color: 'bg-zinc-950' },
    { id: 'light', label: 'Light', icon: '☀️', color: 'bg-white' },
    { id: 'space', label: 'Espacial', icon: '🚀', color: 'bg-indigo-950' },
    { id: 'arcade', label: 'Arcade', icon: '🎮', color: 'bg-black' }
  ];

  const statuses = [
    { id: PresenceStatus.AVAILABLE, label: 'Disponible', color: 'bg-green-500' },
    { id: PresenceStatus.BUSY, label: 'Ocupado', color: 'bg-red-500' },
    { id: PresenceStatus.AWAY, label: 'Ausente', color: 'bg-yellow-500' },
    { id: PresenceStatus.DND, label: 'No molestar', color: 'bg-indigo-500' }
  ];

  const currentStatus = statuses.find(s => s.id === currentUser.status) || statuses[0];

  return (
    <nav className={`h-16 border-b transition-all duration-500 flex items-center justify-between px-6 z-50 ${theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800 text-white' : theme === 'light' ? 'bg-white/80 border-zinc-200 text-zinc-900' : theme === 'space' ? 'bg-[#020617]/80 border-indigo-900 text-indigo-100' : 'bg-black/80 border-[#00ff41]/30 text-[#00ff41]'} backdrop-blur-md`}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('space')}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white italic shadow-lg ${theme === 'arcade' ? 'bg-[#00ff41] text-black shadow-[#00ff41]/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}>C</div>
          <span className="font-bold text-lg tracking-tighter uppercase">Cowork</span>
        </div>
        <div className={`flex items-center gap-1 p-1 border ${theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-black/20 border-white/5'} rounded-lg`}>
          {(['space', 'tasks', 'builder', 'avatar', 'settings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? (theme === 'arcade' ? 'bg-[#00ff41] text-black' : 'bg-indigo-600 text-white shadow-md') : 'opacity-60 hover:opacity-100'}`}>{tab}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Status Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-black/20 border-white/10'}`}
          >
            <div className={`w-2 h-2 rounded-full ${currentStatus.color}`} />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{currentStatus.label}</span>
          </button>
          {showStatusMenu && (
            <div className={`absolute top-full mt-2 right-0 border rounded-2xl shadow-2xl p-2 min-w-[140px] z-[100] animate-in slide-in-from-top-2 duration-200 ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-white/10'}`}>
              {statuses.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => { updateStatus(s.id); setShowStatusMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${theme === 'light' ? 'hover:bg-zinc-50' : 'hover:bg-white/5'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600 group-hover:text-black' : 'text-zinc-400 group-hover:text-white'}`}>{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Selector Icon Buttons */}
        <div className={`flex items-center gap-1 p-1 border rounded-full ${theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-black/20 border-white/10'}`}>
          {themes.map(t => (
            <button 
              key={t.id} 
              onClick={() => setTheme(t.id)} 
              title={t.label} 
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all text-xs border-2 ${theme === t.id ? (theme === 'arcade' ? 'border-[#00ff41] bg-[#00ff41]/20 scale-110' : 'border-indigo-500 bg-white/10 scale-110') : 'border-transparent opacity-40 hover:opacity-100'}`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <button onClick={onVibenToggle} className={`flex items-center gap-2 border px-4 py-1.5 rounded-full transition-all group ${theme === 'arcade' ? 'bg-[#00ff41]/5 border-[#00ff41]/30 hover:bg-[#00ff41]/10 text-[#00ff41]' : 'bg-indigo-600/10 hover:bg-indigo-600/20 border-indigo-600/30 text-indigo-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme === 'arcade' ? 'bg-[#00ff41]' : 'bg-indigo-500'}`}></span>
          <span className="text-[10px] font-black uppercase tracking-widest">Ask Viben</span>
        </button>

        <div className={`flex items-center gap-3 pl-4 border-l ${theme === 'light' ? 'border-zinc-200' : 'border-white/10'}`}>
          <div onClick={() => setActiveTab('avatar')} className={`w-10 h-10 rounded-full border-2 p-0.5 overflow-hidden shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${theme === 'arcade' ? 'border-[#00ff41]/50 bg-black' : 'border-indigo-500/50 bg-zinc-900'}`}>
            <AvatarPreview config={currentUser.avatarConfig!} size="small" />
          </div>
        </div>
      </div>
    </nav>
  );
};
