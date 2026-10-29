#!/usr/bin/env python3
"""MiMo-TTS adapter (OpenAI-compatible /chat/completions). Only provider audio is saved.

The MiMo speech models return audio without word timing, so this adapter never emits
boundary events; callers that need alignment must derive sentence boundaries from real
per-sentence audio instead of fabricating word offsets.
"""
import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_BASE_URL = 'https://api.xiaomimimo.com/v1'
DEFAULT_MODEL = 'mimo-v2.5-tts'
PRESET_VOICES = ['mimo_default', '冰糖', '茉莉', '苏打', '白桦', 'Mia', 'Chloe', 'Milo', 'Dean']
SUPPORTED_MODELS = ['mimo-v2.5-tts', 'mimo-v2.5-tts-voicedesign', 'mimo-v2.5-tts-voiceclone']
SAMPLE_MIME = {'.mp3': 'audio/mpeg', '.wav': 'audio/wav'}
MAX_SAMPLE_BYTES = 10 * 1024 * 1024


def credentials():
    key = os.environ.get('MIMO_API_KEY', '').strip()
    base = (os.environ.get('MIMO_BASE_URL') or DEFAULT_BASE_URL).strip().rstrip('/')
    return key, base


def request(url, key, payload=None, timeout=20):
    data = None if payload is None else json.dumps(payload).encode('utf8')
    headers = {'Authorization': f'Bearer {key}', 'Accept': 'application/json'}
    if data is not None:
        headers['Content-Type'] = 'application/json'
    probe = urllib.request.Request(url, data=data, headers=headers, method='POST' if data is not None else 'GET')
    try:
        with urllib.request.urlopen(probe, timeout=timeout) as response:
            return json.loads(response.read().decode('utf8') or '{}')
    except urllib.error.HTTPError as error:
        detail = error.read().decode('utf8', 'replace').strip()[:600]
        raise RuntimeError(f'MiMo 接口返回 {error.code}：{detail or error.reason}')
    except urllib.error.URLError as error:
        raise RuntimeError(f'无法连接 MiMo 接口 {url}：{error.reason}')


def check():
    key, base = credentials()
    if not key:
        print(json.dumps({'ok': False, 'version': 'mimo-tts', 'details': '未配置 MiMo API Token，请在媒体工作台设置中填写'}, ensure_ascii=False))
        sys.exit(2)
    try:
        listing = request(f'{base}/models', key, timeout=10)
    except RuntimeError as error:
        message = str(error)
        # A reachable endpoint without a model listing is still usable; a rejected token is not.
        if re.search(r'接口返回 (404|405)', message):
            print(json.dumps({'ok': True, 'version': 'mimo-tts', 'baseUrl': base, 'models': SUPPORTED_MODELS, 'voices': PRESET_VOICES,
                              'details': f'已连接 {base}；该端点未提供模型列表，合成时按所选模型调用'}, ensure_ascii=False))
            return
        print(json.dumps({'ok': False, 'version': 'mimo-tts', 'baseUrl': base, 'details': message}, ensure_ascii=False))
        sys.exit(2)
    models = [item.get('id') for item in listing.get('data', []) if isinstance(item, dict) and item.get('id')]
    print(json.dumps({'ok': True, 'version': 'mimo-tts', 'baseUrl': base, 'models': models, 'voices': PRESET_VOICES,
                      'details': f'已连接 {base}；可用模型 {len(models)} 个' if models else f'已连接 {base}'}, ensure_ascii=False))


def sample_data_uri(path):
    file = Path(path).expanduser()
    if not file.is_file():
        raise RuntimeError(f'音色复刻样本不存在：{path}')
    mime = SAMPLE_MIME.get(file.suffix.lower())
    if not mime:
        raise RuntimeError('音色复刻样本仅支持 mp3 或 wav 文件')
    if file.stat().st_size > MAX_SAMPLE_BYTES:
        raise RuntimeError('音色复刻样本超过 10 MB 上限')
    return f'data:{mime};base64,' + base64.b64encode(file.read_bytes()).decode('ascii')


def payload_for(spec):
    model = spec.get('model') or DEFAULT_MODEL
    text = (spec.get('text') or '').strip()
    if not text:
        raise RuntimeError('合成文本为空')
    style = (spec.get('style') or '').strip() or '自然、清晰、平稳地朗读，不加多余的语气词'
    audio = {'format': 'wav'}
    if model == 'mimo-v2.5-tts-voicedesign':
        messages = [{'role': 'user', 'content': style or '自然、清晰的中文普通话音色，语气平稳'}]
        audio['optimize_text_preview'] = False
    elif model == 'mimo-v2.5-tts-voiceclone':
        if not spec.get('sample'):
            raise RuntimeError('音色复刻需要音频样本；请导入 mp3/wav 样本，或改用预置音色')
        audio['voice'] = sample_data_uri(spec['sample'])
        messages = [{'role': 'user', 'content': style}, {'role': 'assistant', 'content': text}]
    else:
        voice = (spec.get('voice') or 'mimo_default').strip()
        audio['voice'] = voice
        messages = [{'role': 'user', 'content': style}, {'role': 'assistant', 'content': text}]
    return {'model': model, 'messages': messages, 'audio': audio, 'stream': False}


def synthesize(spec, output):
    key, base = credentials()
    if not key:
        raise RuntimeError('未配置 MiMo API Token；请在媒体工作台 → 设置 → 制作偏好中填写')
    # Reused across calls in one task; never logged, never written to the task directory.
    payload = payload_for(spec)
    timeout = float(os.environ.get('MIMO_TTS_TIMEOUT') or 180)
    result = request(f'{base}/chat/completions', key, payload, timeout=timeout)
    choices = result.get('choices') or []
    audio = ((choices[0] or {}).get('message') or {}).get('audio') if choices else None
    encoded = (audio or {}).get('data')
    if not encoded:
        message = (result.get('error') or {}).get('message') if isinstance(result.get('error'), dict) else result.get('error')
        raise RuntimeError(f'MiMo 没有返回音频{f"：{message}" if message else ""}')
    data = base64.b64decode(encoded)
    if not data:
        raise RuntimeError('MiMo 没有返回音频')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(data)
    print(json.dumps({'audio': str(output), 'bytes': len(data), 'events': 0, 'model': payload['model'],
                      'voice': payload['audio'].get('voice', 'voice-design'), 'format': payload['audio']['format']}, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--input')
    parser.add_argument('--output')
    args = parser.parse_args()
    if args.check:
        check()
        return
    if not args.input or not args.output:
        parser.error('--input 和 --output 为必填项')
    synthesize(json.loads(Path(args.input).read_text(encoding='utf8')), Path(args.output))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:  # noqa: BLE001 - surfaced verbatim to the workflow step
        print(json.dumps({'error': str(error)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
