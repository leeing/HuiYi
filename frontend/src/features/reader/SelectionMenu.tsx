interface Position {
  x: number;
  y: number;
}

interface SelectionMenuProps {
  selectedText: string;
  position: Position;
  onAiAssist: (text: string) => void;
  onClose: () => void;
}

export default function SelectionMenu({
  selectedText,
  position,
  onAiAssist,
  onClose,
}: SelectionMenuProps) {
  if (!selectedText) return null;

  return (
    <menu
      role="menu"
      aria-label="文字操作菜单"
      style={{ position: "fixed", top: position.y, left: position.x }}
      className="z-50 flex gap-1 rounded-lg border border-ink-dark/10 bg-white px-2 py-1 shadow-lg"
    >
      <li>
        <button
          type="button"
          role="menuitem"
          aria-label="AI 解读"
          onClick={() => onAiAssist(selectedText)}
          className="rounded px-3 py-1 text-sm text-ink-dark hover:bg-warm-red hover:text-white"
        >
          ✨ AI 解读
        </button>
      </li>
      <li>
        <button
          type="button"
          role="menuitem"
          aria-label="关闭菜单"
          onClick={onClose}
          className="rounded px-2 py-1 text-sm text-ink-dark/50 hover:bg-ink-dark/5"
        >
          ×
        </button>
      </li>
    </menu>
  );
}
