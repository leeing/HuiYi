// Deterministic gradient derived from title string hash.
// Produces a linear-gradient suitable for a book cover.

const PALETTE = [
  ["#8B5E3C", "#C4956A"], // 暖棕
  ["#3D6B8A", "#6FA8C9"], // 水蓝
  ["#6B4A7A", "#A882B8"], // 紫韵
  ["#4A7A5A", "#82B896"], // 翠绿
  ["#8A3D3D", "#C97070"], // 朱红
  ["#5A5A8A", "#9090C0"], // 靛蓝
  ["#7A6B3D", "#B8A870"], // 金褐
  ["#3D7A6B", "#70B8A8"], // 青碧
] as const;

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function bookGradient(title: string): string {
  const index = hashCode(title || " ") % PALETTE.length;
  const pair = PALETTE[index] ?? (["#8B5E3C", "#C4956A"] as const);
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
}
