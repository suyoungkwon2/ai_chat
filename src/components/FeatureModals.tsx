import { useState } from "react";
import { useAppStore } from "../store/appStore";

interface ModalProps {
  characterId: string;
  onClose: () => void;
}

export function UserRegistrationModal({ characterId, onClose }: ModalProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const handleModalAction = useAppStore((s) => s.handleModalAction);

  const handleSave = () => {
    // TODO: 유저 등록 API 연동
    handleModalAction(characterId, "register");
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
            character will remember your story.
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
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onClose}>
            Chat Again Tomorrow
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

export function WatchAdModal({ characterId, onClose }: ModalProps) {
  const handleModalAction = useAppStore((s) => s.handleModalAction);
  const modalState = useAppStore((s) => s.modalStates[characterId]);
  const adViewsLeft = 5 - (modalState?.adViewsToday || 0);

  const handleWatchAd = () => {
    // TODO: Implement ad watching logic
    handleModalAction(characterId, "watchAd");
  };

  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Watch an ad to unlock +10 chats</div>
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

export function EndOfChatsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal__backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title">Today’s chats have ended</div>
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