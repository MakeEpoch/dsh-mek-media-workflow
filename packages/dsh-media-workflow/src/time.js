// Display timestamps in the viewer's local time zone. The task's business time zone remains part of its brief.
export function formatShortTime(value, { month = 'numeric', empty = '', timeZone } = {}) {
  if (!value) return empty;
  const options = { month, day: month, hour: '2-digit', minute: '2-digit', ...(timeZone ? { timeZone } : {}) };
  return new Intl.DateTimeFormat('zh-CN', options).format(new Date(value));
}
