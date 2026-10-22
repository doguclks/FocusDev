export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 dk';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs} sa ${mins} dk`;
  }
  if (mins > 0) {
    return `${mins} dk ${secs > 0 ? `${secs} sn` : ''}`;
  }
  return `${secs} sn`;
}

export function formatTimeDigital(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatHourBadge(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function getScoreColor(score: number): { text: string; bg: string; border: string } {
  if (score >= 85) {
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  }
  if (score >= 70) {
    return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
  }
  return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
}
