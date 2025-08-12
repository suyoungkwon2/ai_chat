import { useRef, useState } from "react";
import ReactGA from "react-ga4";


export default function ChatInput({
  characterName,
  onSend,
  disabled,
  onUnlockWithAd,
  isRegistered,
  disabledPlaceholder,
}: {
  characterName: string;
  onSend: (text: string) => void;
  disabled?: boolean;
  onUnlockWithAd?: () => void;
  isRegistered?: boolean;
  disabledPlaceholder?: string;
}) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLTextAreaElement | null>(null);
  const isSending = useRef(false);

  const insertSituationDelimiter = () => {
    const el = input.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}**${value.slice(end)}`;
    setValue(next);

    ReactGA.event({
      category: "Chat",
      action: "add_situation",
      label: characterName,
    });

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + 1; // * 와 * 사이
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSend = () => {
    if (isSending.current) return;

    const text = value.trim();
    if (!text) return;

    isSending.current = true;
    onSend(text);

    ReactGA.event({
      category: "Chat",
      action: "send_message",
      label: characterName,
    });

    setTimeout(() => {
      setValue("");
      isSending.current = false;
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder = disabled
    ? (disabledPlaceholder || "Out of credits. Sign up or watch a 15s ad to continue.")
    : "Enter a dialogue. You can also describe a situation with the (+Add Situation) button.";

  return (
    <div className="chatInput">
      <textarea
        ref={input}
        className="chatInput__textarea"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={disabled}
      />
      <div className="chatInput__actions">
        <div className="chatInput__actionsLeft">
          <button className="btn" onClick={insertSituationDelimiter} title="Add Situation" disabled={disabled}>+Add Situation</button>
          {disabled && onUnlockWithAd && isRegistered &&(
            <button className="btn" onClick={onUnlockWithAd}>Unlock with Ad 🎉</button>
          )}
        </div>
        <button className="btn btn--primary" onClick={handleSend} disabled={disabled}>Send</button>
      </div>
    </div>
  );
} 