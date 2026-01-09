
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERADOR = 'moderador',
  MIEMBRO = 'miembro',
  INVITADO = 'invitado'
}

export enum PresenceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  AWAY = 'away',
  DND = 'dnd'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export type ThemeType = 'dark' | 'light' | 'space' | 'arcade';

export interface AvatarConfig {
  skinColor: string;
  clothingColor: string;
  hairColor: string;
  accessory: 'none' | 'glasses' | 'hat' | 'headphones';
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  avatarConfig?: AvatarConfig;
  x: number;
  y: number;
  direction: 'front' | 'left' | 'right' | 'back';
  isMoving?: boolean;
  isSitting?: boolean;
  isOnline: boolean;
  isPrivate?: boolean;
  isMicOn?: boolean;
  isCameraOn?: boolean;
  isScreenSharing?: boolean;
  speechBubble?: { text: string; timestamp: number };
  cargo?: string;
  departamento?: string;
  status: PresenceStatus;
}

export interface Departamento {
  id: string;
  nombre: string;
  descripcion?: string;
  color: string;
  icono: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug?: string;
  width: number;
  height: number;
  items: SpaceItem[];
  descripcion?: string;
  userRole?: Role; 
}

export interface SpaceItem {
  id: string;
  type: 'table' | 'chair' | 'plant' | 'sofa' | 'gamer_chair' | 'office_desk' | 'pc_setup' | 'vending_machine' | 'whiteboard' | 'water_cooler' | 'tv' | 'rug' | 'lamp' | 'bookshelf';
  x: number;
  y: number;
  rotation?: number;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  attachments?: Attachment[];
}

export interface ChatGroup {
  id: string;
  espacio_id: string;
  nombre: string;
  descripcion?: string;
  tipo: 'publico' | 'privado';
  icono: string;
  color?: string;
  creado_por: string;
}

export interface ChatMessage {
  id: string;
  grupo_id: string;
  usuario_id: string;
  contenido: string;
  tipo: 'texto' | 'imagen' | 'archivo' | 'sistema';
  creado_en: string;
  usuario?: {
    id: string;
    nombre: string;
    avatar_url?: string;
  };
}
