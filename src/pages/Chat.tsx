import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import ChatInput from "../components/ChatInput";
import { characters as allCharacters } from "../data/characters";
import classnames from "classnames";

export default function Chat() {
  const { characterId = "" } = useParams();
  const openChat = useAppStore((s) => s.openChat);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const sessions = useAppStore((s) => s.sessionsByCharacterId);
  const currentUser = useAppStore((s) => s.currentUser);
  const modalStates = useAppStore((s) => s.modalStates);
  const activeModal = useAppStore((s) => s.activeModal);
  const setActiveModal = useAppStore((s) => s.setActiveModal);
  const isRegistered = useAppStore((s) => s.isRegistered);
  const globalMessageCount = useAppStore((s) => s.globalMessageCount);

  const character = allCharacters.find((c) => c.id === characterId);
  const modalState = modalStates[characterId];
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
    if (!modalState) return;

    const { messageCount, adViewsToday, isChatLocked } = modalState;

    if (isChatLocked) {
      return;
    }

    if (!isRegistered && globalMessageCount >= 5) {
      setActiveModal("userRegistration", characterId);
    } else if (isRegistered && messageCount >= 10 && adViewsToday < 5) {
      setActiveModal("watchAd", characterId);
    } else if (isRegistered && messageCount >= 10 && adViewsToday >= 5) {
      setActiveModal("endOfChats", characterId);
    }
  }, [modalState, isRegistered, globalMessageCount, setActiveModal, characterId]);


  if (!character) {
    return <div className="page">
      <div className="page__header">Character not found</div>
    </div>;
  }

  const session = sessions[characterId];
  const isBlur = activeModal && session && session.messages.length > 1;

  return (
    <div className="chat">
      <div className="chat__header">
        <img className="avatar" src={character.imageProfileUrl} alt={character.name} />
        <div className="chat__meta">
          <div className="chat__title">{character.name}</div>
          <div className="chat__subtitle">{character.novelTitle} · {character.genre}</div>
        </div>
      </div>

      <div className="chat__messages">
        {session?.messages.map((m, index) => (
          <div
            key={m.id}
            className={classnames(`message-row message-row--${m.sender}`, {
              "is-blurred": isBlur && index === session.messages.length - 1,
            })}
          >
            {m.sender === 'ai' && character && (
              <img src={character.imageIconUrl} alt={character.name} className="avatar avatar--chat" />
            )}
            <div className={`bubble bubble--${m.sender}`}>
              {m.situation && <div className="bubble__situation">{m.situation}</div>}
              <div className="bubble__dialogue">{m.dialogue}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat__input">
        <ChatInput
          characterName={character.name}
          onSend={(text) => sendMessage(characterId, text, currentUser.username)}
          disabled={modalState?.isChatLocked || !!activeModal}
          onUnlockWithAd={() => setActiveModal("actualAd", characterId)}
          isRegistered={isRegistered}
        />
      </div>

      {/* The rest of the modals are rendered globally in App.tsx */}
    </div>
  );
}