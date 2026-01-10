import React, { useEffect, useState } from 'react';

interface ToastNotification {
  id: string;
  userName: string;
  userInitial: string;
  message: string;
  channelName?: string;
  isDirect?: boolean;
  groupId: string;
  timestamp: Date;
}

interface ChatToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  onOpen: (groupId: string) => void;
  theme: string;
}

export const ChatToast: React.FC<ChatToastProps> = ({ notifications, onDismiss, onOpen, theme }) => {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
      {notifications.map((notif) => (
        <ToastItem 
          key={notif.id} 
          notification={notif} 
          onDismiss={onDismiss} 
          onOpen={onOpen}
          theme={theme}
        />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  notification: ToastNotification;
  onDismiss: (id: string) => void;
  onOpen: (groupId: string) => void;
  theme: string;
}> = ({ notification, onDismiss, onOpen, theme }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const handleClick = () => {
    onOpen(notification.groupId);
    onDismiss(notification.id);
  };

  const truncateMessage = (msg: string, maxLength: number = 60) => {
    if (msg.length <= maxLength) return msg;
    return msg.substring(0, maxLength) + '...';
  };

  const isArcade = theme === 'arcade';

  return (
    <div
      onClick={handleClick}
      className={`
        pointer-events-auto cursor-pointer
        min-w-[320px] max-w-[400px] p-4 rounded-2xl
        backdrop-blur-xl border shadow-2xl
        transform transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-3xl
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0 animate-slide-in'}
        ${isArcade 
          ? 'bg-black/80 border-[#00ff41]/50 shadow-[0_0_30px_rgba(0,255,65,0.2)]' 
          : 'bg-zinc-900/80 border-white/10 shadow-black/50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0
          ${isArcade ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'bg-indigo-600/30 text-indigo-400'}
        `}>
          {notification.userInitial}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[13px] font-bold truncate ${isArcade ? 'text-[#00ff41]' : 'text-white'}`}>
              {notification.userName}
            </span>
            {notification.channelName && !notification.isDirect && (
              <span className="text-[10px] opacity-40 font-medium">
                en #{notification.channelName}
              </span>
            )}
            {notification.isDirect && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isArcade ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'bg-indigo-600/30 text-indigo-400'}`}>
                DM
              </span>
            )}
          </div>
          <p className={`text-[13px] leading-relaxed ${isArcade ? 'text-[#00ff41]/70' : 'text-zinc-300'}`}>
            {truncateMessage(notification.message)}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
          className="opacity-40 hover:opacity-100 transition-opacity p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${isArcade ? 'bg-[#00ff41]' : 'bg-indigo-500'} animate-shrink`}
          style={{ animationDuration: '5s' }}
        />
      </div>
    </div>
  );
};

export type { ToastNotification };
