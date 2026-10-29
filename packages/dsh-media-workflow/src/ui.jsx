import React, { useId } from 'react';
export function Button({ primary, quiet, danger, className = '', children, ...props }) { return <button type="button" className={`mw-button ${primary ? 'mw-primary' : ''} ${quiet ? 'mw-quiet' : ''} ${danger ? 'mw-danger' : ''} ${className}`} {...props}>{children}</button>; }
export function Badge({ status, children }) { return <span className={`mw-badge ${['complete', 'verified', 'pass', 'available'].includes(status) ? 'good' : ['failed', 'fail', 'corrupt'].includes(status) ? 'bad' : ['needs_review', 'needs_check', 'blocked', 'waiting_for_login', 'unknown', 'unavailable'].includes(status) ? 'warn' : ''}`}>{children || status}</span>; }
export function Field({ label, children }) { const id = useId(); return <div><label className="mw-label" htmlFor={id}>{label}</label>{React.cloneElement(children, { id })}</div>; }
export const MODES = { none: '免阶段评审', gates: '四关评审', steps: '逐步评审' };
export const STATUS = { draft: '草稿', ready: '待执行', running: '制作中', publishing: '发布中', needs_review: '等你评审', blocked: '需要补充', failed: '执行失败', pausing: '暂停中', paused: '已暂停', complete: '已完成', needs_check: '发布待核验', corrupt: '文件需检查' };
export const artifactLabel = file => ({ 'article.html': '排版文章', 'gallery.html': '图文阅读预览', 'article.md': '完整正文与配图说明', 'publication.json': '可编辑排版工程', 'layout.json': '编排方案', 'layout.md': '编排说明', 'sources.json': '出处与待核实', 'brief.json': '制作需求', 'brief.md': '需求说明', 'materials.json': '来源与事实', 'materials.md': '素材清单', 'script.json': '内容脚本', 'script.md': '文稿', 'storyboard.json': '分镜', 'storyboard.md': '分镜稿', 'timeline.json': '配音时间轴', 'preview.mp4': '画面预览', 'final.mp4': '最终成片', 'cover.png': '封面', 'qa.json': '检查报告', 'package.json': '发布文案', 'render-project.json': '可编辑工程', 'stage-edit.json': '本版修改' })[file.name] || file.name;
export function nextAction(task) {
  if (task.archivedAt) return { title: '任务已归档', action: '查看归档任务', detail: '归档只隐藏任务；恢复后进度、评审和产物都保持原样。' };
  if (task.pendingReview) return { title: task.pendingReview.step === 'publish' ? '确认发布内容与账号' : '查看本次评审', action: '查看评审', detail: '已有产物等待你的决定，通过后继续制作。' };
  if (task.status === 'draft') return { title: '补齐需求，开始制作', action: '编辑需求', detail: '资料、交付规格和本次评审方式会在开始前一起确认。' };
  if (task.status === 'complete' && task.workType && task.workType !== 'video') return { title: '作品和工程已准备好', action: '查看作品', detail: '可以阅读文章、查看有序图片、下载工程，或检查交付记录。' };
  if (task.status === 'complete') return { title: '成片和工程已准备好', action: '查看成片', detail: '可以播放成片、下载工程，或查看发布结果。' };
  if (task.status === 'needs_check') return { title: '核查原发布请求', action: '核验结果', detail: '发布结果尚未确认，请检查原请求后再决定。' };
  if (task.status === 'blocked' && ['generation-required', 'model-required'].includes(task.error?.code)) return { title: '等待内容输入', action: '查看输入要求', detail: '可在当前对话中继续脚本或分镜；也可在制作偏好中设置独立内容模型。' };
  if (task.status === 'blocked' || task.status === 'failed' || task.status === 'corrupt') return { title: task.error?.message || '有一项内容需要处理', action: '处理问题', detail: '已有产物会保留，从当前阶段继续。' };
  if (task.status === 'paused') return { title: '任务已暂停', action: '继续制作', detail: '已完成的步骤和审批会继续复用。' };
  if (task.status === 'ready') return { title: '已准备好，等待执行', action: '继续制作', detail: '从已保存的阶段输入和产物继续。' };
  if (task.status === 'pausing') return { title: '正在暂停', action: '查看进度', detail: '等待实际执行进程停止，已有记录会保留。' };
  return { title: task.status === 'publishing' ? '正在等待平台回执' : '正在制作', action: '查看进度', detail: '可以先处理其他事情；需要评审时再回来。' };
}
