#!/usr/bin/env node
import { WorkflowRunner } from '../lib/runner.mjs';
import { fail } from '../lib/common.mjs';
import { args, cli } from './args.mjs';
const a = args();
cli(async () => { const runner = new WorkflowRunner({ root: a.root }), task = await runner.store.read(a.task); if (!task.state.steps.find(s => s.key === 'package').artifactDigest) fail('package-required', '发布前需要完成成片及平台包装'); return a.receipt ? runner.verify(a.task, a.receipt) : runner.run(a.task); });
