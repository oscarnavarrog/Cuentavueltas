const KEY_LABELS: Record<string, string> = {
  Space: 'Espacio',
  Enter: 'Intro',
  NumpadEnter: 'Intro (Num)',
  Backspace: 'Retroceso',
  ArrowUp: 'Flecha ↑',
  ArrowDown: 'Flecha ↓',
  ArrowLeft: 'Flecha ←',
  ArrowRight: 'Flecha →',
  Tab: 'Tab',
  PageUp: 'Re Pág',
  PageDown: 'Av Pág',
  Home: 'Inicio',
  End: 'Fin',
  Escape: 'Esc',
};

export function formatKeyCode(code: string): string {
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  return code;
}

export function formatShortKeyCap(code: string): string {
  if (code === 'Space') return 'Espacio';
  if (code === 'Backspace') return '⌫';
  if (code === 'Enter' || code === 'NumpadEnter') return '↵';
  if (code === 'ArrowUp') return '↑';
  if (code === 'ArrowDown') return '↓';
  if (code === 'ArrowLeft') return '←';
  if (code === 'ArrowRight') return '→';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

export function isIgnoredShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}
