
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Phaser from 'phaser';
import { useStore } from '../store/useStore';
import { User, Role, PresenceStatus } from '../types';
import { supabase } from '../lib/supabase';

const MOVE_SPEED = 240; 
const INITIAL_ZOOM = 1.3;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const PROXIMITY_RADIUS = 180; 
const CAMERA_LERP = 0.15; 


// --- Iconos ---
const IconMic = ({ on }: { on: boolean }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {on ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z"/> 
       : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />}
  </svg>
);

const IconCam = ({ on }: { on: boolean }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {on ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/> 
       : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />}
  </svg>
);

const IconScreen = ({ on }: { on: boolean }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/>
    {!on && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3l18 18" />}
  </svg>
);

const IconPrivacy = ({ on }: { on: boolean }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 11V7a4 4 0 00-8 0v4M5 11h14a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" />
    {!on && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3l18 18" />}
  </svg>
);

const IconZoom = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
  </svg>
);

const IconReaction = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const IconExpand = ({ on }: { on: boolean }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {on ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 4v5m0 0H4m5 0L4 4m11 0v5m0 0h5m-5 0l5-5M9 20v-5m0 0H4m5 0l-5 5m11-5v5m0-5h5m-5 0l5 5" />
       : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />}
  </svg>
);

// --- Minimap Component ---
const Minimap: React.FC<{ currentUser: User; users: User[]; workspace: any }> = ({ currentUser, users, workspace }) => {
  if (!workspace) return null;
  const size = 140;
  const mapWidth = workspace.width || 2000;
  const mapHeight = workspace.height || 2000;
  const scaleX = size / mapWidth;
  const scaleY = size / mapHeight;

  return (
    <div className="absolute bottom-6 left-6 w-[140px] h-[140px] bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden pointer-events-none shadow-2xl z-20">
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      </div>
      <div className="relative w-full h-full">
        <div 
          className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,1)] z-10"
          style={{ 
            left: `${currentUser.x * scaleX}px`, 
            top: `${currentUser.y * scaleY}px`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        {users.map(u => (
          <div 
            key={u.id}
            className="absolute w-1.5 h-1.5 bg-white/50 rounded-full"
            style={{ 
              left: `${u.x * scaleX}px`, 
              top: `${u.y * scaleY}px`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
              </div>
    </div>
  );
};

// --- VideoHUD Component ---
const VideoHUD = React.memo(({ 
  userName, micOn, camOn, sharingOn, isPrivate, usersInCall, stream, screenStream,
  remoteStreams, onToggleMic, onToggleCam, onToggleShare, onTogglePrivacy, onTriggerReaction, theme,
  expandedId, setExpandedId 
}: any) => {
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); 
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);

  const currentStream = sharingOn ? screenStream : stream;

  useEffect(() => {
    if (localVideoRef.current && localVideoRef.current.srcObject !== currentStream) {
      localVideoRef.current.srcObject = currentStream;
      localVideoRef.current.play().catch(e => console.warn("Auto-play error", e));
    }
    if (expandedId === 'local' && expandedVideoRef.current && expandedVideoRef.current.srcObject !== currentStream) {
      expandedVideoRef.current.srcObject = currentStream;
      expandedVideoRef.current.play().catch(e => console.warn("Auto-play error (expanded)", e));
    }
  }, [currentStream, expandedId]);

  useEffect(() => {
    if (!expandedId) {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [expandedId]);

  const expandedUser = expandedId === 'local' ? { name: 'Tú' } : usersInCall.find((u: any) => u.id === expandedId);
  const emojis = ['👍', '🔥', '❤️', '👏', '😂', '😮', '🚀', '✨'];

  const accentColor = theme === 'arcade' ? 'bg-[#00ff41] text-black' : 'bg-indigo-600 text-white';

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const BubbleControls = ({ isLocal = false, targetId = 'local' }: { isLocal?: boolean, targetId?: string }) => {
    return (
      <div className="absolute bottom-3 left-2 right-2 flex justify-center items-center gap-1.5 transition-all duration-300 opacity-0 group-hover:opacity-100 px-2 pointer-events-auto">
        {isLocal && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onToggleMic(); }} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all ${micOn ? 'bg-white/20 text-white hover:bg-white/40' : 'bg-red-500 text-white shadow-lg'}`}><IconMic on={micOn}/></button>
            <button onClick={(e) => { e.stopPropagation(); onToggleCam(); }} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all ${camOn ? 'bg-white/20 text-white hover:bg-white/40' : 'bg-red-500 text-white shadow-lg'}`}><IconCam on={camOn}/></button>
            <button onClick={(e) => { e.stopPropagation(); onToggleShare(); }} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all ${sharingOn ? accentColor : 'bg-white/20 text-white hover:bg-white/40'}`}><IconScreen on={sharingOn}/></button>
            <button onClick={(e) => { e.stopPropagation(); onTogglePrivacy(); }} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all ${isPrivate ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/20 text-white hover:bg-white/40'}`}><IconPrivacy on={isPrivate}/></button>
            <div className="relative">
               <button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(showEmojiPicker === targetId ? null : targetId); }} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/40 transition-all"><IconReaction /></button>
               {showEmojiPicker === targetId && (
                 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 flex gap-1 shadow-2xl animate-in slide-in-from-bottom-2">
                   {emojis.map(e => (
                     <button key={e} onClick={(ev) => { ev.stopPropagation(); onTriggerReaction(e); setShowEmojiPicker(null); }} className="text-xl hover:scale-125 transition-transform p-1">{e}</button>
                   ))}
                 </div>
               )}
            </div>
          </>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); setExpandedId(targetId === expandedId ? null : (targetId as any)); }} 
          className="w-8 h-8 rounded-full bg-indigo-600 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-indigo-500 transition-all shadow-xl"
        >
          <IconExpand on={targetId === expandedId} />
        </button>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-[100]">
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 pointer-events-none ${expandedId ? 'opacity-100' : 'opacity-0'}`} />

      {expandedId && (
        <div className="absolute inset-4 md:inset-10 lg:right-[340px] z-10 flex flex-col pointer-events-auto animate-in zoom-in-95 duration-500">
          <div className={`flex-1 relative bg-black rounded-[40px] overflow-hidden border ${theme === 'arcade' ? 'border-[#00ff41]' : 'border-white/10'} shadow-2xl group/expanded`}>
            
            <div 
              className={`w-full h-full relative overflow-hidden flex items-center justify-center ${expandedId === 'local' && !sharingOn ? 'mirror' : ''} ${zoomLevel > 1 ? 'cursor-move' : 'cursor-default'}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {expandedId === 'local' ? (
                <video 
                  ref={expandedVideoRef} 
                  autoPlay muted playsInline 
                  className="w-full h-full object-contain block origin-center transition-transform duration-100 pointer-events-none select-none" 
                  style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})` }}
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center bg-zinc-900 overflow-hidden pointer-events-none select-none"
                  style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})` }}
                >
                  <div className="text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black mb-4 mx-auto shadow-2xl ${accentColor}`}>{expandedUser?.name.charAt(0)}</div>
                    <p className="text-xl font-bold uppercase tracking-widest text-white">{expandedUser?.name}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 rounded-[32px] bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl transition-opacity opacity-0 group-hover/expanded:opacity-100">
                {expandedId === 'local' && (
                  <>
                    <button onClick={onToggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}><IconMic on={micOn} /></button>
                    <button onClick={onToggleCam} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}><IconCam on={camOn} /></button>
                    <button onClick={onToggleShare} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${sharingOn ? accentColor : 'bg-white/10 text-white hover:bg-white/20'}`}><IconScreen on={sharingOn}/></button>
                    <button onClick={onTogglePrivacy} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPrivate ? 'bg-amber-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}><IconPrivacy on={isPrivate}/></button>
                  </>
                )}
                <button 
                  onClick={() => { setZoomLevel(prev => prev >= 3 ? 1 : prev + 0.5); setPanOffset({x:0, y:0}); }} 
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
                  title="Ajustar Zoom"
                >
                    <IconZoom />
                </button>
                <button 
                  onClick={() => setExpandedId(null)} 
                  className="w-12 h-12 rounded-full bg-indigo-600 backdrop-blur-md text-white flex items-center justify-center hover:bg-indigo-500 transition-all border border-white/10 shadow-lg"
                  title="Minimizar"
                >
                    <IconExpand on={true} />
                </button>
            </div>
          </div>
        </div>
      )}

      <div className={`absolute transition-all duration-700 ${expandedId ? 'right-4 top-4 bottom-24 w-[280px] md:w-[320px] flex flex-col gap-4 overflow-y-auto pr-2 pointer-events-auto custom-scrollbar' : 'left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto'}`}>
        {(expandedId !== 'local') && (
          <div className={`relative bg-black rounded-[28px] overflow-hidden border ${theme === 'arcade' ? 'border-[#00ff41]' : 'border-white/10'} shadow-2xl group transition-all shrink-0 ${expandedId ? 'w-full aspect-video' : 'w-48 h-32 md:w-60 md:h-40'}`}>
            <div className={`relative w-full h-full overflow-hidden flex items-center justify-center transition-opacity ${!camOn && !sharingOn ? 'opacity-0' : 'opacity-100'} ${!sharingOn ? 'mirror' : ''}`}>
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover block" />
            </div>
            {(!camOn && !sharingOn) && (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                 <div className={`w-14 h-14 rounded-full border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-2xl bg-black/50`}>{userName.charAt(0)}</div>
              </div>
            )}
            <BubbleControls isLocal={true} targetId="local" />
          </div>
        )}

        {usersInCall.map((u: any) => {
          const remoteStream = remoteStreams?.get(u.id);
          return (expandedId !== u.id) && (
            <div key={u.id} className={`relative bg-zinc-900 rounded-[28px] overflow-hidden border ${theme === 'arcade' ? 'border-[#00ff41]' : 'border-white/10'} shadow-2xl group transition-all shrink-0 ${expandedId ? 'w-full aspect-video' : 'w-48 h-32 md:w-60 md:h-40'}`}>
               {remoteStream ? (
                 <video 
                   autoPlay playsInline 
                   className="absolute inset-0 w-full h-full object-cover"
                   ref={(el) => { if (el && el.srcObject !== remoteStream) { el.srcObject = remoteStream; el.play().catch(() => {}); } }}
                 />
               ) : (
                 <>
                   <img src={`https://picsum.photos/seed/${u.id}/400/300`} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px]" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white font-black text-2xl bg-black/40`}>{u.name.charAt(0)}</div>
                   </div>
                 </>
               )}
               <BubbleControls isLocal={false} targetId={u.id} />
               <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
                  <div className={`w-2 h-2 rounded-full ${u.isMicOn ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white truncate max-w-[80px]">{u.name}</span>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const VirtualSpace: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [expandedId, setExpandedId] = useState<string | 'local' | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeScreenRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const webrtcChannelRef = useRef<any>(null);

  const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { 
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];
  
  const { 
    currentUser, users, activeWorkspace, setPosition, 
    toggleMic, toggleCamera, toggleScreenShare, togglePrivacy, setPrivacy, theme, addNotification, session
  } = useStore();

  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Realtime Presence
  useEffect(() => {
    if (!activeWorkspace?.id || !session?.user?.id) return;

    const roomName = `workspace:${activeWorkspace.id}`;
    const channel = supabase.channel(roomName, {
      config: { presence: { key: session.user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: User[] = [];
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          presences.forEach(presence => {
            if (presence.user_id !== session.user.id) {
              users.push({
                id: presence.user_id,
                name: presence.name || 'Usuario',
                role: presence.role || Role.MIEMBRO,
                avatar: '',
                avatarConfig: presence.avatarConfig || { skinColor: '#fcd34d', clothingColor: '#6366f1', hairColor: '#4b2c20', accessory: 'none' },
                x: presence.x || 500,
                y: presence.y || 500,
                direction: presence.direction || 'front',
                isOnline: true,
                isMicOn: presence.isMicOn || false,
                isCameraOn: presence.isCameraOn || false,
                isScreenSharing: false,
                isPrivate: false,
                status: PresenceStatus.AVAILABLE,
              });
            }
          });
        });
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Usuario conectado:', key, newPresences);
        addNotification(`${newPresences[0]?.name || 'Alguien'} se conectó`, 'entry');
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Usuario desconectado:', key);
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

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace?.id, session?.user?.id]);

  // Actualizar presencia cuando cambia la posición
  useEffect(() => {
    if (channelRef.current && session?.user?.id) {
      channelRef.current.track({
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
  }, [currentUser.x, currentUser.y, currentUser.isMicOn, currentUser.isCameraOn]);

  // WebRTC Signaling
  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean) => {
    if (peerConnectionsRef.current.has(peerId)) return peerConnectionsRef.current.get(peerId)!;
    
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionsRef.current.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate && webrtcChannelRef.current) {
        webrtcChannelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, to: peerId, from: session?.user?.id }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track from', peerId);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(peerId, event.streams[0]);
        return newMap;
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        pc.close();
        peerConnectionsRef.current.delete(peerId);
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(peerId);
          return newMap;
        });
      }
    };

    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, activeStreamRef.current!);
      });
    }

    return pc;
  }, [session?.user?.id]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromId: string) => {
    const pc = createPeerConnection(fromId, false);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    if (webrtcChannelRef.current) {
      webrtcChannelRef.current.send({
        type: 'broadcast',
        event: 'answer',
        payload: { answer, to: fromId, from: session?.user?.id }
      });
    }
  }, [createPeerConnection, session?.user?.id]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit, fromId: string) => {
    const pc = peerConnectionsRef.current.get(fromId);
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit, fromId: string) => {
    const pc = peerConnectionsRef.current.get(fromId);
    if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);

  const initiateCall = useCallback(async (peerId: string) => {
    const pc = createPeerConnection(peerId, true);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    if (webrtcChannelRef.current) {
      webrtcChannelRef.current.send({
        type: 'broadcast',
        event: 'offer',
        payload: { offer, to: peerId, from: session?.user?.id }
      });
    }
  }, [createPeerConnection, session?.user?.id]);

  // WebRTC Channel
  useEffect(() => {
    if (!activeWorkspace?.id || !session?.user?.id) return;

    const webrtcChannel = supabase.channel(`webrtc:${activeWorkspace.id}`);
    
    webrtcChannel
      .on('broadcast', { event: 'offer' }, ({ payload }) => {
        if (payload.to === session.user.id) {
          handleOffer(payload.offer, payload.from);
        }
      })
      .on('broadcast', { event: 'answer' }, ({ payload }) => {
        if (payload.to === session.user.id) {
          handleAnswer(payload.answer, payload.from);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        if (payload.to === session.user.id) {
          handleIceCandidate(payload.candidate, payload.from);
        }
      })
      .subscribe();

    webrtcChannelRef.current = webrtcChannel;

    return () => {
      supabase.removeChannel(webrtcChannel);
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [activeWorkspace?.id, session?.user?.id, handleOffer, handleAnswer, handleIceCandidate]);

  const themeColors = { 
    dark: '#09090b', 
    light: '#ffffff', 
    space: '#020617',
    arcade: '#000000'
  };

  const usersInCall = useMemo(() => {
    return onlineUsers.filter(u => {
      const dist = Math.sqrt(Math.pow(u.x - currentUser.x, 2) + Math.pow(u.y - currentUser.y, 2));
      return dist < PROXIMITY_RADIUS;
    });
  }, [onlineUsers, currentUser.x, currentUser.y]);
  
  const hasActiveCall = usersInCall.length > 0;

  useEffect(() => {
    if (currentUser.isPrivate && !hasActiveCall) {
      setPrivacy(false);
    }
  }, [hasActiveCall, currentUser.isPrivate, setPrivacy]);

  useEffect(() => {
    if (hasActiveCall) {
      if (!currentUser.isMicOn) toggleMic();
      if (!currentUser.isCameraOn) toggleCamera();
    }
  }, [hasActiveCall]);

  // Initiate WebRTC calls when users come into proximity
  useEffect(() => {
    if (!hasActiveCall || !activeStreamRef.current) return;
    
    usersInCall.forEach(user => {
      if (!peerConnectionsRef.current.has(user.id) && session?.user?.id) {
        if (session.user.id < user.id) {
          initiateCall(user.id);
        }
      }
    });
  }, [usersInCall, hasActiveCall, initiateCall, session?.user?.id]);

  const handleToggleScreenShare = async (forceVal?: boolean) => {
    const newVal = forceVal !== undefined ? forceVal : !currentUser.isScreenSharing;
    if (newVal) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        displayStream.getVideoTracks()[0].onended = () => handleToggleScreenShare(false);
        activeScreenRef.current = displayStream;
        setScreenStream(displayStream);
        toggleScreenShare(true);
      } catch (err: any) { 
        console.error("Screen Share Error:", err); 
        toggleScreenShare(false); 
        if (err.name === 'NotAllowedError' || err.message?.includes('denied')) {
          addNotification("Permiso de pantalla denegado.", "info");
        }
      }
    } else {
      if (activeScreenRef.current) { 
        activeScreenRef.current.getTracks().forEach(t => t.stop()); 
        activeScreenRef.current = null; 
        setScreenStream(null); 
      }
      toggleScreenShare(false);
    }
  };

  useEffect(() => {
    if (!hasActiveCall) {
      if (currentUser.isScreenSharing) handleToggleScreenShare(false);
      if (expandedId) setExpandedId(null);
    }
  }, [hasActiveCall, expandedId]);

  useEffect(() => {
    const manageStream = async () => {
      const needsStream = hasActiveCall || currentUser.isScreenSharing;
      if (needsStream) {
        if (!activeStreamRef.current) {
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ 
              video: { width: 640, height: 480 }, 
              audio: true 
            });
            activeStreamRef.current = newStream;
            setStream(newStream);
          } catch (err) { console.error("Media error:", err); }
        }
        if (activeStreamRef.current) {
          activeStreamRef.current.getAudioTracks().forEach(track => track.enabled = !!currentUser.isMicOn);
          activeStreamRef.current.getVideoTracks().forEach(track => track.enabled = !!currentUser.isCameraOn);
        }
      } else {
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach(track => track.stop());
          activeStreamRef.current = null;
          setStream(null);
        }
      }
    };
    manageStream();
  }, [currentUser.isMicOn, currentUser.isCameraOn, currentUser.isScreenSharing, hasActiveCall]);

  useEffect(() => {
    if (!containerRef.current || !activeWorkspace) return;
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      class CoworkScene extends Phaser.Scene {
        physics!: Phaser.Physics.Arcade.ArcadePhysics;
        cameras!: Phaser.Cameras.Scene2D.CameraManager;
        add!: Phaser.GameObjects.GameObjectFactory;
        input!: Phaser.Input.InputPlugin;
        tweens!: Phaser.Tweens.TweenManager;
        textures!: Phaser.Textures.TextureManager;
        anims!: Phaser.Animations.AnimationManager;
        game!: Phaser.Game;
        playerSprite!: Phaser.GameObjects.Sprite;
        playerContainer!: Phaser.GameObjects.Container;
        remotePlayers: Map<string, Phaser.GameObjects.Container> = new Map();
        cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        wasd!: any;
        lastSyncTime: number = 0;
        isPanning: boolean = false;
        constructor() { super('CoworkScene'); }
        create() {
          const { width, height } = activeWorkspace!;
          // Aseguramos límites estrictos para física y cámara
          this.physics.world.setBounds(0, 0, width, height);
          this.cameras.main.setBounds(0, 0, width, height);
          this.cameras.main.setBackgroundColor(themeColors[theme]);
          this.cameras.main.setRoundPixels(true); // Evita artefactos rectangulares en zoom

          const gridColor = theme === 'arcade' ? 0x00ff41 : 0x6366f1;
          const gridAlpha = theme === 'arcade' ? 0.2 : 0.05;
          
          // REPARACIÓN: Extendemos el grid mucho más allá de los bordes para evitar el vacío negro
          // Usamos 3x el tamaño del mapa para cubrir cualquier paneo o zoom extremo
          const gridWidth = width * 3;
          const gridHeight = height * 3;
          this.add.grid(width/2, height/2, gridWidth, gridHeight, 80, 80, 0x000000, 0, gridColor, gridAlpha);

          this.generatePixelAvatar('player-tex', currentUserRef.current.avatarConfig!);
          this.playerContainer = this.add.container(currentUserRef.current.x, currentUserRef.current.y);
          this.playerSprite = this.add.sprite(0, 0, 'player-tex', 0).setScale(1.5);
          const statusColor = theme === 'arcade' ? 0x00ff41 : 0x10b981;
          this.playerContainer.add([this.playerSprite, this.add.circle(18, -45, 5, statusColor).setStrokeStyle(1.5, 0x000000)]);
          
          this.physics.add.existing(this.playerContainer);
          // REPARACIÓN: Ajustamos el tamaño del cuerpo para evitar quedar atrapado en bordes
          (this.playerContainer.body as Phaser.Physics.Arcade.Body)
            .setCollideWorldBounds(true)
            .setSize(32, 32)
            .setOffset(-16, -16);

          this.cameras.main.startFollow(this.playerContainer, true, CAMERA_LERP, CAMERA_LERP).setZoom(INITIAL_ZOOM);
          
          this.cursors = this.input.keyboard!.createCursorKeys();
          this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
          
          this.input.on('wheel', (pointer: any, gameObjects: any, dx: number, dy: number) => {
            const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - (dy * 0.001), MIN_ZOOM, MAX_ZOOM);
            this.cameras.main.setZoom(newZoom);
          });
          
          this.game.canvas.style.cursor = 'grab';
          this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { 
            if (p.leftButtonDown()) { 
              this.isPanning = true; 
              this.cameras.main.stopFollow(); 
              this.game.canvas.style.cursor = 'grabbing'; 
            } 
          });
          this.input.on('pointermove', (p: Phaser.Input.Pointer) => { 
            if (this.isPanning && p.isDown) { 
              this.cameras.main.scrollX -= (p.x - p.prevPosition.x) / this.cameras.main.zoom; 
              this.cameras.main.scrollY -= (p.y - p.prevPosition.y) / this.cameras.main.zoom; 
            } 
          });
          this.input.on('pointerup', () => { 
            this.isPanning = false; 
            this.game.canvas.style.cursor = 'grab'; 
            // Restaurar seguimiento si el jugador no se ha movido mucho
            this.cameras.main.startFollow(this.playerContainer, true, CAMERA_LERP, CAMERA_LERP);
          });
        }
        floatEmoji(emoji: string) {
          const txt = this.add.text(this.playerContainer.x, this.playerContainer.y - 80, emoji, { fontSize: '40px' }).setOrigin(0.5);
          this.tweens.add({ targets: txt, y: txt.y - 100, alpha: 0, duration: 2500, ease: 'Cubic.out', onComplete: () => txt.destroy() });
        }
        generatePixelAvatar(key: string, config: any) {
          const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
          const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
          const { skinColor, hairColor, clothingColor } = config;
          for(let d=0; d<4; d++) {
            for(let f=0; f<4; f++) {
              const x = f * 64 + 32; const y = d * 64 + 32; const bob = (f % 2 === 0) ? 0 : -4;
              ctx.fillStyle = clothingColor; ctx.fillRect(x - 16, y - 8 + bob, 32, 24);
              ctx.fillStyle = skinColor; ctx.fillRect(x - 14, y - 38 + bob, 28, 30);
              ctx.fillStyle = hairColor; ctx.fillRect(x - 14, y - 38 + bob, 28, 10);
              ctx.fillStyle = '#111';
              if (d === 0) { ctx.fillRect(x - 7, y - 24 + bob, 4, 4); ctx.fillRect(x + 3, y - 24 + bob, 4, 4); }
              else if (d === 1) { ctx.fillRect(x - 12, y - 24 + bob, 4, 4); }
              else if (d === 2) { ctx.fillRect(x + 8, y - 24 + bob, 4, 4); }
            }
          }
          if (this.textures.exists(key)) this.textures.remove(key);
          this.textures.addSpriteSheet(key, canvas, { frameWidth: 64, frameHeight: 64 });
          ['down', 'left', 'right', 'up'].forEach((dir, i) => { 
            this.anims.create({ key: `${key}-${dir}`, frames: this.anims.generateFrameNumbers(key, { start: i * 4, end: i * 4 + 3 }), frameRate: 8, repeat: -1 }); 
          });
        }
        createRemotePlayer(u: User, tex: string) {
          const c = this.add.container(u.x, u.y);
          const s = this.add.sprite(0, 0, tex, 0).setScale(1.5);
          const nColor = theme === 'arcade' ? '#00ff41' : '#ffffff';
          const l = this.add.text(0, -60, u.name, { fontSize: '12px', fontWeight: 'bold', backgroundColor: '#00000088', padding: { x: 4, y: 2 }, color: nColor }).setOrigin(0.5);
          c.add([s, l]); this.remotePlayers.set(u.id, c);
        }
        update(time: number) {
          if (!this.playerContainer || !this.playerContainer.body) return;
          const body = this.playerContainer.body as Phaser.Physics.Arcade.Body;
          let vx = 0; let vy = 0; let animDir = '';
          if (this.cursors.left.isDown || this.wasd.A.isDown) { vx = -MOVE_SPEED; animDir = 'left'; }
          else if (this.cursors.right.isDown || this.wasd.D.isDown) { vx = MOVE_SPEED; animDir = 'right'; }
          if (this.cursors.up.isDown || this.wasd.W.isDown) { vy = -MOVE_SPEED; animDir = 'up'; }
          else if (this.cursors.down.isDown || this.wasd.S.isDown) { vy = MOVE_SPEED; animDir = 'down'; }
          body.setVelocity(vx, vy);
          if (vx !== 0 || vy !== 0) {
            const key = `player-tex-${animDir || (vy < 0 ? 'up' : 'down')}`;
            if (this.playerSprite.anims.getName() !== key) this.playerSprite.play(key);
            if (time - this.lastSyncTime > 100) { setPosition(this.playerContainer.x, this.playerContainer.y, 'front', false, true); this.lastSyncTime = time; }
          } else { this.playerSprite.stop(); if (this.lastSyncTime !== 0) { setPosition(this.playerContainer.x, this.playerContainer.y, 'front', false, false); this.lastSyncTime = 0; } }
        }
      }
      const config: Phaser.Types.Core.GameConfig = { type: Phaser.AUTO, parent: containerRef.current, width: containerRef.current!.clientWidth, height: containerRef.current!.clientHeight, physics: { default: 'arcade' }, scene: CoworkScene, transparent: true };
      gameRef.current = new Phaser.Game(config);
    }, 100);
    return () => { clearTimeout(timer); gameRef.current?.destroy(true); };
  }, [activeWorkspace?.id, theme]); 

  // Sincronizar avatares remotos con Phaser
  useEffect(() => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene('CoworkScene') as any;
    if (!scene || !scene.remotePlayers) return;

    // Actualizar o crear avatares remotos
    onlineUsers.forEach(user => {
      const existing = scene.remotePlayers.get(user.id);
      if (existing) {
        // Actualizar posición con interpolación suave
        scene.tweens.add({
          targets: existing,
          x: user.x,
          y: user.y,
          duration: 100,
          ease: 'Linear'
        });
      } else {
        // Crear nuevo avatar remoto
        const texKey = `remote-${user.id}`;
        scene.generatePixelAvatar(texKey, user.avatarConfig || { skinColor: '#fcd34d', clothingColor: '#6366f1', hairColor: '#4b2c20', accessory: 'none' });
        scene.createRemotePlayer({ ...user, name: user.name }, texKey);
      }
    });

    // Eliminar avatares de usuarios que ya no están
    scene.remotePlayers.forEach((container: any, odId: string) => {
      if (!onlineUsers.find(u => u.id === odId)) {
        container.destroy();
        scene.remotePlayers.delete(odId);
      }
    });
  }, [onlineUsers]);

  return (
    <div className={`w-full h-full relative overflow-hidden transition-colors duration-500 ${theme === 'arcade' ? 'bg-black' : (theme === 'space' ? 'bg-[#020617]' : (theme === 'light' ? 'bg-zinc-100' : 'bg-[#09090b]'))}`}>
      <div ref={containerRef} className="w-full h-full outline-none z-0" />
      <div className={`fixed inset-0 z-10 bg-black/40 backdrop-blur-md transition-opacity duration-700 pointer-events-none ${currentUser.isPrivate ? 'opacity-100' : 'opacity-0'}`} />
      <Minimap currentUser={currentUser} users={onlineUsers} workspace={activeWorkspace} />
      {(hasActiveCall || currentUser.isScreenSharing) && (
        <VideoHUD 
          userName={currentUser.name} micOn={currentUser.isMicOn} camOn={currentUser.isCameraOn} sharingOn={currentUser.isScreenSharing} isPrivate={currentUser.isPrivate} usersInCall={usersInCall} stream={stream} screenStream={screenStream}
          remoteStreams={remoteStreams}
          onToggleMic={toggleMic} onToggleCam={toggleCamera} onToggleShare={() => handleToggleScreenShare()} onTogglePrivacy={togglePrivacy} theme={theme}
          expandedId={expandedId} setExpandedId={setExpandedId}
          onTriggerReaction={(emoji: string) => { const scene = gameRef.current?.scene.getScene('CoworkScene') as any; if (scene?.floatEmoji) scene.floatEmoji(emoji); }}
        />
      )}
    </div>
  );
};
