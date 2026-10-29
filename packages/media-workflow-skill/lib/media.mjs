import { mkdir, readFile, readdir, copyFile } from 'node:fs/promises';
import { join, relative, dirname, basename, isAbsolute, resolve } from 'node:path';
import { command, ttsAdapter, mimoAdapter, findOm, resolveCodec, encodeRequest } from './process.mjs';
import { voiceOf } from './schema.mjs';
import { atomic, json, digest, fail, htmlEscape, regular } from './common.mjs';
import { motionProject, motionRender, recursiveFiles } from './motion.mjs';

export async function probe(path, settings, signal) {
  return JSON.parse((await command(settings.ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path], { signal, timeoutMs: 30000 })).stdout);
}
const srtTime = sec => { const ms = Math.round(Math.max(0, sec) * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
export const subtitles = segments => segments.map((s, i) => `${i + 1}\n${srtTime(s.start)} --> ${srtTime(s.end)}\n${s.text}\n`).join('\n');
export function captionCues(timeline) {
  if (!timeline.words?.length) return timeline.segments;
  const result = []; let words = [], characters = 0;
  const flush = () => { if (!words.length) return; let text = ''; for (const word of words) text += (/[a-z0-9]$/i.test(text) && /^[a-z0-9]/i.test(word.text) ? ' ' : '') + word.text; result.push({ start: words[0].start, end: words.at(-1).end, text }); words = []; characters = 0; };
  for (const word of timeline.words) { if (characters + Array.from(word.text).length > 18 || (words.length && words[0].sectionId !== word.sectionId)) flush(); words.push(word); characters += Array.from(word.text).length; }
  flush(); return result;
}
export function validateTimeline(timeline, script) {
  if (!timeline || !Array.isArray(timeline.segments) || !Array.isArray(timeline.words)) fail('invalid-timeline', '时间轴结构无效');
  let last = 0; const ids = new Set();
  for (const s of timeline.segments) {
    if (!Number.isFinite(s.start) || !Number.isFinite(s.end) || s.start < last - 0.001 || s.end <= s.start || !script.sections.some(x => x.id === s.sectionId) || ids.has(s.sectionId)) fail('invalid-timeline', '时间轴必须按顺序覆盖每个旁白段落');
    ids.add(s.sectionId); last = s.end;
  }
  if (ids.size !== script.sections.length) fail('invalid-timeline', '时间轴缺少旁白段落');
  let wordEnd = 0;
  for (const w of timeline.words) {
    const section = timeline.segments.find(s => s.sectionId === w.sectionId);
    if (!section || typeof w.text !== 'string' || !w.text.trim() || !Number.isFinite(w.start) || !Number.isFinite(w.end) || w.start < wordEnd - .001 || w.start < section.start || w.end <= w.start || w.end > section.end + .2) fail('invalid-timeline', '词边界必须依次位于对应的实际音频段内');
    wordEnd = w.end;
  }
  if (!['provider-word-boundary', 'forced-alignment', 'sentence-boundary', 'no-narration', 'recording-duration'].includes(timeline.alignmentMethod)) fail('invalid-timeline', '必须注明实际时间轴来源');
  return timeline;
}
export async function synthesizeVoice(brief, script, storyboard, materials, dir, settings, signal, onProcess, alignment) {
  await mkdir(dir, { recursive: true });
  if (brief.voice.mode === 'none') {
    let time = 0; const timeline = { alignmentMethod: 'no-narration', sampleRate: null, words: [], segments: script.sections.map(s => { const scene = storyboard.scenes.find(x => x.sectionId === s.id), start = time; time += scene.durationSeconds; return { sectionId: s.id, text: s.text, start, end: time }; }), duration: 0 };
    timeline.duration = time; await atomic(join(dir, 'timeline.json'), timeline); await atomic(join(dir, 'captions.srt'), subtitles(timeline.segments)); return ['timeline.json', 'captions.srt'];
  }
  if (brief.voice.mode === 'provided') {
    const audio = materials.find(m => m.role === 'audio'); if (!audio) fail('audio-required', '请导入实际旁白录音');
    if (!alignment && (script.sections.length !== 1 || brief.voice.requiredAlignment === 'word')) fail('alignment-required', '录音需要实际对齐时间轴；可通过阶段结果导入音频与时间轴，不能按字数伪造词级时间');
    await command(settings.ffmpeg, ['-y', '-i', audio.absolutePath, '-ar', '24000', '-ac', '1', join(dir, 'voiceover.wav')], { signal, onProcess });
    const p = await probe(join(dir, 'voiceover.wav'), settings, signal), duration = Number(p.format.duration);
    const timeline = alignment ? validateTimeline(alignment.timeline, script) : { alignmentMethod: 'recording-duration', sampleRate: 24000, duration, words: [], segments: [{ sectionId: script.sections[0].id, text: script.sections[0].text, start: 0, end: duration }] };
    if (alignment) {
      if (timeline.alignmentMethod !== 'forced-alignment' || !alignment.evidence?.tool?.trim() || !alignment.evidence?.source?.trim()) fail('invalid-timeline', '导入录音对齐必须保留实际工具和结果出处');
      if (Math.abs(Number(timeline.duration) - duration) > 0.15 || timeline.segments.at(-1).end > duration + .15 || timeline.segments.some(s => s.text !== script.sections.find(p => p.id === s.sectionId)?.text)) fail('invalid-timeline', '导入时间轴与原文或真实录音时长不一致');
      if (brief.voice.requiredAlignment === 'word' && script.sections.some(s => !timeline.words.some(w => w.sectionId === s.id))) fail('invalid-timeline', '每个旁白段落都需要实际词边界');
      await atomic(join(dir, 'alignment-evidence.json'), alignment.evidence);
    }
    await atomic(join(dir, 'timeline.json'), timeline); await atomic(join(dir, 'captions.srt'), subtitles(captionCues(timeline))); return ['voiceover.wav', 'timeline.json', 'captions.srt', ...(alignment ? ['alignment-evidence.json'] : [])];
  }
  const tts = voiceOf(brief, settings);
  if (tts.provider === 'mimo') return synthesizeMimo(brief, script, materials, dir, settings, signal, onProcess, tts);
  const sampleRate = 24000, parts = [], timeline = { alignmentMethod: 'provider-word-boundary', sampleRate, duration: 0, segments: [], words: [] };
  let samples = 0;
  for (let index = 0; index < script.sections.length; index++) {
    signal?.throwIfAborted(); const section = script.sections[index], stem = join(dir, `part-${String(index + 1).padStart(3, '0')}`);
    await atomic(`${stem}.input.json`, { text: section.text, voice: tts.voice, rate: brief.voice.rate });
    await command(settings.python, [ttsAdapter, '--input', `${stem}.input.json`, '--output', `${stem}.mp3`], { signal, onProcess, timeoutMs: 180000 });
    await command(settings.ffmpeg, ['-y', '-v', 'error', '-i', `${stem}.mp3`, '-ar', String(sampleRate), '-ac', '1', '-f', 's16le', `${stem}.pcm`], { signal, onProcess });
    const pcm = await readFile(`${stem}.pcm`), count = pcm.length / 2, start = samples / sampleRate, end = (samples + count) / sampleRate;
    const events = await json(`${stem}.events.json`), words = events.filter(e => e.type === 'WordBoundary');
    if (!words.length && brief.voice.requiredAlignment === 'word') fail('word-boundary-required', '配音服务未返回词边界；原音频保留，请重试或明确改用句级对齐');
    if (!words.length) timeline.alignmentMethod = 'sentence-boundary';
    for (const word of words) { const ws = start + word.offset / 10000000, we = ws + word.duration / 10000000; if (we > end + 0.2) fail('boundary-out-of-range', '配音边界与实际音频时长不一致，未编造或压缩时间轴'); timeline.words.push({ sectionId: section.id, text: word.text, start: ws, end: Math.min(we, end) }); }
    timeline.segments.push({ sectionId: section.id, text: section.text, start, end }); parts.push(pcm); samples += count;
  }
  return finishVoice(dir, timeline, parts, samples, sampleRate, script, settings, signal, onProcess);
}

// MiMo returns whole utterances without timecodes, so every utterance is synthesized on its own
// and its real duration becomes the boundary. Nothing is interpolated from character counts.
const sentences = value => {
  const pieces = String(value).replace(/\s+/g, ' ').match(/[^。！？!?；;…\n]+[。！？!?；;…]*/g) || [];
  const kept = pieces.map(p => p.trim()).filter(Boolean);
  return kept.length ? kept : [String(value).trim()].filter(Boolean);
};
const styleOf = voice => { const match = /^([+-])(\d{1,3})%$/.exec(voice.rate || ''), percent = Number(match?.[2] ?? 0); return [voice.style, match && percent ? `语速${match[1] === '-' ? '放慢' : '加快'}约 ${percent}%` : ''].filter(Boolean).join('；'); };
async function synthesizeMimo(brief, script, materials, dir, settings, signal, onProcess, tts) {
  const token = String(settings.mimoApiKey || '').trim();
  if (!token) fail('mimo-token-required', 'MiMo 语音需要 API Token：请在媒体工作台 → 设置 → 制作偏好 → MiMo 语音中填写后重试');
  const model = settings.mimoModel || 'mimo-v2.5-tts', sampleRate = 24000, style = styleOf(brief.voice), parts = [];
  const sample = model === 'mimo-v2.5-tts-voiceclone' ? materials?.find(m => m.role === 'audio')?.absolutePath : undefined;
  if (model === 'mimo-v2.5-tts-voiceclone' && !sample) fail('mimo-sample-required', '音色复刻需要一段实际录音样本：请把音频作为素材导入本任务，或改用预置音色');
  const timeline = { alignmentMethod: 'sentence-boundary', sampleRate, duration: 0, segments: [], words: [] };
  let samples = 0;
  for (let index = 0; index < script.sections.length; index++) {
    const section = script.sections[index], start = samples / sampleRate, pieces = sentences(section.text);
    for (let position = 0; position < pieces.length; position++) {
      signal?.throwIfAborted();
      const stem = join(dir, `part-${String(index + 1).padStart(3, '0')}-${String(position + 1).padStart(2, '0')}`);
      await atomic(`${stem}.input.json`, { text: pieces[position], voice: tts.voice, model, style, ...(sample ? { sample } : {}) });
      await command(settings.python, [mimoAdapter, '--input', `${stem}.input.json`, '--output', `${stem}.wav`], { signal, onProcess, timeoutMs: 240000, env: { MIMO_API_KEY: token, MIMO_BASE_URL: settings.mimoBaseUrl || '' } });
      await command(settings.ffmpeg, ['-y', '-v', 'error', '-i', `${stem}.wav`, '-ar', String(sampleRate), '-ac', '1', '-f', 's16le', `${stem}.pcm`], { signal, onProcess });
      const pcm = await readFile(`${stem}.pcm`), count = pcm.length / 2, from = samples / sampleRate, to = (samples + count) / sampleRate;
      if (!count) fail('mimo-empty-audio', 'MiMo 返回了空音频；未写入时间轴');
      timeline.words.push({ sectionId: section.id, text: pieces[position], start: from, end: to });
      parts.push(pcm); samples += count;
    }
    timeline.segments.push({ sectionId: section.id, text: section.text, start, end: samples / sampleRate });
  }
  return finishVoice(dir, timeline, parts, samples, sampleRate, script, settings, signal, onProcess, { wrapCues: true, hideParts: true });
}
async function finishVoice(dir, timeline, parts, samples, sampleRate, script, settings, signal, onProcess, { wrapCues = false, hideParts = false } = {}) {
  timeline.duration = samples / sampleRate; validateTimeline(timeline, script);
  const cues = captionCues(timeline), text = wrapCues ? cues.map(c => ({ ...c, text: wrap(c.text, 18) })) : cues;
  await atomic(join(dir, 'voiceover.pcm'), Buffer.concat(parts));
  await command(settings.ffmpeg, ['-y', '-v', 'error', '-f', 's16le', '-ar', String(sampleRate), '-ac', '1', '-i', join(dir, 'voiceover.pcm'), join(dir, 'voiceover.wav')], { signal, onProcess });
  await atomic(join(dir, 'timeline.json'), timeline); await atomic(join(dir, 'captions.srt'), subtitles(text));
  const all = await readdir(dir);
  // Working audio and per-call inputs stay on disk for inspection but are not deliverables.
  return all.filter(n => !n.endsWith('.pcm') && !n.endsWith('.input.json') && !n.endsWith('.events.json') && !(hideParts && /^part-\d{3}-\d{2}\./.test(n)));
}

const filterPath = path => path.replace(/\\/g, '/').replace(/([\\':,;\[\]])/g, '\\$1');
const wrap = (s, n) => Array.from(s).reduce((lines, c) => { if ((lines.at(-1)?.length ?? n) >= n) lines.push(''); lines[lines.length - 1] += c; return lines; }, []).join('\n');
export function resolveComposition(project, directory) {
  const value = structuredClone(project), full = p => !p || isAbsolute(p) ? p : resolve(directory, p);
  value.audio = full(value.audio); value.music = full(value.music); value.captions = full(value.captions); if (value.motionProject) value.motionProject = full(value.motionProject);
  for (const scene of value.scenes) for (const material of scene.materials) material.path = full(material.path);
  return value;
}
export function portableComposition(project, directory) {
  const value = structuredClone(project), local = p => !p || !isAbsolute(p) ? p : relative(directory, p);
  value.audio = local(value.audio); value.music = local(value.music); value.captions = local(value.captions); if (value.motionProject) value.motionProject = local(value.motionProject);
  for (const scene of value.scenes) for (const material of scene.materials) material.path = local(material.path);
  return value;
}
export async function createComposition(brief, script, storyboard, materials, voice, dir, settings, signal, onProcess, finalDirectory = dir, presentation = {}) {
  const timeline = await json(voice.timeline); validateTimeline(timeline, script);
  const project = { schemaVersion: 1, backend: brief.render.backend, presentation, title: brief.title, width: brief.output.width, height: brief.output.height, fps: brief.output.fps, codec: brief.render.codec, brand: brief.brand,
    template: brief.render.template ?? null, templateVariables: brief.templateVariables ?? null,
    audio: voice.audio ?? null, music: materials.find(m => m.role === 'music')?.absolutePath ?? null, captions: voice.captions, timeline, scenes: storyboard.scenes.map(scene => {
      const cue = timeline.segments.find(s => s.sectionId === scene.sectionId), section = script.sections.find(s => s.id === scene.sectionId);
      return { ...scene, start: cue.start, end: cue.end, narration: section.text, materials: scene.materialIds.map(id => { const m = materials.find(x => x.id === id); return { id: m.id, path: m.absolutePath, mime: m.mime, role: m.role, attribution: m.url || m.attribution || m.name, sha256: m.sha256 }; }) };
    }), treatment: storyboard.treatment };
  await atomic(join(dir, 'composition.json'), portableComposition(project, finalDirectory)); await atomic(join(dir, 'treatment.md'), `# ${brief.title}\n\n${storyboard.treatment}\n\n${project.scenes.map(s => `## ${s.title}\n\n${s.visual}\n\n${s.start.toFixed(3)}–${s.end.toFixed(3)} 秒\n`).join('\n')}`);
  if (brief.render.backend === 'huashu') {
    const motion = await motionProject(project, dir, settings, signal, onProcess);
    project.motionProject = 'project'; await atomic(join(dir, 'composition.json'), portableComposition(project, finalDirectory));
    await muxMotion(motion.rawVideo, project, join(dir, 'preview.mp4'), settings, signal, onProcess);
    return ['composition.json', 'treatment.md', 'preview.mp4', 'motion-check.txt', ...(await recursiveFiles(join(dir, 'project'))).map(p => join('project', p))];
  }
  const previewOutput = join(dir, 'preview.mp4');
  await renderComposition(project, previewOutput, settings, { signal, onProcess, width: Math.min(960, project.width), preview: true });
  await atomic(join(dir, 'preview.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${htmlEscape(brief.title)}</title><style>body{margin:0;background:#111;color:#eee;font:16px system-ui}video{width:100%;max-height:90vh}p{padding:12px}</style><video controls src="preview.mp4"></video><p>${htmlEscape(storyboard.treatment)}</p></html>`);
  return ['composition.json', 'treatment.md', 'preview.mp4', 'preview.html'];
}
export async function renderComposition(project, output, settings, { signal, onProcess, width = project.width, preview = false } = {}) {
  const height = Math.round(project.height * width / project.width / 2) * 2, directory = join(dirname(output), preview ? 'preview-work' : 'render-work'); await mkdir(directory, { recursive: true });
  // 编码器一次解析、全程沿用：预览始终走 CPU，正式渲染按设置与实测能力决定。
  const codec = preview ? { codec: 'libx264', accelerated: false } : await resolveCodec(settings.ffmpeg, encodeRequest(project.codec, settings), { signal });
  let fontFile = settings.font;
  if (!fontFile && /[\u3000-\u9fff]/u.test(project.scenes.map(s => s.title + s.narration).join(''))) {
    try { const found = await command('fc-match', ['-f', '%{file}', 'Noto Sans CJK SC:lang=zh'], { signal, timeoutMs: 5000 }); fontFile = found.stdout.trim(); const languages = await command('fc-query', ['--format', '%{lang}', fontFile], { signal, timeoutMs: 5000 }); if (!/\bzh\b/.test(languages.stdout)) fail('cjk-font-required', '自动选择的字体不包含中文'); }
    catch { fail('cjk-font-required', '需要可读取的中文字体；请在设置中指定 Noto Sans CJK 等字体文件，避免方框字'); }
  }
  const clips = []; let i = 0;
  for (const scene of project.scenes) {
    signal?.throwIfAborted(); const duration = scene.end - scene.start; if (duration <= 0) fail('invalid-composition', '镜头时长无效');
    const visual = scene.materials.find(m => /^(image|video)\//.test(m.mime) && m.role !== 'logo') ?? scene.materials.find(m => m.mime.startsWith('image/'));
    const clip = join(directory, `scene-${++i}.mp4`), title = join(directory, `title-${i}.txt`), source = join(directory, `source-${i}.txt`);
    const fontSize = Math.max(18, Math.round(width / 28 * (project.presentation?.titleScale ?? 1)));
    await atomic(title, wrap(scene.title, Math.max(8, Math.floor(width * 0.8 / fontSize)))); await atomic(source, wrap(visual?.attribution ?? scene.materials[0]?.attribution ?? '来源见随片素材清单', Math.max(15, Math.floor(width / Math.max(10, width / 65)))));
    const args = ['-y', '-v', 'error'];
    if (visual?.mime.startsWith('video/')) args.push('-stream_loop', '-1', '-i', visual.path);
    else if (visual) args.push('-loop', '1', '-i', visual.path);
    else args.push('-f', 'lavfi', '-i', `color=c=${project.brand.primary.replace('#', '0x')}:s=${width}x${height}:r=${project.fps}`);
    const font = fontFile ? `:fontfile='${filterPath(fontFile)}'` : '';
    let filters = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x111827,setsar=1,fps=${project.fps}`;
    if (visual?.mime.startsWith('image/') && scene.motion !== 'hold') filters += `,zoompan=z='min(1+on*0.00035,1.04)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${width}x${height}:fps=${project.fps}`;
    const titleX = scene.motion === 'pan' ? `(w-tw)/2+${Math.round(width * .02)}*(1-min(t/${duration},1))` : '(w-tw)/2';
    const titleSize = scene.motion === 'push' ? `${fontSize}*(1+0.03*min(t/${duration},1))` : String(fontSize);
    filters += `,drawtext=textfile='${filterPath(title)}'${font}:fontcolor=white:fontsize='${titleSize}':x='${titleX}':y=h*0.08:box=1:boxcolor=black@0.6:boxborderw=10`;
    if (!visual) filters += `,drawtext=textfile='${filterPath(source)}'${font}:fontcolor=white:fontsize=${Math.max(11, Math.round(width / 65))}:x=(w-tw)/2:y=h*0.48`;
    args.push('-vf', filters, '-t', duration.toFixed(6), '-an', '-c:v', codec.codec, '-preset', preview ? 'ultrafast' : codec.accelerated ? 'p4' : 'medium', '-crf', preview ? '26' : '20', '-pix_fmt', 'yuv420p', clip);
    await command(settings.ffmpeg, args, { signal, onProcess, timeoutMs: 600000 }); clips.push(clip);
  }
  const list = join(directory, 'concat.txt'); await atomic(list, clips.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const args = ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list];
  if (project.audio) args.push('-i', project.audio);
  if (project.music) args.push('-stream_loop', '-1', '-i', project.music);
  const sub = `subtitles=filename='${filterPath(project.captions)}':force_style='FontSize=${project.presentation?.captionFontSize ?? 16},Outline=1,MarginV=${project.presentation?.captionMarginV ?? 12},MarginL=16,MarginR=16'`;
  args.push('-vf', sub, '-c:v', codec.codec, '-preset', preview ? 'ultrafast' : codec.accelerated ? 'p4' : 'medium', '-pix_fmt', 'yuv420p');
  if (project.audio && project.music) args.push('-filter_complex', '[1:a]aresample=24000[voice];[2:a]aresample=24000,volume=0.13[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=0[mix]', '-map', '0:v:0', '-map', '[mix]', '-c:a', 'aac', '-b:a', '160k');
  else if (project.audio || project.music) args.push('-map', '0:v:0', '-map', '1:a:0', ...(project.music ? ['-af', 'volume=0.2'] : []), '-c:a', 'aac', '-b:a', '160k'); else args.push('-an');
  args.push('-t', project.timeline.duration.toFixed(6), '-movflags', '+faststart', output);
  await command(settings.ffmpeg, args, { signal, onProcess, timeoutMs: 1200000 });
}
export async function inspectMedia(path, brief, settings, signal, { preview = false, expectedDuration } = {}) {
  const info = await probe(path, settings, signal), video = info.streams.find(s => s.codec_type === 'video'), audio = info.streams.find(s => s.codec_type === 'audio');
  const width = preview ? Math.min(960, brief.output.width) : brief.output.width, height = Math.round(brief.output.height * width / brief.output.width / 2) * 2;
  const [fpsN, fpsD] = String(video?.avg_frame_rate || '0/1').split('/').map(Number), fps = fpsN / fpsD;
  const checks = [
    { id: 'video-stream', label: '视频轨道', status: video ? 'pass' : 'fail', severity: 'error' },
    { id: 'dimensions', label: '实际分辨率', status: video?.width === width && video?.height === height ? 'pass' : 'fail', severity: 'error', detail: `${video?.width} × ${video?.height}` },
    { id: 'fps', label: '实际帧率', status: Math.abs(fps - brief.output.fps) < .05 ? 'pass' : 'fail', severity: 'error', detail: `${fps} fps` },
    { id: 'duration', label: '实际时长', status: Number(info.format.duration) > 0 ? 'pass' : 'fail', severity: 'error', detail: `${info.format.duration} 秒` },
    { id: 'audio-stream', label: '配音轨道', status: brief.voice.mode === 'none' || audio ? 'pass' : 'fail', severity: 'error', detail: brief.voice.mode === 'none' ? '本次需求约定无旁白' : audio ? '已读取实际音轨' : '缺少音轨' },
    { id: 'semantic-review', label: '画面语义与节奏', status: 'unknown', severity: 'info', detail: '媒体结构检查不能证明画面表达与节奏合适，请结合实际预览判断。' },
  ];
  if (Number.isFinite(expectedDuration)) checks.push({ id: 'timeline-duration', label: '成片与时间轴时长', status: Math.abs(Number(info.format.duration) - expectedDuration) <= Math.max(.15, 2 / brief.output.fps) ? 'pass' : 'fail', severity: 'error', detail: `媒体 ${info.format.duration} 秒，时间轴 ${expectedDuration.toFixed(3)} 秒` });
  if (audio) checks.push({ id: 'av-duration', label: '音画轨道时长', status: Number.isFinite(Number(audio.duration)) && Number.isFinite(Number(video?.duration)) ? Math.abs(Number(audio.duration) - Number(video.duration)) <= Math.max(.15, 2 / brief.output.fps) ? 'pass' : 'fail' : 'unknown', severity: 'error', detail: '仅检查轨道时长；不冒充对逐字内容的听觉验收' });
  return { info, checks };
}
export async function finalRender(project, dir, settings, brief, signal, onProcess) {
  await mkdir(dir, { recursive: true });
  if (brief.render.backend === 'huashu') { const raw = join(dir, 'motion-raw.mp4'); await motionRender(project, raw, settings, signal, onProcess); await muxMotion(raw, project, join(dir, 'final.mp4'), settings, signal, onProcess); }
  else await renderComposition(project, join(dir, 'final.mp4'), settings, { signal, onProcess });
  const result = await inspectMedia(join(dir, 'final.mp4'), brief, settings, signal, { expectedDuration: project.timeline.duration });
  if (result.checks.some(c => c.status === 'fail' && c.severity === 'error')) fail('media-qa-failed', '成片媒体检查失败', result);
  for (const [name, second] of [['cover.png', 0], ['frame-middle.png', Number(result.info.format.duration) / 2], ['frame-end.png', Math.max(0, Number(result.info.format.duration) - .15)]]) await command(settings.ffmpeg, ['-y', '-v', 'error', '-ss', String(second), '-i', join(dir, 'final.mp4'), '-frames:v', '1', join(dir, name)], { signal, onProcess });
  await atomic(join(dir, 'media-info.json'), result); return ['final.mp4', 'cover.png', 'frame-middle.png', 'frame-end.png', 'media-info.json'];
}
async function muxMotion(video, project, output, settings, signal, onProcess) {
  const args = ['-y', '-v', 'error', '-i', video];
  if (project.audio) args.push('-i', project.audio);
  if (project.music) args.push('-stream_loop', '-1', '-i', project.music);
  args.push('-map', '0:v:0', '-c:v', 'copy');
  if (project.audio && project.music) args.push('-filter_complex', '[1:a]aresample=24000[voice];[2:a]aresample=24000,volume=0.13[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=0[mix]', '-map', '[mix]', '-c:a', 'aac', '-b:a', '160k');
  else if (project.audio || project.music) args.push('-map', '1:a:0', ...(project.music ? ['-af', 'volume=0.2'] : []), '-c:a', 'aac', '-b:a', '160k'); else args.push('-an');
  args.push('-t', project.timeline.duration.toFixed(6), '-movflags', '+faststart', output);
  await command(settings.ffmpeg, args, { signal, onProcess, timeoutMs: 600000 });
}
