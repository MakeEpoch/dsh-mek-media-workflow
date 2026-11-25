// 复盘 → 规则 → Skill：录入/导入真实数据，算出可解释建议，确认后写成写作规则，并可导出为 DSH Skill。
// 不接入任何第三方按次付费接口。
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Badge } from './ui.jsx';

function parseRows(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; if (Array.isArray(parsed.rows)) return parsed.rows; if (Array.isArray(parsed.metrics)) return parsed.metrics; } catch { /* fall through to CSV */ }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV 至少需要表头和一行数据');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => { const cells = line.split(','); const row = {}; headers.forEach((h, i) => { row[h] = isNaN(Number(cells[i])) ? (cells[i] || '').trim() : Number(cells[i]); }); return row; });
}

export function InsightsPanel({ client, busy, perform }) {
  const [report, setReport] = useState(null), [rules, setRules] = useState([]), [error, setError] = useState(null), [text, setText] = useState(''), [exported, setExported] = useState(null), [note, setNote] = useState('');
  const load = useCallback(() => { const c = new AbortController(); Promise.all([client.call('insights.analyze', {}, c.signal), client.call('rules.list', {}, c.signal), client.call('styles.list', {}, c.signal)]).then(([analysis, ruleData, styleData]) => { if (c.signal.aborted) return; setReport(analysis); setRules(ruleData.rules || []); setNote(styleData.active && !styleData.active.preset ? `自定义风格「${styleData.active.name}」也会一并导出。` : '内置预设不会写进你的 Skill，只导出你确认的规则和自定义风格。'); }).catch(e => { if (!c.signal.aborted) setError(e); }); return () => c.abort(); }, [client]);
  useEffect(() => load(), [load]);
  const importRows = () => perform('insights-import', async () => { const rows = parseRows(text); if (!rows.length) throw new Error('没有可导入的数据行'); const saved = await client.call('insights.import', { rows }); const analysis = await client.call('insights.analyze', {}); setReport(analysis); setText(''); setExported(null); });
  const confirm = proposal => perform('rule-confirm', async () => { const result = await client.call('rules.save', { ops: [{ op: 'add', name: proposal.name, rule: proposal.rule, evidence: proposal.evidence, source: proposal.source, confidence: proposal.confidence }] }); setRules(result.rules || []); });
  const removeRule = id => perform('rule-delete', async () => { const result = await client.call('rules.save', { ops: [{ op: 'delete', id }] }); setRules(result.rules || []); });
  const exportSkill = () => perform('skill-export', async () => setExported(await client.call('skills.export', {})));
  const active = rules.filter(row => row.status === 'active' || row.status === 'exported');
  return <div className="mw-insights">
    <div className="mw-page-title"><div><span className="mw-eyebrow">复盘</span><h2>把数据变成下一次的规则</h2><p className="mw-muted">录入真实阅读/互动数据，先看建议，确认后才成为规则；规则可导出成 DSH Skill。</p></div></div>
    {error && <div className="mw-error" role="alert">{error.message || String(error)}</div>}
    <div className="mw-section"><h3>录入或导入数据</h3><p className="mw-muted">支持 JSON 数组，或 CSV（表头 platform,date,views,likes,comments,shares,saves,title）。</p><textarea className="mw-field" style={{ minHeight: 120 }} value={text} onChange={e => setText(e.target.value)} placeholder={'platform,date,views,likes,comments,shares,saves,title\nxiaohongshu,2026-11-01,1200,80,12,6,20,示例标题'} /><Button primary disabled={busy || !text.trim()} onClick={importRows}>导入并分析</Button></div>
    {report && <div className="mw-panel"><div className="mw-row mw-between"><h3>数据概览</h3><Badge>{report.total} 条记录</Badge></div><div className="mw-metric-grid"><div><strong>{report.summary.views}</strong><small>总阅读</small></div><div><strong>{report.summary.engaged}</strong><small>总互动</small></div><div><strong>{(report.summary.engagementRate * 100).toFixed(1)}%</strong><small>互动率</small></div><div><strong>{report.summary.platforms}</strong><small>平台数</small></div></div>{report.note && <p className="mw-muted">{report.note}</p>}</div>}
    <div className="mw-section"><h3>建议规则</h3>{report?.proposals?.length ? report.proposals.map((p, i) => <div className="mw-rule-row" key={i}><div><strong>{p.name}</strong><p className="mw-muted">{p.rule}</p><small className="mw-muted">依据：{p.evidence} · 置信度 {Math.round((p.confidence || 0) * 100)}%</small></div><Button primary disabled={busy} onClick={() => confirm(p)}>确认为规则</Button></div>) : <p className="mw-muted">还没有足够数据提出新建议。样本不足时不会凑数。</p>}</div>
    <div className="mw-section"><h3>当前生效规则（{active.length}）</h3>{active.length ? active.map(row => <div className="mw-rule-row" key={row.id}><div><strong>{row.name}</strong><p className="mw-muted">{row.rule}</p>{row.evidence && <small className="mw-muted">依据：{row.evidence}</small>}</div><Button quiet danger disabled={busy} onClick={() => removeRule(row.id)}>删除</Button></div>) : <p className="mw-muted">还没有确认的规则。</p>}</div>
    <div className="mw-section"><h3>导出为 DSH Skill</h3><p className="mw-muted">{note} 写入本插件数据根的 skills/ 目录，不覆盖别人的 Skill。</p><Button primary disabled={busy || !active.length} onClick={exportSkill}>导出写作规则 Skill</Button>{exported && <div className="mw-notice" role="status">已写入 {exported.path}（{exported.rules} 条规则{exported.style ? ` · 风格：${exported.style}` : ''}）。</div>}</div>
  </div>;
}
