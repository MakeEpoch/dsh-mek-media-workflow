import React, { useSyncExternalStore, useState } from 'react';
import { App, Boundary } from './app.jsx';
import { createClient } from './client.js';

export const name = 'dsh-media-workflow-client';
export const inject = ['connection', 'slots', 'layout', 'sidebarRight', 'sidebarRightTabs'];
export const PANEL_ID = 'media-workflow';
export const TAB_KIND = 'media-workflow';
export const TAB_ID = '@dsh/media-workflow';
const Icon = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3zM7 2v3m10-3v3M7 19v3m10-3v3" /></svg>;

export function apply(ctx) {
  ctx.effect(() => {
    const disposers = []; const client = createClient(ctx.connection); let stopped = false;
    const cleanup = () => { if (stopped) return; stopped = true; for (const stop of disposers.reverse()) { try { stop?.(); } catch {} } client.dispose(); };
    const wrap = component => props => <Boundary>{React.createElement(component, props)}</Boundary>;
    const expand = () => ctx.layout.selectPanel(PANEL_ID);
    const openCompanion = async (taskId) => {
      ctx.layout.selectPanel(null);
      const id = taskId || client.getSelected?.(), sessionId = ctx.sidebarRight.mounted.getSnapshot();
      if (id && sessionId) { await client.call('tasks.bind', { id, sessionId }); client.select?.(id, sessionId); }
      else if (id) client.select?.(id);
      ctx.sidebarRight.openTab(TAB_KIND);
    };
    const Main = wrap(() => <App client={client} onCompanion={openCompanion} />);
    const Companion = wrap(props => {
      const sessionId = useSyncExternalStore(listener => ctx.sidebarRight.mounted.subscribe(listener), () => ctx.sidebarRight.mounted.getSnapshot());
      return <App key={props.sessionId ?? sessionId ?? 'unbound'} client={client} mode="companion" sessionId={props.sessionId ?? sessionId ?? null} onExpand={expand} />;
    });
    const ReviewActions = ({ review }) => {
      const [error, setError] = useState('');
      const match = /^mw-review-([a-f0-9-]{36})-[a-f0-9]{24}$/.exec(review?.id || '');
      if (!match) return null;
      return <span><button type="button" onClick={() => { openCompanion(match[1]).catch(e => setError(e.message)); }}>查看产物 / 提出修改</button>{error && <small role="alert">{error}</small>}</span>;
    };
    try {
      disposers.push(ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, Main)));
      disposers.push(ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: 25, label: () => '媒体工作台' }, Icon)));
      disposers.push(ctx.sidebarRightTabs.register({ id: TAB_ID, kind: TAB_KIND, title: () => '媒体任务', keepMounted: false, guide: [{ id: 'media-workflow', order: 30, title: () => '媒体任务', description: () => '制作进度、评审和真实产物', icon: Icon }] }));
      disposers.push(ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({ name: 'sidebar.right.pane.tab', key: TAB_ID }, Companion)));
      disposers.push(ctx.slots.inject('conversation.plan-review.actions', () => ctx.slots.register({ name: 'conversation.plan-review.actions', id: TAB_ID, order: 30 }, wrap(ReviewActions))));
      disposers.push(ctx.on('connection/reset', () => client.reset()));
    } catch (error) { cleanup(); ctx.logger?.error?.(`媒体工作台注册失败：${error.message}`); }
    return cleanup;
  }, 'media-workflow: client');
}
