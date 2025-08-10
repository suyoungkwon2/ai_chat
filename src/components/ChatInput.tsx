import { useRef, useState } from "react";
import ReactGA from "react-ga4";


export default function ChatInput({
  characterName,
  onSend,
  disabled,
}: {
  characterName: string;
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLTextAreaElement | null>(null);

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
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");

    ReactGA.event({
      category: "Chat",
      action: "send_message",
      label: characterName,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatInput">
      <textarea
        ref={input}
        className="chatInput__textarea"
        placeholder="Enter a dialogue. You can also describe a situation with the (+Add Situation) button."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={disabled}
      />
      <div className="chatInput__actions">
        <button className="btn" onClick={insertSituationDelimiter} title="Add Situation" disabled={disabled}>+Add Situation</button>
        <button className="btn btn--primary" onClick={handleSend} disabled={disabled}>Send</button>
      </div>
    </div>
  );
} 