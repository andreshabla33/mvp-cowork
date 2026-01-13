import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PresenceStatus } from '../types';

const STATUS_OPTIONS = [
  { value: PresenceStatus.AVAILABLE, label: 'Disponible', color: 'bg-green-500', icon: '🟢' },
  { value: PresenceStatus.BUSY, label: 'Ocupado', color: 'bg-red-500', icon: '🔴' },
  { value: PresenceStatus.AWAY, label: 'Ausente', color: 'bg-yellow-500', icon: '🟡' },
  { value: PresenceStatus.DND, label: 'No molestar', color: 'bg-purple-500', icon: '🟣' },
];

export const StatusSelector: React.FC = () => {
  const { currentUser, updateStatus } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customStatus, setCustomStatus] = useState(currentUser.statusText || '');
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === currentUser.status) || STATUS_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditingCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isEditingCustom && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingCustom]);

  const handleStatusChange = async (status: PresenceStatus) => {
    await updateStatus(status, customStatus);
    setIsOpen(false);
  };

  const handleCustomStatusSave = async () => {
    await updateStatus(currentUser.status, customStatus);
    setIsEditingCustom(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomStatusSave();
    } else if (e.key === 'Escape') {
      setIsEditingCustom(false);
      setCustomStatus(currentUser.statusText || '');
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-white/20"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${currentStatusOption.color} shadow-lg`} />
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
          {currentStatusOption.label}
        </span>
        <svg className={`w-3 h-3 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest opacity-40">Estado</p>
            
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  currentUser.status === option.value 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${option.color}`} />
                <span className="text-[12px] font-medium">{option.label}</span>
                {currentUser.status === option.value && (
                  <svg className="w-4 h-4 ml-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 p-2">
            <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest opacity-40">Estado personalizado</p>
            
            {isEditingCustom ? (
              <div className="px-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="¿Qué estás haciendo?"
                  maxLength={50}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[12px] focus:outline-none focus:border-indigo-500/50 placeholder:opacity-30"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleCustomStatusSave}
                    className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCustom(false);
                      setCustomStatus(currentUser.statusText || '');
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingCustom(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
              >
                <span className="text-lg">💭</span>
                <span className="text-[12px] opacity-60 truncate">
                  {customStatus || 'Agregar estado personalizado...'}
                </span>
              </button>
            )}
            
            {customStatus && !isEditingCustom && (
              <button
                onClick={async () => {
                  setCustomStatus('');
                  await updateStatus(currentUser.status, '');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-all mt-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-[11px] font-medium">Borrar estado</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const StatusIndicator: React.FC<{ status: PresenceStatus; size?: 'sm' | 'md' | 'lg' }> = ({ status, size = 'sm' }) => {
  const statusOption = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <span 
      className={`${sizeClasses[size]} rounded-full ${statusOption.color} shadow-lg`} 
      title={statusOption.label}
    />
  );
};

export default StatusSelector;
