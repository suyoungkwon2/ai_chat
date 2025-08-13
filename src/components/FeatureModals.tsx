import { useEffect, useState } from "react";
import { useAppStore } from "../store/appStore";
import adVideo from "../assets/videos/vid_book.mp4";
import { useNavigate } from "react-router-dom";
import ReactGA from "react-ga4";

interface ModalProps {
  characterId?: string;
  onClose: () => void;
}

export function UserRegistrationModal({ characterId, onClose }: ModalProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const handleModalAction = useAppStore((s) => s.handleModalAction);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const registerUser = useAppStore((s) => s.registerUser);
  const setActiveModal = useAppStore((s) => s.setActiveModal);

  const handleSave = async () => {
    setError(null);
    const local = updateUserProfile(id, password);
    if (!local.ok) {
      setError(local.reason);
      return;
    }
    const backend = await (registerUser?.(id, password) || Promise.resolve({ ok: true as const }));
    if (!backend.ok) {
      setError(backend.reason);
      return;
    }
    // After backend registration and login, fetch usage so UI reflects +10 credits immediately
    await useAppStore.getState().refreshUsageStatus?.();
    // When just registered, refresh/create the backend chat id if needed so /send doesn't 404
    try {
      const s = useAppStore.getState();
      const character = s.modalContextCharacterId || characterId;
      if (character) {
        // Ensure a valid backend chat exists under auth
        await s.openChat(character);
      }
    } catch {}
    if (characterId) handleModalAction(characterId, "register");
  };

  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Continue the conversation?</div>
          <button className="btn btn--icon" onClick={onClose}>
            ✖️
          </button>
        </div>
        <div className="modal__content">
          <p>
            Enter your ID and password to unlock 10 more chats, and your
            character will remember your story 🩶.
          </p>
          <label className="form__label">ID</label>
          <input
            className="form__input"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Enter a unique ID"
          />

          <label className="form__label">Password</label>
          <input
            className="form__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a password"
          />
          {error && <div className="form__error">{error}</div>}
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={() => setActiveModal("signIn", characterId)}>
            Already a user? Sign In
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            Save
          </button>
        </div>
        <div className="modal__subfooter">Available only once.</div>
      </div>
    </div>
  );
}

export function SignInModal({ characterId, onClose }: ModalProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const signInUser = useAppStore((s) => s.signInUser);
  const loginUser = useAppStore((s) => s.loginUser);
  const handleModalAction = useAppStore((s) => s.handleModalAction);
  const setActiveModal = useAppStore((s) => s.setActiveModal);

  const handleSignIn = async () => {
    setError(null);
    // Local quick check
    const local = await signInUser(id, password);
    if (!local.ok) {
      setError(local.reason);
      return;
    }
    // Backend login
    const be = await (loginUser?.(id, password) || Promise.resolve({ ok: true as const }));
    if (!be.ok) {
      setError(be.reason);
      return;
    }
    if (characterId) handleModalAction(characterId, "register");
  };

  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Welcome back to your story</div>
          <button className="btn btn--icon" onClick={onClose}>
            ✖️
          </button>
        </div>
        <div className="modal__content">
          <p>
            Enter your ID and password to step back into your world. Your
            character still remembers every word.
          </p>
          <label className="form__label">ID</label>
          <input
            className="form__input"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Enter your ID"
          />

          <label className="form__label">Password</label>
          <input
            className="form__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          {error && <div className="form__error">{error}</div>}
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={() => setActiveModal("userRegistration", characterId)}>
            Back to Signup
          </button>
          <button className="btn btn--primary" onClick={handleSignIn}>
            Resume Conversation
          </button>
        </div>
      </div>
    </div>
  );
}

export function WatchAdModal({ characterId, onClose }: ModalProps) {
  const setActiveModal = useAppStore((s) => s.setActiveModal);
  const modalState = useAppStore((s) => s.modalStates[characterId!]);
  const adViewsLeft = 5 - (modalState?.adViewsToday || 0);
  const startAd = useAppStore((s) => s.startAd);

  const handleWatchAd = async () => {
    const res = await (startAd?.() || Promise.resolve({ ok: true } as any));
    if (res.ok) setActiveModal("actualAd", characterId);
  };

  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Watch an ad to unlock +1 chat 🎉</div>
          <button className="btn btn--icon" onClick={onClose}>
            ✖️
          </button>
        </div>
        <div className="modal__content">
          <p>
            Watching a short ad will give you 1 extra free chat. You can watch
            up to 5 ads today. (Remaining: {adViewsLeft})
          </p>
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onClose}>
            Chat Again Tomorrow
          </button>
          <button className="btn btn--primary" onClick={handleWatchAd}>
            Watch Ad
          </button>
        </div>
        <div className="modal__subfooter">
          Ads help support service operation and AI costs. Thank you!
        </div>
      </div>
    </div>
  );
}

export function ActualAdModal({ characterId, onClose }: { characterId?: string, onClose: () => void }) {
  const [countdown, setCountdown] = useState(15);
  const handleModalAction = useAppStore((s) => s.handleModalAction);
  const completeAd = useAppStore((s) => s.completeAd);
  const refreshUsageStatus = useAppStore((s) => s.refreshUsageStatus);
  const adMinSeconds = useAppStore((s) => s.adMinSeconds) || 15;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      (async () => {
        await (completeAd?.(adMinSeconds) || Promise.resolve({ ok: true }));
        await (refreshUsageStatus?.() || Promise.resolve());
        if (characterId) handleModalAction(characterId, "watchAd");
      })();
    }
  }, [countdown, characterId, handleModalAction, completeAd, adMinSeconds, refreshUsageStatus]);

  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal modal--ad">
        <video src={adVideo} autoPlay loop muted playsInline className="ad-video" />
        <div className="ad-countdown">{countdown}s</div>
        <button className="btn btn--icon ad-close-btn" onClick={onClose}>✖️</button>
      </div>
    </div>
  );
}

export function UserProfileModal({ onClose }: { onClose: () => void }) {
  const currentUser = useAppStore((s) => s.currentUser);
  const updateUserProfile = useAppStore((s) => s.updateUserProfile);
  const [username] = useState(currentUser.username);
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
          <input className="form__input" value={username} disabled />

          <label className="form__label">Password</label>
          <input className="form__input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a new password" />

          {error && <div className="form__error">{error}</div>}
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export function EndOfChatsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Today’s chats have ended 🥺</div>
          <button className="btn btn--icon" onClick={onClose}>
            ✖️
          </button>
        </div>
        <div className="modal__content">
          <p>
            Thank you. You’ve used all your chats for today. Let’s whisper
            again tomorrow.
          </p>
        </div>
        <div className="modal__footer">
          <button className="btn btn--primary" onClick={onClose}>
            See You Tomorrow
          </button>
        </div>
      </div>
    </div>
  );
}

export function CharacterProfileModal({ characterId, onClose }: ModalProps) {
  const navigate = useNavigate();
  const openChat = useAppStore((s) => s.openChat);
  const character = useAppStore((s) => s.characters.find((c) => c.id === characterId));

  if (!character) return null;

  const handleStartChat = () => {
    openChat(character.id);
    navigate(`/chat/${character.id}`);
    onClose();
    ReactGA.event({
      category: "Engagement",
      action: "start_chat_from_profile",
      label: character.name,
    });
  };

  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">{character.name}'s Profile</div>
          <button className="btn btn--icon" onClick={onClose}>
            ✖️
          </button>
        </div>
        <div className="modal__content modal__content--profile">
          <img src={character.imageProfileUrl} alt={character.name} className="profile-modal__image" />
          
          <div className="profile-modal__section">
            <div className="profile-modal__title">Character</div>
            <div className="profile-modal__name-row">
              <span className="profile-modal__name">{character.name}</span>
              <span className="profile-modal__subtitle">{character.description ?? "A captivating character with a story to tell."}</span>
            </div>
            <div className="profile-modal__summary">
              {(character.summary ?? "").split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
            </div>
          </div>

          <hr className="divider" />

          <div className="profile-modal__section">
            <div className="profile-modal__title">You</div>
            <div className="profile-modal__name-row">
              <span className="profile-modal__name">{character.userPersona?.name ?? "Your Role"}</span>
              <span className="profile-modal__subtitle">{character.userPersona?.description ?? "You find yourself drawn into their world."}</span>
            </div>
            <div className="profile-modal__summary">
              {(character.userPersona?.summary ?? "").split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
            </div>
          </div>

          <hr className="divider" />

          <div className="profile-modal__section">
            <div className="profile-modal__title">World Setting</div>
            <div className="profile-modal__summary">
              {(character.worldSetting ?? "").split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn btn--primary" onClick={handleStartChat}>
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
} 