export type Sender = "ai" | "user";

export interface Character {
  id: string;
  name: string;
  imageCardUrl: string;
  videoCardUrl?: string;
  imageProfileUrl: string;
  imageIconUrl: string;
  novelTitle: string;
  genre: string;
  keywords: string[];
  likes: number;
  description: string;
  summary: string;
  userPersona: {
    name: string;
    description: string;
    summary: string;
  };
  worldSetting: string;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  dialogue: string;
  situation?: string;
  timestamp: number;
}

export interface ModalState {
  messageCount: number;
  adViewsToday: number;
  lastAdViewDate: string | null;
  isChatLocked: boolean;
}

export interface ChatSession {
  id: string; // session id (local)
  characterId: string;
  messages: ChatMessage[];
  // Backend identifiers (optional)
  backendChatId?: string;
  humanId?: string;
  aiId?: string;
  aiName?: string;
  isTyping?: boolean;
}

export interface UserProfile {
  username: string;
  password: string;
}

// Backend usage/auth types
export interface UsageStatusPayload {
  credits_remaining: number;
  authenticated: boolean;
  ad_min_seconds: number;
  ad_bonus_credits: number;
}

export interface AppState {
  currentUser: UserProfile;
  registeredUsernames: string[]; // 간단한 유니크 검사용
  characters: Character[];
  sessionsByCharacterId: Record<string, ChatSession>;
  openCharacterIds: string[]; // 사이드바에 노출되는 열린 채팅 목록
  sidebarWidth: number;
  modalStates: Record<string, ModalState>;
  activeModal: "userRegistration" | "watchAd" | "endOfChats" | "actualAd" | "signIn" | 'userProfile' | 'characterProfile' | null;
  modalContextCharacterId: string | null;
  isRegistered: boolean;
  globalMessageCount: number;

  // usage/auth state
  anonId?: string | null;
  authToken?: string | null;
  authenticated?: boolean;
  creditsRemaining?: number | null;
  adMinSeconds?: number;
  adBonusCredits?: number;
  usageReady?: boolean; // false until anon+status fetched
  currentAdSessionId?: string | null;
  paymentRequired?: boolean; // true if server indicated payment/credits required

  // actions
  openChat: (characterId: string) => void;
  sendMessage: (characterId: string, inputText: string) => void;
  toggleLike: (characterId: string) => void;
  updateUserProfile: (username: string, password: string) => { ok: true } | { ok: false; reason: string };
  signInUser: (username: string, password: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  setSidebarWidth: (width: number) => void;
  initModalState: (characterId: string) => void;
  setActiveModal: (modal: "userRegistration" | "watchAd" | "endOfChats" | "actualAd" | "signIn" | 'userProfile' | 'characterProfile' | null, characterId?: string) => void;
  handleModalAction: (characterId: string | undefined, action: "register" | "watchAd" | "lockChat") => void;
  resetUserRegistration: () => void;
  resetAdViews: () => void;
  forceUnlock?: (characterId: string) => void;

  // usage/auth actions
  initUsage?: () => Promise<void>;
  refreshUsageStatus?: () => Promise<void>;
  registerUser?: (username: string, password: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  loginUser?: (username: string, password: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  startAd?: () => Promise<{ ok: boolean; adSessionId?: string; reason?: string }>;
  completeAd?: (watchedSeconds: number) => Promise<{ ok: boolean; awarded?: boolean; credits?: number; reason?: string }>;
} 