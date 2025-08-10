import { Link } from "react-router-dom";
import ReactGA from "react-ga4";
import { useAppStore } from "../store/appStore";
import type { Character } from "../types";
import { useState, useRef, useEffect } from "react";

export default function CharacterCard({ character }: { character: Character }) {
  const openChat = useAppStore((s) => s.openChat);
  const toggleLike = useAppStore((s) => s.toggleLike);
  const liked = (character as any)._liked;
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(error => {
        console.error("Video play was prevented:", error);
      });
    }
  }, [isHovered]);

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

  const handleMouseEnter = () => {
    if (character.videoCardUrl) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleVideoEnd = () => {
    setIsHovered(false);
  };

  return (
    <div
      className="card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card__imageWrap">
        {isHovered && character.videoCardUrl ? (
          <video
            ref={videoRef}
            className="card__image"
            src={character.videoCardUrl}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
          />
        ) : (
          <img
            className="card__image"
            src={character.imageCardUrl}
            alt={character.name}
          />
        )}
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