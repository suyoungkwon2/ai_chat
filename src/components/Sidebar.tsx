import { Link, useLocation, useNavigate } from "react-router-dom";
import ReactGA from "react-ga4";
import { useAppStore } from "../store/appStore";
import { useCallback, useEffect, useMemo, useRef } from "react";
import classnames from 'classnames';
import userIcon from '../assets/images/img_icon_user.svg';

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const openCharacterIds = useAppStore((s) => s.openCharacterIds);
  const currentUser = useAppStore((s) => s.currentUser);
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const resetUserRegistration = useAppStore((s) => s.resetUserRegistration);
  const resetAdViews = useAppStore((s) => s.resetAdViews);
  const isRegistered = useAppStore((s) => s.isRegistered);
  const setActiveModal = useAppStore((s) => s.setActiveModal);
  const characters = useAppStore((s) => s.characters);
  const isResizing = useRef(false);

  const handleHomeClick = () => {
    navigate("/");
    ReactGA.event({
      category: "Navigation",
      action: "click_home_sidebar",
    });
  };

  const handleProfileClick = () => {
    if (isRegistered) {
      setActiveModal("userProfile");
      ReactGA.event({
        category: "Navigation",
        action: "open_profile_modal",
      });
    } else {
      setActiveModal("userRegistration");
    }
  };

  const isCollapsed = sidebarWidth < 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
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
    const byId = new Map(characters.map((c) => [c.id, c] as const));
    return openCharacterIds.map((id) => byId.get(id)).filter(Boolean) as typeof characters;
  }, [openCharacterIds, characters]);

  return (
    <aside
      className={classnames("sidebar", { "is-collapsed": isCollapsed })}
      style={{ flexBasis: `${sidebarWidth}px` }}
    >
      <div className="sidebar__inner">
        <div className="sidebar__top">
          <button className="btn btn--home" onClick={handleHomeClick}>
            <span className="icon">🏠</span> <span className="text">Home</span>
          </button>
          {/* <button className="btn" onClick={() => resetUserRegistration()} title="Reset User" disabled>
            <span className="icon">🔄</span>
          </button>
          <button className="btn" onClick={() => resetAdViews()} title="Reset Ads" disabled>
            <span className="icon">📺</span>
          </button> */}
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

        <div className="sidebar__bottom" onClick={handleProfileClick}>
          <img className="avatar avatar--sm" src={userIcon} alt="me" />
          <div className="sidebar__user">
            <div className="sidebar__userId">{currentUser.username}</div>
          </div>
        </div>
      </div>

      <div className="sidebar__resizer" onMouseDown={handleMouseDown} />

    </aside>
  );
} 