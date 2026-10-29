#!/usr/bin/env node
import { main } from './workflow.mjs';
import { args, cli } from './args.mjs';
const a = args(); a._.unshift('review'); cli(() => main(a));
