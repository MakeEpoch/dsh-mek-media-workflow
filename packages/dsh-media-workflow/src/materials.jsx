import React from 'react';

const t = n => Number.isFinite(n) ? `${n.toFixed(2)} 秒` : '未标注';
export function MaterialList({ materials, artifact, client, taskId }) {
  const path = name => `${artifact.path.split('/').slice(0, -1).join('/')}/${name}`;
  return <div>{materials.map(m => <section key={m.id} className="mw-scene"><h4>{m.name}</h4><p className="mw-muted">{m.id} · {m.mime} · 出处：{m.attribution || m.url || '用户提供'} · 可用范围：{m.usage || '未声明'}</p>
    {m.mime?.startsWith('image/') && <img src={client.artifactUrl(taskId, path(m.file))} alt={m.name} style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain' }} />}
    {m.mime?.startsWith('audio/') && <audio controls src={client.artifactUrl(taskId, path(m.file))} style={{ maxWidth: '100%' }} />}
    {m.mime?.startsWith('video/') && <video controls preload="metadata" src={client.artifactUrl(taskId, path(m.file))} style={{ maxWidth: '100%' }} />}
    {m.analysis?.ocr && <details><summary>图片 / 文档识别文字</summary><p className="mw-muted">{m.analysis.ocr.tool} · 机器识别，待结合原件核对。</p><pre style={{ whiteSpace: 'pre-wrap' }}>{m.analysis.ocr.text?.slice(0, 20000) || '未识别出文字'}</pre>{m.analysis.ocr.text?.length > 20000 && <p>此处展示前 20000 字，完整结果保留在识别产物中。</p>}</details>}
    {m.analysis?.transcript && <details><summary>语音转录与时间码</summary><p className="mw-muted">{m.analysis.transcript.tool} · {m.analysis.transcript.language} · 实际时长 {t(m.analysis.transcript.duration)} · ASR 时间码</p>{m.analysis.transcript.segments.slice(0, 200).map((s, i) => <div className="mw-script-section" key={i}><small>{t(s.start)} – {t(s.end)}</small><p>{s.text}</p><details><summary>词时间码</summary>{s.words?.map((w, j) => <span className="mw-timeline-word" key={j}>{w.text} · {t(w.start)}</span>)}</details></div>)}{m.analysis.transcript.segments.length > 200 && <p>此处展示前 200 段，完整转录保留在产物文件中。</p>}</details>}
    {m.analysis?.frames?.length > 0 && <details open><summary>实际抽取的视频帧</summary><div style={{ display: 'flex', gap: 8, overflow: 'auto' }}>{m.analysis.frames.map(f => <figure key={f.file} style={{ margin: 0, minWidth: 140, maxWidth: 220 }}><img src={client.artifactUrl(taskId, path(f.file))} alt={`${m.name} ${t(f.time)} 抽样帧`} style={{ width: '100%' }} /><figcaption>{t(f.time)}</figcaption></figure>)}</div><p className="mw-muted">这是带时间码的抽样帧，未表示逐帧观看。</p></details>}
    {m.visualObservations?.length > 0 && <details open><summary>实际图像观察</summary>{m.visualObservations.map(o => <div className="mw-fact" key={o.id}><small>{o.id}</small><p>{o.summary}</p>{o.readableText && <pre style={{ whiteSpace: 'pre-wrap' }}>{o.readableText}</pre>}{o.unknowns?.length > 0 && <p className="mw-muted">待核实：{o.unknowns.join('；')}</p>}</div>)}</details>}
    {m.analysis?.unknowns?.length > 0 && <p className="mw-help">待处理：{m.analysis.unknowns.join('；')}</p>}
    {m.textEvidence && <p className="mw-muted">正文来源：{m.textEvidence}；机器提取保留不确定性。</p>}
    {m.text && !m.analysis?.ocr && !m.analysis?.transcript && <details><summary>来源正文</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{m.text.slice(0, 20000)}</pre></details>}
  </section>)}</div>;
}
