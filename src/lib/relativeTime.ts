const MINUTE_IN_MS = 60 * 1000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;

export const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const elapsed = Date.now() - date.getTime();

  if (elapsed < MINUTE_IN_MS) {
    return "now";
  }

  if (elapsed < HOUR_IN_MS) {
    return `${Math.floor(elapsed / MINUTE_IN_MS)}m`;
  }

  if (elapsed < DAY_IN_MS) {
    return `${Math.floor(elapsed / HOUR_IN_MS)}h`;
  }

  return `${Math.floor(elapsed / DAY_IN_MS)}d`;
};
