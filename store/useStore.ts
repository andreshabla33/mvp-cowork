
import { create } from 'zustand';
import { User, Role, Task, TaskStatus, ChatMessage, ThemeType, Workspace, SpaceItem, AvatarConfig, Departamento, PresenceStatus } from '../types';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'mention' | 'entry';
  timestamp: number;
}

interface AppState {
  theme: ThemeType;
  view: 'dashboard' | 'workspace' | 'invitation' | 'loading';
  activeSubTab: 'space' | 'tasks' | 'miembros' | 'settings' | 'builder' | 'chat' | 'avatar';
  currentUser: User;
  users: User[];
  tasks: Task[];
  messages: ChatMessage[];
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  userRoleInActiveWorkspace: Role | null;
  session: any | null;
  authFeedback: { type: 'success' | 'error', message: string } | null;
  initialized: boolean;
  isInitializing: boolean;
  notifications: Notification[];
  
  setSession: (session: any) => void;
  setTheme: (theme: ThemeType) => void;
  setView: (view: AppState['view']) => void;
  setActiveSubTab: (tab: AppState['activeSubTab']) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  fetchWorkspaces: () => Promise<Workspace[]>;
  setActiveWorkspace: (workspace: Workspace | null, role?: Role) => void;
  setAuthFeedback: (feedback: { type: 'success' | 'error', message: string } | null) => void;
  
  setPosition: (x: number, y: number, direction?: User['direction'], isSitting?: boolean, isMoving?: boolean) => void;
  updateAvatar: (config: AvatarConfig) => Promise<void>;
  updateStatus: (status: PresenceStatus, statusText?: string) => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: (val?: boolean) => void;
  setPrivacy: (isPrivate: boolean) => void;
  togglePrivacy: () => void;
  
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  
  addSpaceItem: (item: SpaceItem) => void;
  updateSpaceItem: (id: string, updates: Partial<SpaceItem>) => void;
  removeSpaceItem: (id: string) => void;
  
  addTask: (task: Task) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  addMessage: (msg: ChatMessage) => void;
  addNotification: (message: string, type?: Notification['type']) => void;
  clearNotifications: () => void;
}

const initialAvatar: AvatarConfig = {
  skinColor: '#fcd34d',
  clothingColor: '#6366f1',
  hairColor: '#4b2c20',
  accessory: 'headphones'
};

const STORAGE_WS_KEY = 'cowork_active_workspace_id';

export const useStore = create<AppState>((set, get) => ({
  theme: 'dark',
  view: 'loading',
  activeSubTab: 'space',
  session: null,
  authFeedback: null,
  workspaces: [],
  activeWorkspace: null,
  userRoleInActiveWorkspace: null,
  departamentos: [],
  initialized: false,
  isInitializing: false,
  notifications: [],
  currentUser: {
    id: 'guest',
    name: 'Invitado',
    role: Role.INVITADO,
    avatar: '',
    avatarConfig: initialAvatar,
    x: 500,
    y: 500,
    direction: 'front',
    isSitting: false,
    isOnline: true,
    isPrivate: false,
    isMicOn: false, // Apagado por defecto para proximidad
    isCameraOn: false, // Apagado por defecto para proximidad
    isScreenSharing: false,
    status: PresenceStatus.AVAILABLE,
  },
  users: [],
  tasks: [],
  messages: [],

  initialize: async () => {
    if (get().isInitializing) return;
    set({ isInitializing: true });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ session });
        const { user } = session;

        const { data: avatarConfigData } = await supabase
          .from('avatar_configuracion')
          .select('configuracion')
          .eq('usuario_id', user.id)
          .single();

        set({ 
          currentUser: {
            ...get().currentUser,
            id: user.id,
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            avatarConfig: avatarConfigData?.configuracion || initialAvatar
          }
        });

        const workspaces = await get().fetchWorkspaces();
        const savedId = localStorage.getItem(STORAGE_WS_KEY);
        
        if (savedId) {
          const found = workspaces.find(w => w.id === savedId);
          if (found) {
            get().setActiveWorkspace(found, (found as any).userRole);
            set({ view: 'workspace' });
          } else {
            set({ view: 'dashboard' });
          }
        } else {
          set({ view: 'dashboard' });
        }
      } else {
        set({ session: null, view: 'dashboard' });
      }
    } catch (error) {
      console.error("Initialization failed:", error);
    } finally {
      set({ initialized: true, isInitializing: false });
    }
  },

  setSession: (session) => {
    if (session) {
      const { user } = session;
      set({ 
        session,
        currentUser: {
          ...get().currentUser,
          id: user.id,
          name: user.user_metadata?.full_name || user.email.split('@')[0],
        }
      });
      if (get().workspaces.length === 0) {
        get().fetchWorkspaces();
      }
    } else {
      set({ session: null });
    }
  },

  setTheme: (theme) => set({ theme }),
  setView: (view) => set({ view }),
  setActiveSubTab: (activeSubTab) => set({ activeSubTab }),
  setWorkspaces: (workspaces) => set({ workspaces }),

  fetchWorkspaces: async () => {
    const { session } = get();
    const userId = session?.user?.id;
    if (!userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('espacios_trabajo')
        .select(`id, nombre, descripcion, slug, miembros_espacio!inner (rol, aceptado)`)
        .eq('miembros_espacio.usuario_id', userId)
        .eq('miembros_espacio.aceptado', true);
      
      if (error) throw error;

      const workspaces = data.map((ws: any) => ({
        id: ws.id,
        name: ws.nombre,
        descripcion: ws.descripcion,
        slug: ws.slug,
        width: 2000,
        height: 2000,
        items: [],
        userRole: ws.miembros_espacio[0]?.rol as Role
      }));
      
      set({ workspaces, authFeedback: null });
      return workspaces;
    } catch (err: any) {
      console.error("Fetch Workspaces Error:", err);
      return [];
    }
  },
  
  setActiveWorkspace: (workspace, role) => {
    if (workspace) {
      localStorage.setItem(STORAGE_WS_KEY, workspace.id);
      set({ 
        activeWorkspace: workspace, 
        userRoleInActiveWorkspace: role || (workspace as any).userRole || null,
        view: 'workspace',
        activeSubTab: 'space'
      });
    } else {
      localStorage.removeItem(STORAGE_WS_KEY);
      set({ activeWorkspace: null, userRoleInActiveWorkspace: null, view: 'dashboard' });
    }
  },

  setAuthFeedback: (authFeedback) => set({ authFeedback }),

  signOut: async () => {
    localStorage.removeItem(STORAGE_WS_KEY);
    await supabase.auth.signOut();
    set({ session: null, view: 'dashboard', activeWorkspace: null, workspaces: [], initialized: true, isInitializing: false });
  },

  setPosition: (x, y, direction, isSitting, isMoving) => set((state) => ({ 
    currentUser: { 
      ...state.currentUser, 
      x, y, 
      direction: direction || state.currentUser.direction,
      isSitting: isSitting !== undefined ? isSitting : state.currentUser.isSitting,
      isMoving: isMoving !== undefined ? isMoving : state.currentUser.isMoving
    } 
  })),

  updateAvatar: async (config) => {
    const { session } = get();
    if (session?.user?.id) {
      await supabase.from('avatar_configuracion').upsert({
        usuario_id: session.user.id,
        configuracion: config,
        actualizado_en: new Date().toISOString()
      }, { onConflict: 'usuario_id' });
    }
    set((state) => ({ currentUser: { ...state.currentUser, avatarConfig: config } }));
  },

  updateStatus: async (status, statusText) => {
    const { session } = get();
    if (session?.user?.id) {
      await supabase.from('usuarios').update({
        estado_disponibilidad: status,
        estado_personalizado: statusText || null,
        estado_actualizado_en: new Date().toISOString()
      }).eq('id', session.user.id);
    }
    set((state) => ({
      currentUser: { ...state.currentUser, status, statusText: statusText || state.currentUser.statusText }
    }));
  },

  toggleMic: () => set((state) => ({
    currentUser: { ...state.currentUser, isMicOn: !state.currentUser.isMicOn }
  })),

  toggleCamera: () => set((state) => ({
    currentUser: { ...state.currentUser, isCameraOn: !state.currentUser.isCameraOn }
  })),

  toggleScreenShare: (val) => set((state) => ({
    currentUser: { ...state.currentUser, isScreenSharing: val !== undefined ? val : !state.currentUser.isScreenSharing }
  })),

  setPrivacy: (isPrivate) => set((state) => ({
    currentUser: { ...state.currentUser, isPrivate }
  })),

  togglePrivacy: () => set((state) => ({
    currentUser: { ...state.currentUser, isPrivate: !state.currentUser.isPrivate }
  })),

  addSpaceItem: (item) => set((state) => {
    if (!state.activeWorkspace) return state;
    return { activeWorkspace: { ...state.activeWorkspace, items: [...state.activeWorkspace.items, item] } };
  }),

  updateSpaceItem: (id, updates) => set((state) => {
    if (!state.activeWorkspace) return state;
    return { activeWorkspace: { ...state.activeWorkspace, items: state.activeWorkspace.items.map(i => i.id === id ? { ...i, ...updates } : i) } };
  }),

  removeSpaceItem: (id) => set((state) => {
    if (!state.activeWorkspace) return state;
    return { activeWorkspace: { ...state.activeWorkspace, items: state.activeWorkspace.items.filter(i => i.id !== id) } };
  }),

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTaskStatus: (id, status) => set((state) => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, status } : t) })),
  addMessage: (msg) => {
    const { currentUser } = get();
    if (msg.text.includes(`@${currentUser.name}`)) {
      get().addNotification(`Fuiste mencionado por ${msg.senderName}`, 'mention');
    }
    set((state) => ({ messages: [...state.messages, msg] }));
  },
  addNotification: (message, type = 'info') => set((state) => ({
    notifications: [{ id: Math.random().toString(), message, type, timestamp: Date.now() }, ...state.notifications].slice(0, 5)
  })),
  clearNotifications: () => set({ notifications: [] }),
}));
