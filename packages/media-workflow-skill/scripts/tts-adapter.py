#!/usr/bin/env python3
"""Edge word-boundary adapter. No audio or timing is fabricated on failure."""
import argparse
import asyncio
import importlib.metadata
import json
import os
import sys
from pathlib import Path

for candidate in [os.environ.get('EDGE_TTS_PYTHONPATH', ''), str(Path.home() / '.local/share/edge-tts/lib')]:
    if candidate and Path(candidate).is_dir():
        sys.path.insert(0, candidate)


async def synthesize(spec, output):
    import edge_tts
    import inspect
    if 'boundary' not in inspect.signature(edge_tts.Communicate).parameters:
        raise RuntimeError('此 edge-tts 版本不支持显式词边界；请升级或提供实际对齐时间轴')
    communication = edge_tts.Communicate(spec['text'], spec['voice'], rate=spec.get('rate', '+0%'), boundary='WordBoundary')
    events = []
    with output.open('wb') as audio:
        async for chunk in communication.stream():
            if chunk['type'] == 'audio':
                audio.write(chunk['data'])
            elif chunk['type'] in ('WordBoundary', 'SentenceBoundary'):
                events.append({k: v for k, v in chunk.items() if k != 'data'})
    if output.stat().st_size == 0:
        raise RuntimeError('配音服务没有返回音频')
    output.with_suffix('.events.json').write_text(json.dumps(events, ensure_ascii=False, indent=2), encoding='utf8')
    print(json.dumps({'audio': str(output), 'events': len(events), 'version': importlib.metadata.version('edge-tts')}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--input')
    parser.add_argument('--output')
    args = parser.parse_args()
    if args.check:
        import edge_tts
        import inspect
        word = 'boundary' in inspect.signature(edge_tts.Communicate).parameters
        print(json.dumps({'version': importlib.metadata.version('edge-tts'), 'wordBoundary': word}))
        if not word:
            sys.exit(2)
        return
    if not args.input or not args.output:
        parser.error('--input 和 --output 为必填项')
    asyncio.run(synthesize(json.loads(Path(args.input).read_text(encoding='utf8')), Path(args.output)))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'error': str(error)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
