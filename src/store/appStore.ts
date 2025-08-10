import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import ReactGA from "react-ga4";
import type { AppState, ChatMessage } from "../types";
import { characters as seedCharacters } from "../data/characters";

function randomUsername() {
  return `user_${Math.random().toString(36).slice(2, 8)}`;
}

function parseInputToParts(inputText: string) {
  const delimiter = "**";
  const hasDelimiter = inputText.includes(delimiter);
  if (!hasDelimiter) {
    return { dialogue: inputText.trim(), situation: undefined as string | undefined };
  }
  const [dialogueRaw, situationRaw] = inputText.split(delimiter, 2);
  const dialogue = dialogueRaw.trim();
  const situation = situationRaw?.trim() || undefined;
  return { dialogue, situation };
}

function createInitialAiGreeting(characterId: string): ChatMessage {
  const character = seedCharacters.find((c) => c.id === characterId)!;
  return {
    id: nanoid(),
    sender: "ai",
    dialogue: `Hello from ${character.name}! It's a pleasure to meet you.`,
    situation: `First encounter in the world of '${character.novelTitle}'.`,
    timestamp: Date.now(),
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: { username: randomUsername(), password: "" },
      registeredUsernames: [],
      characters: seedCharacters,
      sessionsByCharacterId: {},
      openCharacterIds: [],
      sidebarWidth: 270,

      openChat: (characterId) => {
        const state = get();
        const exists = state.sessionsByCharacterId[characterId];
        if (!exists) {
          const sessionId = nanoid();
          const messages: ChatMessage[] = [createInitialAiGreeting(characterId)];
          set((s) => ({
            sessionsByCharacterId: {
              ...s.sessionsByCharacterId,
              [characterId]: { id: sessionId, characterId, messages },
            },
          }));
        }
        set((s) => ({
          openCharacterIds: s.openCharacterIds.includes(characterId)
            ? s.openCharacterIds
            : [characterId, ...s.openCharacterIds].slice(0, 12),
        }));
      },

      sendMessage: (characterId, inputText, username) => {
        const state = get();
        const session = state.sessionsByCharacterId[characterId];
        if (!session) return;
        const { dialogue, situation } = parseInputToParts(inputText);
        if (!dialogue && !situation) return;

        console.log(`Sending message to ${characterId} from ${username}:`, { dialogue, situation });

        const userMsg: ChatMessage = {
          id: nanoid(),
          sender: "user",
          dialogue: dialogue || "(대사 없음)",
          situation,
          timestamp: Date.now(),
        };

        const character = state.characters.find((c) => c.id === characterId)!;
        // 단순한 더미 응답 생성
        const aiMsg: ChatMessage = {
          id: nanoid(),
          sender: "ai",
          dialogue: `${character.name}: My thoughts on "${dialogue || "..."}"... how interesting!`,
          situation: situation ? `I understand the situation: ${situation}` : undefined,
          timestamp: Date.now() + 1,
        };

        set((s) => ({
          sessionsByCharacterId: {
            ...s.sessionsByCharacterId,
            [characterId]: {
              ...s.sessionsByCharacterId[characterId],
              messages: [...s.sessionsByCharacterId[characterId].messages, userMsg, aiMsg],
            },
          },
        }));
      },

      toggleLike: (characterId) => {
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === characterId ? { ...c, likes: c.likes + (1 * (c as any)._liked ? -1 : 1), _liked: !(c as any)._liked } as any : c
          ) as any,
        }));
      },

      updateUserProfile: (username, password) => {
        const state = get();
        const current = state.currentUser.username;
        const names = new Set(state.registeredUsernames);
        // 현재 유저명을 제외하고 유니크 검사
        if (username !== current && names.has(username)) {
          return { ok: false as const, reason: "This username is already taken." };
        }
        if (!username.trim()) {
          return { ok: false as const, reason: "Please enter a username." };
        }
        if (!password.trim()) {
          return { ok: false as const, reason: "Please enter a password." };
        }
        names.add(username);
        // 이전 이름은 목록에 남겨둘 수 있지만, 간단히 제거 후 현재만 등록
        names.delete(current);
        set({ currentUser: { username, password }, registeredUsernames: Array.from(names) });
        
        // GA User ID 업데이트
        ReactGA.set({ userId: username });
        ReactGA.event({
          category: "Profile",
          action: "save_profile_changes",
          label: username,
        });

        return { ok: true as const };
      },
      
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
    }),
    {
      name: "aichat-store",
      partialize: (state) => ({
        currentUser: state.currentUser,
        registeredUsernames: state.registeredUsernames,
        characters: state.characters,
        sessionsByCharacterId: state.sessionsByCharacterId,
        openCharacterIds: state.openCharacterIds,
        sidebarWidth: state.sidebarWidth,
      }),
    }
  )
); 