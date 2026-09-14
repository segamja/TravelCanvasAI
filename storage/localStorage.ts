const PREFIX = "travelcanvasai:";

function isAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getItem<T>(key: string): T | undefined {
  if (!isAvailable()) return undefined;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    throw new Error("브라우저 저장 공간이 부족해요. 일부 사진을 정리한 뒤 다시 시도해주세요.");
  }
}

export function removeItem(key: string): void {
  if (!isAvailable()) return;
  window.localStorage.removeItem(PREFIX + key);
}
