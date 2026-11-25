import React, { useEffect, useRef, useState } from 'react';
import { IdeaCapture } from './ideas.jsx';
import { formatShortTime } from './time.js';
import { safeLink } from './ui.jsx';

function RssIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <circle cx="5.5" cy="18.5" r="1" fill="currentColor" stroke="none" />
    <path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" />
  </svg>;
}

// The feed owner can pass { url, title, source, summary?, publishedAt? } items here.
// Titles and summaries are plain text, and publishedAt is an ISO timestamp.
function SourceFeed({ items }) {
  const connected = Array.isArray(items);
  const entries = (connected ? items : []).map(item => ({ ...item, url: safeLink(item?.url) })).filter(item => item.url && item.title);
  return <section className="mw-home-feed" aria-label="热门素材">
    <div className="mw-home-section-head">
      <div><h3>热门素材</h3><p>看看各个来源最近在聊什么。</p></div>
      <span className="mw-home-tag">{connected ? 'RSS' : 'RSS · 待接入'}</span>
    </div>
    {entries.length ? <ul className="mw-source-list">{entries.map(item => {
      const date = Number.isFinite(Date.parse(item.publishedAt)) ? formatShortTime(item.publishedAt) : '';
      return <li key={item.url}>
        <a className="mw-source-item" href={item.url} target="_blank" rel="noopener noreferrer">
          <div>
            <small>{item.source}{date && <> · <time dateTime={item.publishedAt}>{date}</time></>}</small>
            <strong>{item.title}</strong>
            {item.summary && <p>{item.summary}</p>}
          </div>
          <span aria-hidden="true">↗</span>
        </a>
      </li>;
    })}</ul> : <div className="mw-source-empty">
      <span className="mw-source-icon"><RssIcon /></span>
      <div><strong>暂无热门素材</strong><p>{connected ? '订阅源有新条目时会显示在这里。' : '接入 RSS 后，这里会显示来源、标题和发布时间。'}</p></div>
    </div>}
  </section>;
}

export function WorkspaceHome({ client, root, visible, generation, summary, busy, perform, onIdeas, onTasks, sourceItems }) {
  const [ideaCount, setIdeaCount] = useState(null);
  const latestSave = useRef(0);
  useEffect(() => {
    if (!visible || !root) return;
    const controller = new AbortController();
    const beforeSave = latestSave.current;
    const current = () => !controller.signal.aborted && latestSave.current === beforeSave;
    client.call('ideas.list', {}, controller.signal).then(data => {
      if (current()) setIdeaCount(data.items.length);
    }).catch(() => { if (current()) setIdeaCount(null); });
    return () => controller.abort();
  }, [client, root, visible, generation]);

  const name = root?.split(/[\\/]/).filter(Boolean).at(-1) || root;
  const metrics = [
    { label: '灵感', value: ideaCount, detail: '查看灵感墙', onClick: onIdeas },
    { label: '任务', value: summary?.all, detail: '查看未归档任务', onClick: () => onTasks('') },
    { label: '待处理', value: summary?.attention, detail: '查看待处理任务', onClick: () => onTasks('attention') },
  ];
  return <div className="mw-home">
    <div className="mw-home-heading">
      <h2>工作区概览</h2>
      {name && <span className="mw-home-tag" title={root}>{name}</span>}
    </div>
    <nav className="mw-home-metrics" aria-label="工作区快捷入口">
      {metrics.map(({ label, value, detail, onClick }) => <button key={label} type="button" onClick={onClick} className="mw-home-metric">
        <span>{label}</span>
        <strong>{value ?? '—'}</strong>
        <small>{detail} <span aria-hidden="true">→</span></small>
      </button>)}
    </nav>
    <section className="mw-home-capture" aria-label="随手记灵感">
      <div className="mw-home-section-head"><h3>随手记灵感</h3></div>
      <IdeaCapture client={client} busy={busy || !root} perform={perform} onSaved={items => {
        latestSave.current++;
        setIdeaCount(items.length);
      }} />
    </section>
    <SourceFeed items={sourceItems} />
  </div>;
}
