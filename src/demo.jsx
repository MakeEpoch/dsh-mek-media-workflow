import React from 'react';
import { createRoot } from 'react-dom/client';
import { App, Boundary } from './app.jsx';
import { createClient } from './client.js';

const connection = { rpc: { async call(channel, endpoint, payload, signal) {
  const response = await fetch(`${channel}/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: crypto.randomUUID(), method: endpoint, payload }), signal });
  if (!response.ok) throw new Error(`服务返回 HTTP ${response.status}`);
  return (await response.json()).result;
} } };
const client = createClient(connection), mode = new URL(location.href).searchParams.get('mode') === 'companion' ? 'companion' : 'workspace';
createRoot(document.getElementById('app')).render(<Boundary><App client={client} mode={mode} /></Boundary>);
