import test from 'node:test';
import assert from 'node:assert/strict';
import { formatShortTime } from '../packages/dsh-media-workflow/src/time.js';

test('时间显示使用选定或运行环境时区，保留空值提示', () => {
  const instant = '2026-01-01T00:30:00Z';
  assert.match(formatShortTime(instant, { timeZone: 'UTC' }), /00:30/);
  assert.match(formatShortTime(instant, { timeZone: 'Asia/Shanghai' }), /08:30/);
  assert.equal(formatShortTime(null, { empty: '未知' }), '未知');
  assert.equal(formatShortTime(instant), formatShortTime(instant, { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
});
