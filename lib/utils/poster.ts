export function getAspectRatio(posterSize: string): string {
  const map: Record<string, string> = {
    "1080x1080": "1 / 1",
    "1080x1350": "4 / 5",
    "1080x1920": "9 / 16",
  };
  return map[posterSize] ?? "1 / 1";
}

export function formatRelativeTime(timestamp: unknown): string {
  const date =
    timestamp &&
    typeof timestamp === "object" &&
    "toDate" in timestamp &&
    typeof (timestamp as { toDate: () => Date }).toDate === "function"
      ? (timestamp as { toDate: () => Date }).toDate()
      : new Date(timestamp as string | number);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function downloadImage(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
