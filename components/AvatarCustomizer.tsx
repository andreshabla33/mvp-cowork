
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { AvatarPreview } from './Navbar';
import { SpaceItem } from '../types';

interface AvatarCustomizerProps {
  compact?: boolean;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({ compact = false }) => {
  const { currentUser, updateAvatar, addSpaceItem, theme } = useStore();
  const config = currentUser.avatarConfig!;
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'style' | 'objects'>('style');

  const colors = {
    skin: ['#fcd34d', '#fbbf24', '#d97706', '#92400e', '#78350f', '#fef3c7'],
    clothing: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#71717a'],
    hair: ['#4b2c20', '#2d1b14', '#1a120b', '#7b3f00', '#c2b280', '#e5e5e5', '#ffcc00', '#ec4899']
  };

  const accessories = ['none', 'glasses', 'hat', 'headphones'] as const;

  const catalog: { type: SpaceItem['type'], icon: string, label: string, category: string }[] = [
    { type: 'chair', icon: '💺', label: 'Silla', category: 'seating' },
    { type: 'table', icon: '🪑', label: 'Mesa', category: 'office' },
    { type: 'plant', icon: '🪴', label: 'Planta', category: 'decor' },
    { type: 'office_desk', icon: '🖥️', label: 'Escritorio', category: 'office' },
    { type: 'sofa', icon: '🛋️', label: 'Sofá', category: 'seating' },
    { type: 'gamer_chair', icon: '🎮', label: 'Silla Gamer', category: 'seating' },
    { type: 'bookshelf', icon: '📚', label: 'Librero', category: 'office' },
    { type: 'tv', icon: '📺', label: 'Televisor', category: 'decor' },
    { type: 'lamp', icon: '💡', label: 'Lámpara', category: 'decor' },
  ];

  const handleUpdate = async (newConfig: any) => {
    await updateAvatar(newConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const onDragStart = (e: React.DragEvent, type: SpaceItem['type']) => {
    e.dataTransfer.setData('itemType', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAddItem = (type: SpaceItem['type']) => {
    addSpaceItem({ id: Math.random().toString(36).substr(2, 9), type, x: currentUser.x, y: currentUser.y + 40 });
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  const containerClasses = compact 
    ? "p-6 flex flex-col gap-6" 
    : "p-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-stretch h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-700";

  const panelBg = compact ? "" : 'bg-black/40';

  return (
    <div className={containerClasses}>
      <div className={`flex flex-col items-center justify-center gap-6 ${compact ? 'p-4' : 'flex-1 p-12 rounded-[40px] border border-white/5 shadow-2xl'} ${panelBg} backdrop-blur-xl shrink-0`}>
        <div className="relative group">
          <div className="absolute -inset-10 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-500" />
          <div className={`relative z-10 bg-zinc-50 rounded-[40px] border border-zinc-100 shadow-inner flex items-center justify-center ${compact ? 'w-48 h-48' : 'p-16 min-w-[280px] min-h-[320px]'}`}>
            <AvatarPreview config={config} size={compact ? 'small' : 'large'} />
          </div>
        </div>
        
        <div className="flex flex-col gap-3 w-full">
           <div className="flex gap-2 bg-zinc-100 p-2 rounded-2xl border border-zinc-200">
              <button onClick={() => setActiveTab('style')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'style' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}>Estilo</button>
              <button onClick={() => setActiveTab('objects')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'objects' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}>Tienda</button>
           </div>
        </div>
      </div>

      <div className={`flex flex-col gap-8 ${compact ? 'flex-1' : 'flex-[1.5] p-10 rounded-[40px] border border-white/5 shadow-2xl'} ${panelBg} backdrop-blur-xl`}>
        {activeTab === 'style' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <section><label className="text-[9px] uppercase font-black tracking-widest text-indigo-500 mb-3 block">Piel</label><div className="grid grid-cols-6 gap-2">{colors.skin.map(c => (<button key={c} onClick={() => handleUpdate({...config, skinColor: c})} className={`w-8 h-8 rounded-full border-2 transition-all ${config.skinColor === c ? 'border-indigo-500 scale-110' : 'border-zinc-200'}`} style={{ backgroundColor: c }} />))}</div></section>
            <section><label className="text-[9px] uppercase font-black tracking-widest text-indigo-500 mb-3 block">Cabello</label><div className="grid grid-cols-8 gap-2">{colors.hair.map(c => (<button key={c} onClick={() => handleUpdate({...config, hairColor: c})} className={`w-6 h-6 rounded-md border-2 transition-all ${config.hairColor === c ? 'border-indigo-500 scale-110 shadow-lg' : 'border-zinc-200'}`} style={{ backgroundColor: c }} />))}</div></section>
            <section><label className="text-[9px] uppercase font-black tracking-widest text-indigo-500 mb-3 block">Ropa</label><div className="grid grid-cols-7 gap-2">{colors.clothing.map(c => (<button key={c} onClick={() => handleUpdate({...config, clothingColor: c})} className={`w-8 h-8 rounded-full border-2 transition-all ${config.clothingColor === c ? 'border-indigo-500 scale-110' : 'border-zinc-200'}`} style={{ backgroundColor: c }} />))}</div></section>
            <section><label className="text-[9px] uppercase font-black tracking-widest text-indigo-500 mb-3 block">Accesorios</label><div className="grid grid-cols-2 gap-3">{accessories.map(acc => (<button key={acc} onClick={() => handleUpdate({...config, accessory: acc})} className={`py-3 rounded-xl text-[8px] font-black tracking-widest border-2 transition-all ${config.accessory === acc ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300'}`}>{acc.toUpperCase()}</button>))}</div></section>
            <button disabled className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest text-white transition-all ${saved ? 'bg-green-500' : 'bg-zinc-700 opacity-50'}`}>
              {saved ? 'CAMBIOS GUARDADOS' : 'SINCRONIZANDO CON LA NUBE...'}
            </button>
          </div>
        )}
        {activeTab === 'objects' && (
          <div className="grid grid-cols-2 gap-4 pb-4 animate-in fade-in">
             {catalog.map(item => (
               <div key={item.type} draggable onDragStart={(e) => onDragStart(e, item.type)} onClick={() => handleAddItem(item.type)} className="group p-5 rounded-3xl bg-zinc-50 border border-zinc-100 hover:border-indigo-500/30 hover:bg-white transition-all flex flex-col items-center gap-2 cursor-grab">
                 <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-indigo-500">{item.label}</span>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
