export function formatTime(value: number) {
  const n = Math.max(0, Math.floor(value));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

export function timeAgo(at: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() - at) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
