import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import ReactGA from "react-ga4";
import type { AppState, ChatMessage, UsageStatusPayload } from "../types";
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
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/interface/chat/create_by_id`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_name: userName, character_id: shortCharacterId }),
  });
  if (!res.ok) throw new Error("create chat failed");
  return res.json();
}

async function beSendMessage(payload: { chat_id: string; sender_id?: string; content: string; anon_id?: string }) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (payload.anon_id) headers["X-Anon-Id"] = payload.anon_id;
  const token = localStorage.getItem("auth_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
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

async function beFetchLikes(): Promise<{ likes: Record<string, number>; liked_by_me: Record<string, boolean> }> {
  const anon = await feGetAnonId();
  const res = await fetch(`${API_BASE}/api/interface/likes/status`, {
    headers: { "X-Anon-Id": anon },
  });
  if (!res.ok) return { likes: {}, liked_by_me: {} };
  return res.json();
}

async function beToggleLike(characterId: string): Promise<{ character_id: string; liked_by_me: boolean; likes_count: number }> {
  const anon = await feGetAnonId();
  const res = await fetch(`${API_BASE}/api/interface/likes/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Anon-Id": anon },
    body: JSON.stringify({ character_id: characterId, anon_id: anon }),
  });
  if (!res.ok) throw new Error("toggle like failed");
  return res.json();
}

async function ensureBackendChat(characterId: string, getState: () => AppState, setState: any) {
  const state = getState();
  const session = state.sessionsByCharacterId[characterId];
  const token = localStorage.getItem("auth_token");
  // If we already have a persistent chat (no humanId) or an ephemeral chat and not authenticated, reuse
  if (session?.backendChatId && (!session.humanId || !token)) return session;
  // Otherwise (e.g., we were ephemeral but now authenticated), or no chat yet → create/recreate
  const res = await beCreateChatById(state.currentUser.username, characterId);
  setState((s: AppState) => ({
    sessionsByCharacterId: {
      ...s.sessionsByCharacterId,
      [characterId]: {
        ...s.sessionsByCharacterId[characterId],
        backendChatId: res.chat_id,
        // In persistent flow, these may be undefined
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
      modalStates: {},
      activeModal: null,
      modalContextCharacterId: null,
      isRegistered: false,
      globalMessageCount: 0,

      // New usage/auth state defaults
      anonId: null,
      authToken: localStorage.getItem("auth_token") || null,
      authenticated: false,
      creditsRemaining: null,
      adMinSeconds: 15,
      adBonusCredits: 10,
      usageReady: false,
      currentAdSessionId: null,
      paymentRequired: false,

      // Initialize likes from backend at startup
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      // @ts-ignore
      __initLikesOnce: (async () => {
        try {
          const { liked_by_me } = await beFetchLikes();
          set((s: AppState) => ({
            characters: s.characters.map((c) => {
              const liked = !!liked_by_me[c.id];
              return { ...(c as any), _liked: liked } as any;
            }) as any,
          }));
        } catch {}
      })(),

      // New: init usage/auth and status
      initUsage: async () => {
        const anon = await feGetAnonId();
        set({ anonId: anon });
        try {
          const token = localStorage.getItem("auth_token");
          const headers: Record<string, string> = { "X-Anon-Id": anon };
          if (token) headers["Authorization"] = `Bearer ${token}`;
          const res = await fetch(`${API_BASE}/api/interface/usage/status`, { headers });
          if (res.ok) {
            const data: UsageStatusPayload = await res.json();
            set({
              creditsRemaining: data.credits_remaining,
              authenticated: data.authenticated,
              adMinSeconds: data.ad_min_seconds,
              adBonusCredits: data.ad_bonus_credits,
              usageReady: true,
            });
            ReactGA.event({ category: "Usage", action: "session_init", label: token ? "auth" : anon, value: data.credits_remaining });
          } else {
            set({ usageReady: true, creditsRemaining: 0, authenticated: false });
            ReactGA.event({ category: "Usage", action: "session_init_failed", label: anon });
          }
        } catch {
          set({ usageReady: true, creditsRemaining: 0, authenticated: false });
          ReactGA.event({ category: "Usage", action: "session_init_error", label: anon });
        }
      },

      refreshUsageStatus: async () => {
        const anon = get().anonId || (await feGetAnonId());
        set({ anonId: anon });
        try {
          const token = localStorage.getItem("auth_token");
          const headers: Record<string, string> = { "X-Anon-Id": anon };
          if (token) headers["Authorization"] = `Bearer ${token}`;
          const res = await fetch(`${API_BASE}/api/interface/usage/status`, { headers });
          if (res.ok) {
            const data: UsageStatusPayload = await res.json();
            set({
              creditsRemaining: data.credits_remaining,
              authenticated: data.authenticated,
              adMinSeconds: data.ad_min_seconds,
              adBonusCredits: data.ad_bonus_credits,
            });
          }
        } catch {}
      },

      registerUser: async (username: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => null);
            return { ok: false as const, reason: d?.detail || "Registration failed" };
          }
          // After registration, login to obtain token and pickup signup bonus
          const login = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          if (!login.ok) {
            return { ok: false as const, reason: "Login after registration failed" };
          }
          const tokenPayload = await login.json();
          const token = tokenPayload?.access_token as string | undefined;
          if (token) {
            localStorage.setItem("auth_token", token);
            set({ authToken: token, isRegistered: true });
          }
          // Fetch usage with Authorization to reflect +10 bonus credits
          await get().refreshUsageStatus?.();
          // Force unlock current chat if credits are now available
          try {
            const stateAfter = get();
            const charId = stateAfter.modalContextCharacterId;
            if (charId) {
              await stateAfter.openChat(charId);
              if ((get().creditsRemaining || 0) > 0) {
                const s2 = get();
                const ms = s2.modalStates[charId];
                if (ms) {
                  set({
                    modalStates: {
                      ...s2.modalStates,
                      [charId]: { ...ms, isChatLocked: false, messageCount: 0 },
                    },
                    activeModal: null,
                    paymentRequired: false,
                  });
                } else {
                  set({ activeModal: null, paymentRequired: false });
                }
              }
            } else if ((get().creditsRemaining || 0) > 0) {
              set({ activeModal: null, paymentRequired: false });
            }
          } catch {}
          return { ok: true as const };
        } catch (e) {
          return { ok: false as const, reason: "Network error" };
        }
      },

      loginUser: async (username: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          if (!res.ok) {
            console.log(res);
            const d = await res.json().catch(() => null);
            console.log(d);
            console.log(d?.detail);
            return { ok: false as const, reason: d?.detail || "Invalid username or password." };
          }
          const data = await res.json();
          const token = data?.access_token as string | undefined;
          if (token) {
            localStorage.setItem("auth_token", token);
            set({ authToken: token, isRegistered: true });
          }
          await get().refreshUsageStatus?.();
          return { ok: true as const };
        } catch {
          return { ok: false as const, reason: "Network error" };
        }
      },

      startAd: async () => {
        try {
          const anon = get().anonId || (await feGetAnonId());
          set({ anonId: anon });
          const res = await fetch(`${API_BASE}/api/interface/ad/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Anon-Id": anon },
            body: JSON.stringify({ anon_id: anon }),
          });
          if (!res.ok) return { ok: false as const, reason: "Failed to start ad" };
          const data = await res.json();
          set({ currentAdSessionId: data.ad_session_id, adMinSeconds: data.ad_min_seconds });
          ReactGA.event({ category: "Ad", action: "start", label: data.ad_session_id });
          return { ok: true as const, adSessionId: data.ad_session_id };
        } catch {
          return { ok: false as const, reason: "Network error" };
        }
      },

      completeAd: async (watchedSeconds: number) => {
        try {
          const adId = get().currentAdSessionId;
          if (!adId) return { ok: false as const, reason: "No ad session" };
          const res = await fetch(`${API_BASE}/api/interface/ad/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ad_session_id: adId, watched_seconds: watchedSeconds }),
          });
          if (!res.ok) return { ok: false as const, reason: "Failed to complete ad" };
          const data = await res.json();
          // Optimistically set credits from response for immediate UI update
          if (typeof data.credits_remaining === "number") {
            set({ creditsRemaining: data.credits_remaining, paymentRequired: false });
          }
          await get().refreshUsageStatus?.();
          set({ currentAdSessionId: null });
          // Force unlock if we now have credits
          if ((get().creditsRemaining || 0) > 0) {
            const charId = get().modalContextCharacterId;
            if (charId) {
              const s = get();
              const ms = s.modalStates[charId];
              if (ms) {
                set({
                  modalStates: {
                    ...s.modalStates,
                    [charId]: { ...ms, isChatLocked: false, messageCount: 0 },
                  },
                  activeModal: null,
                  paymentRequired: false,
                });
              } else {
                set({ activeModal: null, paymentRequired: false });
              }
            } else {
              set({ activeModal: null, paymentRequired: false });
            }
          }
          ReactGA.event({ category: "Ad", action: "complete", label: adId, value: watchedSeconds });
          return { ok: true as const, awarded: !!data.awarded, credits: data.credits_remaining };
        } catch {
          return { ok: false as const, reason: "Network error" };
        }
      },

      setActiveModal: (modal, characterId) => set({ 
        activeModal: modal,
        modalContextCharacterId: characterId || null,
      }),

      initModalState: (characterId) => {
        const state = get();
        if (state.modalStates[characterId]) return;

        set((s) => ({
          modalStates: {
            ...s.modalStates,
            [characterId]: {
              messageCount: 0,
              adViewsToday: 0,
              lastAdViewDate: null,
              isChatLocked: false,
            },
          },
        }));
      },

      openChat: async (characterId) => {
        const state = get();
        state.initModalState(characterId);
        if (!state.usageReady) {
          await get().initUsage?.();
        } else {
          // Keep status fresh when entering chats
          get().refreshUsageStatus?.();
        }

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
          try {
            const res = await beCreateChatById(get().currentUser.username, characterId);
            set((s) => ({
              sessionsByCharacterId: {
                ...s.sessionsByCharacterId,
                [characterId]: {
                  ...s.sessionsByCharacterId[characterId],
                  backendChatId: res.chat_id,
                  humanId: res.human_player_id,
                  aiId: res.ai_player_id,
                  aiName: res.ai_name,
                  messages: res.messages?.length
                    ? res.messages.map((m: any) => ({
                        id: m.id,
                        sender: m.sender_id?.startsWith("ai_") ? "ai" : "ai",
                        dialogue: m.content,
                        situation: undefined,
                        timestamp: Date.now(),
                      }))
                    : messages,
                },
              },
            }));
          } catch {}
        }
        set((s) => ({
          openCharacterIds: s.openCharacterIds.includes(characterId)
            ? s.openCharacterIds
            : [characterId, ...s.openCharacterIds].slice(0, 12),
        }));
      },

      sendMessage: async (characterId, inputText) => {
        const state = get();
        const session = state.sessionsByCharacterId[characterId];
        if (!session) return;

        // Gate by credits: if not ready or no credits, block immediately
        const credits = state.creditsRemaining ?? 0;
        if (!state.usageReady || credits <= 0) {
          // Surface modal UX depending on registration state
          if (!state.isRegistered) {
            state.setActiveModal("userRegistration", characterId);
          } else {
            state.setActiveModal("watchAd", characterId);
          }
          return;
        }

        const { dialogue, situation } = parseInputToParts(inputText);
        if (!dialogue && !situation) return;

        const userMsg: ChatMessage = {
          id: nanoid(),
          sender: "user",
          dialogue: dialogue || "(대사 없음)",
          situation,
          timestamp: Date.now(),
        };

        set((s) => ({
          sessionsByCharacterId: {
            ...s.sessionsByCharacterId,
            [characterId]: {
              ...s.sessionsByCharacterId[characterId],
              messages: [...s.sessionsByCharacterId[characterId].messages, userMsg],
              isTyping: true,
            },
          },
          modalStates: {
            ...s.modalStates,
            [characterId]: {
              ...s.modalStates[characterId],
              messageCount: (s.modalStates[characterId]?.messageCount || 0) + 1,
            },
          },
          globalMessageCount: get().isRegistered ? s.globalMessageCount : s.globalMessageCount + 1,
        }));

        let ensured = session;
        try {
          ensured = await ensureBackendChat(characterId, get, set);
        } catch {}

        const anon_id = state.anonId || (await feGetAnonId());
        set({ anonId: anon_id });
        const payload = {
          chat_id: ensured.backendChatId || ensured.id,
          sender_id: ensured.humanId,
          content: dialogue + (situation ? `\n\n**SITUATION:** ${situation}` : ""),
          anon_id,
          character_id: characterId,
        } as any;

        try {
          const res = await beSendMessage(payload);
          const ai = res.ai_message;
          // Update credits after successful send (server already consumed)
          if (typeof res.credits_remaining === "number") {
            set({ creditsRemaining: res.credits_remaining, paymentRequired: false });
          } else {
            get().refreshUsageStatus?.();
            set({ paymentRequired: false });
          }
          // Ensure backend chat id stays consistent (server may have switched flows after auth)
          if (res.user_message?.chat_id && (!session.backendChatId || session.backendChatId !== res.user_message.chat_id)) {
            set((s) => ({
              sessionsByCharacterId: {
                ...s.sessionsByCharacterId,
                [characterId]: { ...s.sessionsByCharacterId[characterId], backendChatId: res.user_message.chat_id },
              },
            }));
          }
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
          } else {
            set((s) => ({
              sessionsByCharacterId: {
                ...s.sessionsByCharacterId,
                [characterId]: { ...s.sessionsByCharacterId[characterId], isTyping: false },
              },
            }));
          }
        } catch (err: any) {
          if (err?.status === 404) {
            try {
              const refreshed = await ensureBackendChat(characterId, get, set);
              // Update payload chat_id for retry
              const retryPayload = { ...payload, chat_id: refreshed.backendChatId || refreshed.id, sender_id: refreshed.humanId };
              const retry = await beSendMessage(retryPayload as any);
              const ai = retry.ai_message;
              if (typeof retry.credits_remaining === "number") set({ creditsRemaining: retry.credits_remaining });
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
              set((s) => ({
                sessionsByCharacterId: {
                  ...s.sessionsByCharacterId,
                  [characterId]: { ...s.sessionsByCharacterId[characterId], isTyping: false },
                },
              }));
            } catch {
              set((s) => ({
                sessionsByCharacterId: {
                  ...s.sessionsByCharacterId,
                  [characterId]: { ...s.sessionsByCharacterId[characterId], isTyping: false },
                },
              }));
            }
          } else if (err?.status === 402 && err?.detail?.error === "insufficient_credits") {
            set({ creditsRemaining: 0, paymentRequired: true });
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
            if (!get().isRegistered) {
              get().setActiveModal("userRegistration", characterId);
            } else {
              get().setActiveModal("watchAd", characterId);
            }
          } else {
            const charMeta = state.characters.find((c) => c.id === characterId)!;
            const aiMsg: ChatMessage = {
              id: nanoid(),
              sender: "ai",
              dialogue: `${charMeta.name}: ${dialogue || "..."}`,
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

      handleModalAction: (characterId, action) => {
        const state = get();
        if (!characterId) return;
        const modalState = state.modalStates[characterId];

        const today = new Date().toISOString().split("T")[0];

        switch (action) {
          case "register":
            set((s) => ({
              isRegistered: true,
              globalMessageCount: 0,
              activeModal: null,
              paymentRequired: false,
              modalStates: {
                ...s.modalStates,
                [characterId]: {
                  ...s.modalStates[characterId],
                  messageCount: 0,
                  isChatLocked: false,
                },
              },
            }));
            get().refreshUsageStatus?.();
            break;
          case "watchAd":
            if (modalState.lastAdViewDate !== today) {
              modalState.adViewsToday = 0;
            }
            if (modalState.adViewsToday < 5) {
              set((s) => ({
                modalStates: {
                  ...s.modalStates,
                  [characterId]: {
                    ...modalState,
                    adViewsToday: modalState.adViewsToday + 1,
                    lastAdViewDate: today,
                    messageCount: 0,
                    isChatLocked: false,
                  },
                },
                activeModal: null,
                paymentRequired: false,
              }));
            }
            // Credits will come from backend completeAd; refresh to be safe
            get().refreshUsageStatus?.();
            break;
          case "lockChat":
            if (!modalState) return;
            set((s) => ({
              modalStates: {
                ...s.modalStates,
                [characterId]: {
                  ...modalState,
                  isChatLocked: true,
                },
              },
              activeModal: null,
            }));
            break;
        }
      },

      toggleLike: (characterId) => {
        const prev = get().characters;
        const next = prev.map((c) => {
          if (c.id !== characterId) return c as any;
          const liked = !!(c as any)._liked;
          const delta = liked ? -1 : 1;
          return { ...(c as any), likes: Math.max(0, (c.likes || 0) + delta), _liked: !liked } as any;
        }) as any;
        set({ characters: next });
        beToggleLike(characterId).then((res) => {
          set((s) => ({
            characters: s.characters.map((c) =>
              c.id === characterId ? { ...(c as any), likes: res.likes_count, _liked: res.liked_by_me } as any : c
            ) as any,
          }));
        }).catch(() => {
          set({ characters: prev as any });
        });
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

      signInUser: async (username: string, password: string) => {
        try {
          // Call backend login API to verify credentials
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            return { ok: false as const, reason: errorData?.detail || "Login failed" };
          }
          
          const data = await res.json();
          const token = data?.access_token;
          
          if (token) {
            localStorage.setItem("auth_token", token);
            set({ 
              authToken: token, 
              isRegistered: true, 
              activeModal: null, 
              modalContextCharacterId: null,
              currentUser: { username, password }
            });
            
            // Refresh usage status after successful login
            await get().refreshUsageStatus?.();
            
            return { ok: true as const };
          } else {
            return { ok: false as const, reason: "No access token received" };
          }
        } catch (error) {
          console.error("Login error:", error);
          return { ok: false as const, reason: "Network error during login" };
        }
      },
      
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      resetUserRegistration: () => {
        set({
          isRegistered: false,
          globalMessageCount: 0,
          sessionsByCharacterId: {},
          modalStates: {},
          activeModal: null,
          authToken: null,
          authenticated: false,
          creditsRemaining: null,
          paymentRequired: false,
        });
        localStorage.removeItem("auth_token");
      },

      resetAdViews: () => {
        set((s) => {
          const newModalStates = { ...s.modalStates };
          for (const charId in newModalStates) {
            newModalStates[charId] = {
              ...newModalStates[charId],
              adViewsToday: 0,
              lastAdViewDate: null,
            };
          }
          return { modalStates: newModalStates };
        });
      },
    }),
    {
      name: "aichat-store-v2",
      partialize: (state) => ({
        currentUser: state.currentUser,
        registeredUsernames: state.registeredUsernames,
        characters: state.characters,
        sessionsByCharacterId: state.sessionsByCharacterId,
        openCharacterIds: state.openCharacterIds,
        sidebarWidth: state.sidebarWidth,
        modalStates: state.modalStates,
        activeModal: state.activeModal,
        isRegistered: state.isRegistered,
        globalMessageCount: state.globalMessageCount,
        // Persist usage bits so reload doesn't reset UX
        anonId: state.anonId,
        authToken: state.authToken,
        creditsRemaining: state.creditsRemaining,
        authenticated: state.authenticated,
        adMinSeconds: state.adMinSeconds,
        adBonusCredits: state.adBonusCredits,
      }),
    }
  )
); 