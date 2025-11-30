const STORAGE_KEY = "deviceId";

const hashString = (value: string) => {
  // Simple deterministic hash to avoid async crypto in request lifecycle
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

const collectFingerprint = (): string => {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return "server";
  }

  const {
    userAgent,
    language,
    languages,
    platform,
    vendor,
    hardwareConcurrency,
    deviceMemory,
    maxTouchPoints,
  } = navigator as Navigator & { deviceMemory?: number };

  const { width, height, colorDepth, pixelDepth } = window.screen ?? {};
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const offset = new Date().getTimezoneOffset();

  return [
    userAgent,
    language,
    languages?.join(","),
    platform,
    vendor,
    hardwareConcurrency,
    deviceMemory,
    maxTouchPoints,
    width,
    height,
    colorDepth,
    pixelDepth,
    timezone,
    offset,
  ]
    .map((v) => (v === undefined || v === null ? "" : String(v)))
    .join("|");
};

export function getDeviceId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const fingerprint = collectFingerprint();
  const deviceId = `fp-${hashString(fingerprint)}`;
  localStorage.setItem(STORAGE_KEY, deviceId);
  return deviceId;
}
