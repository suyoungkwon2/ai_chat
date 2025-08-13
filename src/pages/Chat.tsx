import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import ChatInput from "../components/ChatInput";
import classnames from "classnames";
import FormattedMessage from "../components/FormattedMessage";
import ReactGA from "react-ga4";

export default function Chat() {
  const { characterId = "" } = useParams();
  const openChat = useAppStore((s) => s.openChat);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const sessions = useAppStore((s) => s.sessionsByCharacterId);
  const modalStates = useAppStore((s) => s.modalStates);
  const activeModal = useAppStore((s) => s.activeModal);
  const setActiveModal = useAppStore((s) => s.setActiveModal);
  const isRegistered = useAppStore((s) => s.isRegistered);
  const globalMessageCount = useAppStore((s) => s.globalMessageCount);
  const characters = useAppStore((s) => s.characters);
  const creditsRemaining = useAppStore((s) => s.creditsRemaining ?? 0);
  const usageReady = useAppStore((s) => s.usageReady ?? false);

  const character = characters.find((c) => c.id === characterId);
  const modalState = modalStates[characterId];
  const session = sessions[characterId];
  const userMessageCount = session?.messages.filter(m => m.sender === 'user').length ?? 0;
  const isAiTyping = !!session?.isTyping;
  const isCreditBlocked = !usageReady || (creditsRemaining <= 0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (characterId) openChat(characterId);
  }, [characterId, openChat]);

  useEffect(() => {
    scrollToBottom();
  }, [sessions[characterId]?.messages]);

  useEffect(() => {
    // This effect handles tracking when a user leaves the chat page.
    // It's crucial for understanding user drop-off points.
    return () => {
      const { activeModal, sessionsByCharacterId } = useAppStore.getState();
      const session = sessionsByCharacterId[characterId];
      const userMessageCount =
        session?.messages.filter((m) => m.sender === "user").length ?? 0;

      // We define "exit modals" as modals that effectively end the chat session.
      // If one of these is active when the user leaves, we assume the modal's own
      // event is sufficient, and we don't fire the 'leave_chat' event to avoid double-counting.
      const exitModals: (string | null)[] = [
        "userRegistration",
        "watchAd",
        "actualAd",
        "endOfChats",
      ];

      if (!exitModals.includes(activeModal)) {
        ReactGA.event({
          category: "Chat",
          action: "leave_chat",
          label: characterId,
          value: userMessageCount,
        });
      }
    };
  }, [characterId]);

  useEffect(() => {
    if (!modalState) return;

    const { messageCount, adViewsToday, isChatLocked } = modalState;

    if (isChatLocked) {
      return;
    }

    if (!isRegistered && globalMessageCount >= 5) {
      setActiveModal("userRegistration", characterId);
      ReactGA.event({ category: "Gating", action: "show_signup_modal", label: characterId });
    } else if (isRegistered && messageCount >= 10 && adViewsToday < 5) {
      setActiveModal("watchAd", characterId);
      ReactGA.event({
        category: "Gating",
        action: "show_ad_modal",
        label: characterId,
        value: adViewsToday + 1,
      });
    } else if (isRegistered && messageCount >= 10 && adViewsToday >= 5) {
      setActiveModal("endOfChats", characterId);
      ReactGA.event({ category: "Gating", action: "show_end_modal", label: characterId, value: messageCount });
    }
  }, [modalState, isRegistered, globalMessageCount, setActiveModal, characterId]);

  const handleSeeProfile = () => {
    setActiveModal('characterProfile', characterId);
    ReactGA.event({
      category: "Engagement",
      action: "click_see_profile_chat",
      label: character?.name,
    });
  };

  if (!character) {
    return <div className="page">
      <div className="page__header">Character not found</div>
    </div>;
  }

  const isBlur = activeModal && session && session.messages.length > 1;
  const paymentRequired = useAppStore((s) => s.paymentRequired ?? false);
  const isInputDisabled = (modalState?.isChatLocked || !!activeModal || isAiTyping || isCreditBlocked || paymentRequired);
  const disabledPlaceholder = isAiTyping
    ? `${character.name} is replying...`
    : (paymentRequired
        ? "Payment required. Please sign up or watch an ad to continue."
        : (isCreditBlocked ? "Out of credits. Sign up or watch a 15s ad to continue." : undefined));

  return (
    <div className="chat">
      <div className="chat__header">
        <div className="chat__header-left">
          <img className="avatar" src={character.imageProfileUrl} alt={character.name} />
          <div className="chat__meta">
            <div className="chat__title">{character.name}</div>
            <div className="chat__subtitle">{character.novelTitle} · {character.genre}</div>
          </div>
        </div>
        <button className="btn btn--text" onClick={handleSeeProfile}>
          See Profile
        </button>
      </div>

      <div className="chat__messages">
        {session?.messages.map((m, index) => {
          if (m.sender === "user") {
            return (
              <div
                key={m.id}
                className={classnames("message-row message-row--user", {
                  "is-blurred": isBlur && index === session.messages.length - 1,
                })}
              >
                <div className="bubble bubble--user">
                  <FormattedMessage text={m.dialogue} />
                </div>
              </div>
            );
          }

          // AI Message
          return (
            <div
              key={m.id}
              className={classnames("message-row message-row--ai", {
                "is-blurred": isBlur && index === session.messages.length - 1,
              })}
            >
              {character && (
                <img
                  src={character.imageIconUrl}
                  alt={character.name}
                  className="avatar avatar--chat"
                />
              )}
              <div className="bubble bubble--ai">
                {m.situation && (
                  <div className="bubble__situation">{m.situation}</div>
                )}
                {m.dialogue && (
                  <div className="bubble__dialogue">
                    <FormattedMessage text={m.dialogue} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* Typing indicator */}
        {session?.isTyping && (
          <div className="message-row message-row--ai">
            {character && (
              <img
                src={character.imageIconUrl}
                alt={character.name}
                className="avatar avatar--chat"
              />
            )}
            <div className="bubble bubble--ai">
              <div className="typing">
                {character.name} is typing
                <span className="typing__dots" aria-hidden>
                  <span className="typing__dot"></span>
                  <span className="typing__dot"></span>
                  <span className="typing__dot"></span>
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat__input">
        <ChatInput
          characterName={character.name}
          onSend={(text) => sendMessage(characterId, text)}
          disabled={isInputDisabled}
          disabledPlaceholder={disabledPlaceholder}
          onUnlockWithAd={isCreditBlocked ? () => setActiveModal("watchAd", characterId) : undefined}
          isRegistered={isRegistered}
          userMessageCount={userMessageCount}
        />
      </div>

      {/* The rest of the modals are rendered globally in App.tsx */}
    </div>
  );
}