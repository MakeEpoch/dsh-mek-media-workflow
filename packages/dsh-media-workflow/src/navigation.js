export function readTabState(key) {
  try { return JSON.parse(globalThis.sessionStorage?.getItem(key) ?? 'null'); } catch { return null; }
}

export function writeTabState(key, value) {
  try {
    if (value === null) globalThis.sessionStorage?.removeItem(key);
    else globalThis.sessionStorage?.setItem(key, JSON.stringify(value));
  } catch { /* Browser privacy settings can disable storage. */ }
}

export function currentSession() {
  return new URL(globalThis.location?.href || 'http://localhost/').searchParams.get('session');
}

// Match the Bot panel's restore rules. DSH must have registered this panel first.
export function rememberPanel(layout, panel) {
  const info = layout?.panelInfo;
  if (!info) return;
  const key = `media-workflow:panel:${globalThis.location?.pathname || '/'}`;
  const saved = readTabState(key);
  if (saved?.active === true && saved.session === currentSession() && info.getSnapshot().activePanelId === null) {
    layout.selectPanel(panel);
  }
  const save = () => writeTabState(key, { active: info.getSnapshot().activePanelId === panel, session: currentSession() });
  save();
  return info.subscribe(save);
}
