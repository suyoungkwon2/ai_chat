import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import { useMemo } from "react";

export default function MobileMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const openCharacterIds = useAppStore((s) => s.openCharacterIds);
  const characters = useAppStore((s) => s.characters);

  const handleLinkClick = (path: string) => {
    navigate(path);
    onClose();
  };
  
  const openCharacters = useMemo(() => {
    const byId = new Map(characters.map((c) => [c.id, c] as const));
    return openCharacterIds.map((id) => byId.get(id)).filter(Boolean) as typeof characters;
  }, [openCharacterIds, characters]);

  return (
    <div className="mobile-menu" onClick={onClose}>
      <div className="mobile-menu__content" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-menu__section">
          <button className="mobile-menu__item" onClick={() => handleLinkClick("/")}>
            <span className="icon">🏠</span> Home
          </button>
        </div>
        <div className="mobile-menu__section">
          <div className="mobile-menu__title">Active Chats</div>
          <div className="mobile-menu__list">
            {openCharacters.length === 0 && (
              <div className="mobile-menu__empty">No active chats yet.</div>
            )}
            {openCharacters.map((c) => (
              <Link
                key={c.id}
                to={`/chat/${c.id}`}
                onClick={onClose}
                className={`mobile-menu__item ${pathname.includes(`/chat/${c.id}`) ? "is-active" : ""}`}
              >
                <img src={c.imageIconUrl} alt={c.name} className="avatar avatar--sm" />
                <div className="mobile-menu__itemText">{c.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 