import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import { characters as allCharacters } from "../data/characters";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import classnames from 'classnames';

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const openCharacterIds = useAppStore((s) => s.openCharacterIds);
  const currentUser = useAppStore((s) => s.currentUser);
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const [showProfile, setShowProfile] = useState(false);
  const isResizing = useRef(false);

  const isCollapsed = sidebarWidth < 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    // 너비 제한
    const constrainedWidth = Math.max(64, Math.min(newWidth, 500));
    setSidebarWidth(constrainedWidth);
  }, [setSidebarWidth]);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  const openCharacters = useMemo(() => {
    return openCharacterIds
      .map((id) => allCharacters.find((c) => c.id === id))
      .filter(Boolean) as typeof allCharacters;
  }, [openCharacterIds]);

  return (
    <aside className={classnames("sidebar", { "is-collapsed": isCollapsed })} style={{ width: `${sidebarWidth}px` }}>
      <div className="sidebar__inner">
        <div className="sidebar__top">
          <button className="btn btn--home" onClick={() => navigate("/")}>
            <span className="icon">🏠</span> <span className="text">Home</span>
          </button>
        </div>

        <div className="sidebar__section">
          <div className="sidebar__sectionTitle">Active Chats</div>
          <div className="sidebar__list">
            {openCharacters.length === 0 && (
              <div className="sidebar__empty">No active chats yet.</div>
            )}
            {openCharacters.map((c) => (
              <Link key={c.id} to={`/chat/${c.id}`} className={`sidebar__item ${pathname.includes(`/chat/${c.id}`) ? "is-active" : ""}`}>
                <img src={c.imageIconUrl} alt={c.name} className="avatar avatar--sm" />
                <div className="sidebar__itemText">{c.name}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="sidebar__bottom" onClick={() => setShowProfile(true)}>
          <img className="avatar avatar--sm" src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${currentUser.username}`} alt="me" />
          <div className="sidebar__user">
            <div className="sidebar__userId">{currentUser.username}</div>
            <div className="sidebar__userHint">Click to edit profile</div>
          </div>
        </div>
      </div>

      <div className="sidebar__resizer" onMouseDown={handleMouseDown} />

      {showProfile && <UserModal onClose={() => setShowProfile(false)} />}
    </aside>
  );
}

function UserModal({ onClose }: { onClose: () => void }) {
  const currentUser = useAppStore((s) => s.currentUser);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const [username, setUsername] = useState(currentUser.username);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    const result = updateUserProfile(username.trim(), password.trim());
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    onClose();
  };

  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Profile Settings</div>
          <button className="btn btn--icon" onClick={onClose}>✖️</button>
        </div>
        <div className="modal__content">
          <label className="form__label">Username</label>
          <input className="form__input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter a unique username" />

          <label className="form__label">Password</label>
          <input className="form__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a password" />

          {error && <div className="form__error">{error}</div>}
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
} 