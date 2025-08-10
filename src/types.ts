export type Sender = "ai" | "user";

export interface Character {
  id: string;
  name: string;
  imageCardUrl: string;
  imageProfileUrl: string;
  imageIconUrl: string;
  novelTitle: string;
  genre: string;
  keywords: string[];
  likes: number;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  dialogue: string;
  situation?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string; // session id
  characterId: string;
  messages: ChatMessage[];
}

export interface UserProfile {
  username: string;
  password: string;
}

export interface AppState {
  currentUser: UserProfile;
  registeredUsernames: string[]; // 간단한 유니크 검사용
  characters: Character[];
  sessionsByCharacterId: Record<string, ChatSession>;
  openCharacterIds: string[]; // 사이드바에 노출되는 열린 채팅 목록
  sidebarWidth: number;

  // actions
  openChat: (characterId: string) => void;
  sendMessage: (characterId: string, inputText: string, sender: string) => void;
  toggleLike: (characterId: string) => void;
  updateUserProfile: (username: string, password: string) => { ok: true } | { ok: false; reason: string };
  setSidebarWidth: (width: number) => void;
} 