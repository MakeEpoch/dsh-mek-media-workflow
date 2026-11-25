// The idea wall uses the plugin's ideas.* RPC and preserves the existing card records.
import React, { useEffect, useRef, useState } from 'react';
import { linksInText } from '../embedded-skill/lib/content.mjs';
import { AttachmentIcon, Button, Field, WorkChoices } from './ui.jsx';

function editableText(item) {
  const body = item.body?.trim() || '';
  const title = item.title?.trim() || '';
  const repeatsTitle = body.split(/\r?\n/, 1)[0] === title || title.endsWith('…') && body.startsWith(title.slice(0, -1));
  return [
    repeatsTitle ? '' : title,
    body,
    item.url && !linksInText(`${title}\n${body}`).includes(new URL(item.url).href) ? item.url : '',
  ].filter(Boolean).join('\n\n');
}

function IdeaProduction({ client, item, busy, onStart, onCancel }) {
  const [type, setType] = useState('article'), [styleId, setStyleId] = useState(''), [request, setRequest] = useState('');
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.focus(); }, []);
  return <section ref={dialog} tabIndex={-1} className="mw-idea-form mw-idea-production" role="dialog" aria-label="从灵感制作">
    <h3>从这条灵感开始</h3>
    <p className="mw-muted">{item.title}</p>
    <fieldset disabled={!!busy}>
      <Field label="制作说明（可选）">
        <textarea className="mw-field mw-writing-input" rows={2} maxLength={30000} value={request} onChange={e => setRequest(e.target.value)} placeholder="想强调什么、给谁看，直接说。" />
      </Field>
      <WorkChoices client={client} type={type} styleId={styleId} onType={setType} onStyle={setStyleId} />
      <div className="mw-row mw-compose-actions">
        <small className="mw-muted">同类型已有作品会打开原稿。</small>
        <Button quiet onClick={onCancel}>取消</Button>
        <Button primary onClick={() => onStart(item.id, type, { request: request.trim(), writingStyleId: styleId })}>开始制作</Button>
      </div>
    </fieldset>
  </section>;
}

async function saveIdea(client, operation) {
  const result = await client.call('ideas.save', { ops: [operation] });
  if (result.errors.length) throw new Error(result.errors[0]);
  return result.state.items;
}

export function IdeaCapture({ client, busy, perform, onSaved, editing, onCancel, onUploading, hidden }) {
  const [form, setForm] = useState(() => ({ text: editing ? editableText(editing) : '', media: editing?.media ?? null }));
  const [uploading, setUploading] = useState(false), [error, setError] = useState(null), [saved, setSaved] = useState(false);
  const capture = useRef(null);
  useEffect(() => {
    if (editing && !hidden) capture.current?.querySelector('textarea')?.focus();
  }, [editing, hidden]);

  const submit = event => {
    event.preventDefault();
    const text = form.text.trim();
    if (busy || uploading || !text && !form.media) return;
    const firstLine = text.split(/\r?\n/, 1)[0];
    const title = firstLine.length > 80 ? `${firstLine.slice(0, 79)}…` : firstLine || '灵感素材';
    const fields = { title, body: text, url: linksInText(text)[0] || null, media: form.media };
    setError(null);
    perform('idea-save', async () => {
      const items = await saveIdea(client, editing ? { op: 'update', id: editing.id, ...fields } : { op: 'add', ...fields });
      setForm({ text: '', media: null });
      setSaved(true);
      onSaved(items);
    });
  };
  const upload = async file => {
    if (!file) return;
    setUploading(true); onUploading?.(true); setError(null); setSaved(false);
    try {
      const media = await client.ideaUpload(file);
      setForm(current => ({ ...current, media: { src: media.src, mime: media.mime } }));
    } catch (error) { setError(error); }
    finally { setUploading(false); onUploading?.(false); }
  };

  return <form ref={capture} className="mw-idea-form mw-idea-capture" hidden={hidden} onSubmit={submit} aria-label={editing ? '编辑灵感表单' : '记录灵感'}>
    <fieldset disabled={!!busy || uploading}>
      <Field label={editing ? '编辑灵感' : '记下灵感'}>
        <textarea className="mw-field mw-writing-input" rows={2} maxLength={40000} value={form.text} onChange={e => { setForm({ ...form, text: e.target.value }); setSaved(false); }} placeholder="写一句想法，或贴一条链接。" />
      </Field>
      <div className="mw-row mw-compose-actions">
        <label className="mw-button mw-quiet mw-file-pick">
          <AttachmentIcon />添加图片或视频<input type="file" accept="image/*,video/*" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {form.media && <Button quiet onClick={() => setForm({ ...form, media: null })}>移除附件</Button>}
        {editing && <Button quiet onClick={onCancel}>取消编辑</Button>}
        {saved && <small role="status">已记到灵感墙</small>}
        <button className="mw-button mw-primary" type="submit" disabled={!form.text.trim() && !form.media}>{editing ? '保存修改' : '记下'}</button>
      </div>
    </fieldset>
    {uploading && <small role="status">正在上传附件…</small>}
    {error && <div className="mw-error" role="alert">{error.message}</div>}
  </form>;
}

export function IdeaWall({ client, busy, perform, onStartWork, visible }) {
  const [items, setItems] = useState(null), [error, setError] = useState(null);
  const [editing, setEditing] = useState(null), [producing, setProducing] = useState(null), [uploading, setUploading] = useState(false);
  const productionTrigger = useRef(null);
  useEffect(() => {
    if (!visible) { setProducing(null); return; }
    const controller = new AbortController();
    client.call('ideas.list', {}, controller.signal).then(data => {
      if (!controller.signal.aborted) { setItems(data.items || []); setError(null); }
    }).catch(error => { if (!controller.signal.aborted) setError(error); });
    return () => controller.abort();
  }, [client, visible]);

  const remove = id => perform('idea-delete', async () => {
    setItems(await saveIdea(client, { op: 'delete', id }));
    if (editing?.id === id) setEditing(null);
    if (producing?.id === id) setProducing(null);
  });

  return <div className="mw-ideas">
    <div className="mw-page-title"><div><span className="mw-eyebrow">灵感墙</span><h2>先记下来</h2></div></div>
    {error && <div className="mw-error" role="alert">{error.message}</div>}
    <IdeaCapture key={editing?.id || 'new'} client={client} busy={busy} perform={perform} hidden={!!producing} onUploading={setUploading}
      editing={editing} onCancel={() => setEditing(null)} onSaved={next => { setItems(next); setEditing(null); }} />
    {producing && <IdeaProduction key={producing.id} client={client} item={producing} busy={busy} onStart={onStartWork} onCancel={() => { setProducing(null); productionTrigger.current?.focus(); }} />}
    <div className="mw-idea-wall">
      {items === null ? <p className="mw-muted">正在读取灵感…</p> : items.length ? items.map(item => {
        const firstLine = item.body?.split(/\r?\n/, 1)[0] || '';
        const body = firstLine === item.title ? item.body.slice(firstLine.length).trim() : item.body;
        return <article className="mw-idea-card" key={item.id}>
          {item.media?.src && <div className="mw-idea-media">
            {item.media.mime?.startsWith('video') ? <video src={client.ideaMediaUrl(item.media.src)} controls preload="metadata" /> : <img src={client.ideaMediaUrl(item.media.src)} alt={item.title} loading="lazy" />}
          </div>}
          <h3>{item.title}</h3>
          {body && <p>{body}</p>}
          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer nofollow">打开原链接 ↗</a>}
          <div className="mw-idea-actions">
            <Button className="mw-idea-start" disabled={!!busy || uploading} onClick={event => { productionTrigger.current = event.currentTarget; setProducing(item); }}>
              开始制作 <span aria-hidden="true">→</span>
            </Button>
            <details className="mw-idea-menu"
              onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}
              onKeyDown={event => { if (event.key === 'Escape' && event.currentTarget.open) { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
              <summary className="mw-button mw-quiet" aria-label="更多操作">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <circle cx="3" cy="8" r="1" /><circle cx="8" cy="8" r="1" /><circle cx="13" cy="8" r="1" />
                </svg>
              </summary>
              <div>
                <Button quiet disabled={!!busy || uploading} onClick={event => {
                  event.currentTarget.closest('details').open = false;
                  setProducing(null);
                  setEditing({ ...item });
                }}>编辑</Button>
                <Button quiet danger disabled={!!busy || uploading} onClick={event => {
                  event.currentTarget.closest('details').open = false;
                  remove(item.id);
                }}>删除</Button>
              </div>
            </details>
          </div>
        </article>;
      }) : <p className="mw-muted">记下的想法和素材会出现在这里。</p>}
    </div>
  </div>;
}
