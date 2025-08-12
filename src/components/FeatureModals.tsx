import { useEffect, useState } from "react";
import { useAppStore } from "../store/appStore";
import adVideo from "../assets/videos/vid_book.mp4";

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
  const setActiveModal = useAppStore((s) => s.setActiveModal);

  const handleSave = () => {
    setError(null);
    const result = updateUserProfile(id, password);
    if (result.ok) {
      if (characterId) handleModalAction(characterId, "register");
    } else {
      setError(result.reason);
    }
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
  const handleModalAction = useAppStore((s) => s.handleModalAction);
  const setActiveModal = useAppStore((s) => s.setActiveModal);

  const handleSignIn = () => {
    setError(null);
    const result = signInUser(id, password);
    if (result.ok) {
      if (characterId) handleModalAction(characterId, "register"); // Re-using register logic for simplicity
    } else {
      setError(result.reason);
    }
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

  const handleWatchAd = () => {
    setActiveModal("actualAd", characterId);
  };

  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Watch an ad to unlock +10 chats 🎉</div>
          <button className="btn btn--icon" onClick={onClose}>
            ✖️
          </button>
        </div>
        <div className="modal__content">
          <p>
            Watching a short ad will give you 10 extra free chats. You can watch
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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      if (characterId) handleModalAction(characterId, "watchAd");
    }
  }, [countdown, characterId, handleModalAction]);

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