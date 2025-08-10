import { Link } from "react-router-dom";
import ReactGA from "react-ga4";
import { useAppStore } from "../store/appStore";
import type { Character } from "../types";

export default function CharacterCard({ character }: { character: Character }) {
  const openChat = useAppStore((s) => s.openChat);
  const toggleLike = useAppStore((s) => s.toggleLike);
  const liked = (character as any)._liked;

  const handleStartChat = () => {
    openChat(character.id);
    ReactGA.event({
      category: "Homepage",
      action: "start_chat",
      label: character.name,
    });
  };

  const handleLikeClick = () => {
    toggleLike(character.id);
    ReactGA.event({
      category: "Homepage",
      action: "click_like",
      label: character.name,
    });
  };

  return (
    <div className="card">
      <div className="card__imageWrap">
        <img className="card__image" src={character.imageCardUrl} alt={character.name} />
      </div>
      <div className="card__body">
        <div className="card__titleRow">
          <div className="card__title">{character.name}</div>
          <button className={`btn btn--icon ${liked ? "is-active" : ""}`} onClick={handleLikeClick} aria-label="like">
            {liked ? "❤️" : "🤍"} <span className="card__likes">{character.likes}</span>
          </button>
        </div>
        <div className="card__meta">
          <span className="card__novel">{character.novelTitle}</span>
          <span className="card__dot">•</span>
          <span className="card__genre">{character.genre}</span>
        </div>
        <div className="card__chips">
          {character.keywords.map((k) => (
            <span key={k} className="chip">{k}</span>
          ))}
        </div>
        <div className="card__actions">
          <Link to={`/chat/${character.id}`}
            onClick={handleStartChat}
            className="btn btn--primary">
            Start Chat
          </Link>
        </div>
      </div>
    </div>
  );
} 