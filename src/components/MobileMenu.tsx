import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import { characters as allCharacters } from "../data/characters";
import { useMemo } from "react";

export default function MobileMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const openCharacterIds = useAppStore((s) => s.openCharacterIds);
  const currentUser = useAppStore((s) => s.currentUser);

  const handleLinkClick = (path: string) => {
    navigate(path);
    onClose();
  };
  
  const openCharacters = useMemo(() => {
    return openCharacterIds
      .map((id) => allCharacters.find((c) => c.id === id))
      .filter(Boolean) as typeof allCharacters;
  }, [openCharacterIds]);

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
        <div className="mobile-menu__bottom">
          <div className="mobile-menu__item">
            <img className="avatar avatar--sm" src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${currentUser.username}`} alt="me" />
            <div className="mobile-menu__itemText">{currentUser.username}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 