import { useRef, useState } from "react";

export default function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const insertSituationDelimiter = () => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + " ** " + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + 4; // space + ** + space
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSend = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="chatInput">
      <textarea
        ref={inputRef}
        className="chatInput__textarea"
        placeholder="대사를 입력하세요. (+상황추가 버튼으로 상황을 함께 묘사할 수 있어요)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
      />
      <div className="chatInput__actions">
        <button className="btn" onClick={insertSituationDelimiter} title="상황 추가">(+상황추가)</button>
        <button className="btn btn--primary" onClick={handleSend}>전송</button>
      </div>
    </div>
  );
} 