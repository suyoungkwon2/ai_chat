import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import { characters as allCharacters } from "../data/characters";
import { useMemo, useState } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const openCharacterIds = useAppStore((s) => s.openCharacterIds);
  const currentUser = useAppStore((s) => s.currentUser);
  const [showProfile, setShowProfile] = useState(false);

  const openCharacters = useMemo(() => {
    return openCharacterIds
      .map((id) => allCharacters.find((c) => c.id === id))
      .filter(Boolean) as typeof allCharacters;
  }, [openCharacterIds]);

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <button className="btn btn--home" onClick={() => navigate("/")}>🏠 홈</button>
      </div>

      <div className="sidebar__section">
        <div className="sidebar__sectionTitle">열린 채팅</div>
        <div className="sidebar__list">
          {openCharacters.length === 0 && (
            <div className="sidebar__empty">아직 열린 채팅이 없습니다.</div>
          )}
          {openCharacters.map((c) => (
            <Link key={c.id} to={`/chat/${c.id}`} className={`sidebar__item ${pathname.includes(`/chat/${c.id}`) ? "is-active" : ""}`}>
              <img src={c.imageUrl} alt={c.name} className="avatar avatar--sm" />
              <div className="sidebar__itemText">{c.name}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="sidebar__bottom" onClick={() => setShowProfile(true)}>
        <img className="avatar avatar--sm" src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${currentUser.username}`} alt="me" />
        <div className="sidebar__user">
          <div className="sidebar__userId">{currentUser.username}</div>
          <div className="sidebar__userHint">클릭하여 프로필 변경</div>
        </div>
      </div>

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
          <div className="modal__title">프로필 설정</div>
          <button className="btn btn--icon" onClick={onClose}>✖️</button>
        </div>
        <div className="modal__content">
          <label className="form__label">유저명</label>
          <input className="form__input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="유니크한 유저명을 입력" />

          <label className="form__label">비밀번호</label>
          <input className="form__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력" />

          {error && <div className="form__error">{error}</div>}
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onSave}>변경 저장</button>
        </div>
      </div>
    </div>
  );
} 