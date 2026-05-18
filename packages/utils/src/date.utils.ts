export const toUnixMs = (date: Date): number => date.getTime();

export const fromUnixMs = (ms: number): Date => new Date(ms);

export const secondsBetween = (start: Date, end: Date): number =>
  Math.floor((end.getTime() - start.getTime()) / 1000);

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};
