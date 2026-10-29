#!/usr/bin/env python3
"""Local OCR and real audio transcription. Never estimates word boundaries."""
import argparse
import importlib.metadata
import json
import os
import sys


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--check', action='store_true')
    p.add_argument('--ocr')
    p.add_argument('--asr')
    p.add_argument('--model', default='base')
    p.add_argument('--download', action='store_true')
    p.add_argument('--cache')
    p.add_argument('--language', default='auto')
    a = p.parse_args()
    if a.check:
        result = {}
        for name in ['rapidocr-onnxruntime', 'faster-whisper', 'Pillow']:
            try:
                result[name] = importlib.metadata.version(name)
            except importlib.metadata.PackageNotFoundError:
                result[name] = None
        print(json.dumps({'ok': all(result.values()), 'versions': result}))
        return
    if a.download:
        from faster_whisper.utils import download_model
        print(json.dumps({'model': download_model(a.model, output_dir=a.cache)}))
        return
    if a.ocr:
        from rapidocr_onnxruntime import RapidOCR
        # Bound threads on workstations; no GPU or system-level configuration.
        engine = RapidOCR(intra_op_num_threads=2, inter_op_num_threads=1)
        rows, _ = engine(a.ocr)
        entries = [{'box': box, 'text': value, 'confidence': float(score)} for box, value, score in (rows or [])]
        print(json.dumps({'tool': 'rapidocr-onnxruntime', 'version': importlib.metadata.version('rapidocr-onnxruntime'), 'text': '\n'.join(r['text'] for r in entries), 'lines': entries, 'verification': 'machine-ocr-unverified'}, ensure_ascii=False))
        return
    if a.asr:
        from faster_whisper import WhisperModel
        # Runtime never downloads models implicitly. Setup explicitly prepares the chosen directory.
        if not os.path.isdir(a.model):
            raise ValueError('ASR model directory is missing; run the explicit media runtime setup first')
        model = WhisperModel(a.model, device='cpu', compute_type='int8', cpu_threads=2, num_workers=1, local_files_only=True)
        segments, info = model.transcribe(a.asr, language=None if a.language == 'auto' else a.language, word_timestamps=True, vad_filter=True, condition_on_previous_text=False, beam_size=5)
        rows = []
        for s in segments:
            rows.append({'start': s.start, 'end': s.end, 'text': s.text, 'avgLogprob': s.avg_logprob, 'noSpeechProbability': s.no_speech_prob, 'words': [{'text': w.word, 'start': w.start, 'end': w.end, 'probability': w.probability} for w in (s.words or [])]})
        print(json.dumps({'tool': 'faster-whisper', 'version': importlib.metadata.version('faster-whisper'), 'model': a.model, 'language': info.language, 'languageProbability': info.language_probability, 'duration': info.duration, 'text': '\n'.join(s['text'] for s in rows), 'segments': rows, 'alignmentMethod': 'asr-word-timestamps', 'verification': 'machine-transcript-unverified'}, ensure_ascii=False))
        return
    p.error('choose --check, --ocr, --asr, or --download')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
