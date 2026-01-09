
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const ChatSidebar: React.FC = () => {
  const [msg, setMsg] = useState('');
  const { messages, addMessage, currentUser } = useStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!msg.trim()) return;
    addMessage({
      id: Math.random().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: msg,
      timestamp: Date.now()
    });
    setMsg('');
  };

  return (
    <aside className="h-full flex flex-col bg-zinc-950/40 backdrop-blur-xl">
      <div className="p-6 border-b border-white/5">
        <h3 className="font-black italic uppercase tracking-widest text-xs flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Canal General
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col gap-1.5 ${m.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{m.senderName}</span>
              <span className="text-[8px] text-zinc-700">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className={`text-xs p-3 rounded-2xl border ${
              m.senderId === currentUser.id 
                ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-100 rounded-tr-none' 
                : 'bg-zinc-800/40 border-white/5 text-zinc-300 rounded-tl-none'
            }`}>
              {m.text}
            </p>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-20">
            <div className="text-3xl mb-4 opacity-20">💬</div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">No hay mensajes aún</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="relative group">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enviar mensaje..."
            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-5 pr-14 py-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-zinc-800 transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:text-white transition-colors bg-indigo-500/10 hover:bg-indigo-600 rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
