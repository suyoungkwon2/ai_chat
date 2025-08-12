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

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:8000";

async function feGetAnonId(): Promise<string> {
  let anon = localStorage.getItem("anon_id") || "";
  try {
    const res = await fetch(`${API_BASE}/api/interface/guest/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anon_id: anon || undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.anon_id) {
        anon = data.anon_id;
        localStorage.setItem("anon_id", anon);
      }
    }
  } catch {}
  if (!anon) {
    anon = `anon_${nanoid(10)}`;
    localStorage.setItem("anon_id", anon);
  }
  return anon;
}

async function beCreateChatById(userName: string, shortCharacterId: string) {
  const res = await fetch(`${API_BASE}/api/interface/chat/create_by_id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_name: userName, character_id: shortCharacterId }),
  });
  if (!res.ok) throw new Error("create chat failed");
  return res.json();
}

async function beSendMessage(payload: { chat_id: string; sender_id?: string; content: string; anon_id?: string }) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (payload.anon_id) headers["X-Anon-Id"] = payload.anon_id;
  const res = await fetch(`${API_BASE}/api/interface/chat/send`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const err: any = new Error("send failed");
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return res.json();
}

async function ensureBackendChat(characterId: string, getState: () => AppState, setState: any) {
  const state = getState();
  const session = state.sessionsByCharacterId[characterId];
  if (session?.backendChatId && session.humanId) return session;
  const res = await beCreateChatById(state.currentUser.username, characterId);
  setState((s: AppState) => ({
    sessionsByCharacterId: {
      ...s.sessionsByCharacterId,
      [characterId]: {
        ...s.sessionsByCharacterId[characterId],
        backendChatId: res.chat_id,
        humanId: res.human_player_id,
        aiId: res.ai_player_id,
        aiName: res.ai_name,
        messages: res.messages?.length
          ? [
              ...s.sessionsByCharacterId[characterId].messages,
              ...res.messages.map((m: any) => ({
                id: m.id,
                sender: "ai",
                dialogue: m.content,
                situation: undefined,
                timestamp: Date.now(),
              })),
            ]
          : s.sessionsByCharacterId[characterId].messages,
      },
    },
  }));
  return getState().sessionsByCharacterId[characterId];
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

      openChat: async (characterId) => {
        const state = get();
        const exists = state.sessionsByCharacterId[characterId];
        if (!exists) {
          const sessionId = nanoid();
          const messages: ChatMessage[] = [createInitialAiGreeting(characterId)];
          set((s) => ({
            sessionsByCharacterId: {
              ...s.sessionsByCharacterId,
              [characterId]: { id: sessionId, characterId, messages, isTyping: false },
            },
          }));
          // Kick off backend chat creation
          const character = state.characters.find((c) => c.id === characterId)!;
          try {
            const res = await beCreateChatById(get().currentUser.username, characterId);
            set((s) => ({
              sessionsByCharacterId: {
                ...s.sessionsByCharacterId,
                [characterId]: {
                  ...s.sessionsByCharacterId[characterId],
                  backendChatId: res.chat_id,
                  humanId: res.human_player_id, // absent for persistent flow; okay
                  aiId: res.ai_player_id,
                  aiName: res.ai_name,
                  messages: res.messages?.length
                    ? res.messages.map((m: any) => ({
                        id: m.id,
                        sender: m.sender_id?.startsWith("ai_") ? "ai" : "ai", // greeting is AI
                        dialogue: m.content,
                        situation: undefined,
                        timestamp: Date.now(),
                      }))
                    : messages,
                },
              },
            }));
          } catch (e) {
            // ignore; user can still chat with fallback template
          }
        }
        set((s) => ({
          openCharacterIds: s.openCharacterIds.includes(characterId)
            ? s.openCharacterIds
            : [characterId, ...s.openCharacterIds].slice(0, 12),
        }));
      },

      sendMessage: async (characterId, inputText, username) => {
        const state = get();
        const session = state.sessionsByCharacterId[characterId];
        if (!session) return;
        const { dialogue, situation } = parseInputToParts(inputText);
        if (!dialogue && !situation) return;

        const userMsg: ChatMessage = {
          id: nanoid(),
          sender: "user",
          dialogue: dialogue || "(대사 없음)",
          situation,
          timestamp: Date.now(),
        };

        // optimistic update + set typing on
        set((s) => ({
          sessionsByCharacterId: {
            ...s.sessionsByCharacterId,
            [characterId]: {
              ...s.sessionsByCharacterId[characterId],
              messages: [...s.sessionsByCharacterId[characterId].messages, userMsg],
              isTyping: true,
            },
          },
        }));

        // ensure backend chat exists before sending (handles race and server restarts)
        let ensured = session;
        try {
          ensured = await ensureBackendChat(characterId, get, set);
        } catch {}

        // backend send
        const anon_id = await feGetAnonId();
        const payload = {
          chat_id: ensured.backendChatId || ensured.id,
          sender_id: ensured.humanId, // in-memory flow uses this, persistent ignores
          content: dialogue + (situation ? `\n\n**SITUATION:** ${situation}` : ""),
          anon_id,
          character_id: characterId,
        };

        try {
          const res = await beSendMessage(payload);
          const ai = res.ai_message;
          const creditsRemaining = res.credits_remaining;
          if (ai) {
            // parse structured output if present
            const text: string = ai.content || "";
            const parsed = (() => {
              const sit = (text.match(/\*\*SITUATION:\*\*([\s\S]*?)\n\s*\*\*DIALOGUE:\*\*/i)?.[1] || "").trim();
              const dia = (text.match(/\*\*DIALOGUE:\*\*\s*"?([\s\S]*?)\n\s*\*\*AFFECTION LEVEL:\*\*/i)?.[1] || text).trim();
              return { situation: sit || undefined, dialogue: dia.replace(/^"|"$/g, "") };
            })();
            const aiMsg: ChatMessage = {
              id: ai.id || nanoid(),
              sender: "ai",
              dialogue: parsed.dialogue,
              situation: parsed.situation,
              timestamp: Date.now(),
            };
            set((s) => ({
              sessionsByCharacterId: {
                ...s.sessionsByCharacterId,
                [characterId]: {
                  ...s.sessionsByCharacterId[characterId],
                  messages: [...s.sessionsByCharacterId[characterId].messages, aiMsg],
                  isTyping: false,
                },
              },
            }));
          } else {
            // no ai payload; still turn off typing
            set((s) => ({
              sessionsByCharacterId: {
                ...s.sessionsByCharacterId,
                [characterId]: { ...s.sessionsByCharacterId[characterId], isTyping: false },
              },
            }));
          }
          // creditsRemaining can be shown in UI later
        } catch (err: any) {
          // if server lost in-memory chat (e.g., restarted), recreate and retry once
          if (err?.status === 404) {
            try {
              const refreshed = await ensureBackendChat(characterId, get, set);
              const retry = await beSendMessage({ ...payload, chat_id: refreshed.backendChatId || refreshed.id, sender_id: refreshed.humanId });
              const ai = retry.ai_message;
              if (ai) {
                const text: string = ai.content || "";
                const parsed = (() => {
                  const sit = (text.match(/\*\*SITUATION:\*\*([\s\S]*?)\n\s*\*\*DIALOGUE:\*\*/i)?.[1] || "").trim();
                  const dia = (text.match(/\*\*DIALOGUE:\*\*\s*"?([\s\S]*?)\n\s*\*\*AFFECTION LEVEL:\*\*/i)?.[1] || text).trim();
                  return { situation: sit || undefined, dialogue: dia.replace(/^"|"$/g, "") };
                })();
                const aiMsg: ChatMessage = {
                  id: ai.id || nanoid(),
                  sender: "ai",
                  dialogue: parsed.dialogue,
                  situation: parsed.situation,
                  timestamp: Date.now(),
                };
                set((s) => ({
                  sessionsByCharacterId: {
                    ...s.sessionsByCharacterId,
                    [characterId]: {
                      ...s.sessionsByCharacterId[characterId],
                      messages: [...s.sessionsByCharacterId[characterId].messages, aiMsg],
                      isTyping: false,
                    },
                  },
                }));
                return;
              }
              // no ai even on retry, stop typing
              set((s) => ({
                sessionsByCharacterId: {
                  ...s.sessionsByCharacterId,
                  [characterId]: { ...s.sessionsByCharacterId[characterId], isTyping: false },
                },
              }));
            } catch {
              // stop typing on failure
              set((s) => ({
                sessionsByCharacterId: {
                  ...s.sessionsByCharacterId,
                  [characterId]: { ...s.sessionsByCharacterId[characterId], isTyping: false },
                },
              }));
            }
          } else if (err?.status === 402 && err?.detail?.error === "insufficient_credits") {
            const aiMsg: ChatMessage = {
              id: nanoid(),
              sender: "ai",
              dialogue: "You are out of free messages. Please sign up or watch a 15s ad to continue.",
              situation: undefined,
              timestamp: Date.now(),
            };
            set((s) => ({
              sessionsByCharacterId: {
                ...s.sessionsByCharacterId,
                [characterId]: {
                  ...s.sessionsByCharacterId[characterId],
                  messages: [...s.sessionsByCharacterId[characterId].messages, aiMsg],
                  isTyping: false,
                },
              },
            }));
          } else {
            // fallback local template if backend failed
            const character = state.characters.find((c) => c.id === characterId)!;
            const aiMsg: ChatMessage = {
              id: nanoid(),
              sender: "ai",
              dialogue: `${character.name}: ${dialogue || "..."}`,
              situation: situation ? `I understand the situation: ${situation}` : undefined,
              timestamp: Date.now() + 1,
            };
            set((s) => ({
              sessionsByCharacterId: {
                ...s.sessionsByCharacterId,
                [characterId]: {
                  ...s.sessionsByCharacterId[characterId],
                  messages: [...s.sessionsByCharacterId[characterId].messages, aiMsg],
                  isTyping: false,
                },
              },
            }));
          }
        }
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
        names.delete(current);
        set({ currentUser: { username, password }, registeredUsernames: Array.from(names) });
        ReactGA.set({ userId: username });
        ReactGA.event({ category: "Profile", action: "save_profile_changes", label: username });
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