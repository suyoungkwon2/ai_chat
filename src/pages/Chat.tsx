import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import ChatInput from "../components/ChatInput";
import { characters as allCharacters } from "../data/characters";

export default function Chat() {
  const { characterId = "" } = useParams();
  const openChat = useAppStore((s) => s.openChat);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const sessions = useAppStore((s) => s.sessionsByCharacterId);

  const character = allCharacters.find((c) => c.id === characterId);

  useEffect(() => {
    if (characterId) openChat(characterId);
  }, [characterId, openChat]);

  if (!character) {
    return <div className="page">
      <div className="page__header">존재하지 않는 캐릭터</div>
    </div>;
  }

  const session = sessions[characterId];

  return (
    <div className="chat">
      <div className="chat__header">
        <img className="avatar" src={character.imageUrl} alt={character.name} />
        <div className="chat__meta">
          <div className="chat__title">{character.name}</div>
          <div className="chat__subtitle">{character.novelTitle} · {character.genre}</div>
        </div>
      </div>

      <div className="chat__messages">
        {session?.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.sender === "ai" ? "bubble--ai" : "bubble--user"}`}>
            {m.situation && <div className="bubble__situation">{m.situation}</div>}
            <div className="bubble__dialogue">{m.dialogue}</div>
          </div>
        ))}
      </div>

      <div className="chat__input">
        <ChatInput onSend={(text) => sendMessage(characterId, text)} />
      </div>
    </div>
  );
} 