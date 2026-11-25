// Generated DSH ModuleLoader bundle.
window.__ModuleLoader__.load({id:"dsh-mek-media-workflow",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.jsx
var index_exports = {};
__export(index_exports, {
  PANEL_ID: () => PANEL_ID,
  TAB_ID: () => TAB_ID,
  TAB_KIND: () => TAB_KIND,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);
var import_react11 = __toESM(require("react"), 1);

// src/time.js
function formatShortTime(value, { month = "numeric", empty = "", timeZone } = {}) {
  if (!value) return empty;
  const options = { month, day: month, hour: "2-digit", minute: "2-digit", ...timeZone ? { timeZone } : {} };
  return new Intl.DateTimeFormat("zh-CN", options).format(new Date(value));
}

// src/app.jsx
var import_react10 = __toESM(require("react"), 1);

// embedded-skill/workflow.json
var workflow_default = {
  schemaVersion: 1,
  version: "0.1.0",
  steps: [
    { key: "brief", label: "\u9700\u6C42\u4E0E\u4E8B\u5B9E\u57FA\u7EBF", gate: true, dependencies: [], output: "\u9700\u6C42\u3001\u9A8C\u6536\u6807\u51C6\u3001\u4E8B\u5B9E\u57FA\u7EBF" },
    { key: "materials", label: "\u7D20\u6750\u6574\u7406", gate: false, dependencies: ["brief"], output: "\u771F\u5B9E\u7D20\u6750\u3001\u6765\u6E90\u4E0E\u4E8B\u5B9E\u6838\u5BF9\u8868" },
    { key: "script", label: "\u5185\u5BB9\u811A\u672C", gate: false, dependencies: ["materials"], output: "\u65C1\u767D\u3001\u5B57\u5E55\u6587\u6848\u4E0E\u6765\u6E90\u5F15\u7528" },
    { key: "storyboard", label: "\u5206\u955C", gate: true, dependencies: ["script", "materials"], output: "\u955C\u5934\u3001\u753B\u9762\u3001\u65F6\u957F\u4E0E\u7D20\u6750\u5F15\u7528" },
    { key: "voice", label: "\u914D\u97F3\u4E0E\u65F6\u95F4\u8F74", gate: false, dependencies: ["script", "storyboard"], output: "\u771F\u5B9E\u97F3\u9891\u3001\u5B57\u5E55\u4E0E\u8FB9\u754C\u65F6\u95F4\u8F74" },
    { key: "composition", label: "\u89C6\u89C9\u5408\u6210", gate: false, dependencies: ["storyboard", "materials", "voice"], output: "\u53EF\u7F16\u8F91\u5DE5\u7A0B\u4E0E\u573A\u666F\u9884\u89C8" },
    { key: "qa", label: "\u9884\u89C8\u8D28\u68C0", gate: false, dependencies: ["composition", "voice", "materials"], output: "\u68C0\u67E5\u7ED3\u679C\u3001\u8BC1\u636E\u4E0E\u5F85\u6838\u5B9E\u9879" },
    { key: "render", label: "\u6B63\u5F0F\u6E32\u67D3", gate: true, dependencies: ["qa", "composition", "voice"], output: "\u6210\u7247\u3001\u7B2C\u4E00\u5E27\u3001\u5A92\u4F53\u4FE1\u606F\u4E0E\u6700\u7EC8\u68C0\u67E5" },
    { key: "package", label: "\u53D1\u5E03\u5305\u88C5", gate: false, dependencies: ["render", "script"], output: "\u5206\u5E73\u53F0\u6807\u9898\u3001\u6B63\u6587\u3001\u5C01\u9762\u4E0E\u58F0\u660E" },
    { key: "publish", label: "\u53D1\u5E03\u4E0E\u56DE\u6267", gate: true, dependencies: ["package", "render"], output: "\u9010\u5E73\u53F0\u63D0\u4EA4\u8BB0\u5F55\u4E0E\u6838\u9A8C\u51ED\u636E" }
  ]
};

// embedded-skill/lib/profiles.mjs
var workType = (value) => value?.brief?.work?.type ?? value?.work?.type ?? value?.workType ?? "video";
var publication = (type) => ({
  schemaVersion: 1,
  version: "publication-v1",
  type,
  steps: workflow_default.steps.filter((s) => s.key !== "voice").map((s) => ({ ...s, dependencies: s.dependencies.filter((d) => d !== "voice"), ...{
    script: { label: type === "article" ? "\u6587\u7AE0\u5199\u4F5C" : "\u56FE\u6587\u6587\u6848", output: "\u5B8C\u6574\u6B63\u6587\u3001\u6765\u6E90\u5F15\u7528\u4E0E\u4E8B\u5B9E\u4F9D\u636E" },
    storyboard: { label: type === "article" ? "\u6587\u7AE0\u7F16\u6392" : "\u5206\u9875\u8BBE\u8BA1", output: "\u5185\u5BB9\u987A\u5E8F\u3001\u6807\u9898\u5C42\u7EA7\u3001\u56FE\u6587\u5E03\u5C40\u4E0E\u914D\u56FE\u5F15\u7528" },
    composition: { label: "\u6392\u7248\u9884\u89C8", output: "\u53EF\u7F16\u8F91\u6392\u7248\u4E0E\u5B9E\u9645\u9605\u8BFB\u9884\u89C8" },
    render: { label: "\u6B63\u5F0F\u4EA4\u4ED8", output: type === "article" ? "\u6587\u7AE0 HTML\u3001Markdown\u3001\u53EF\u7F16\u8F91\u5DE5\u7A0B\u4E0E\u51FA\u5904\u6E05\u5355" : "\u6709\u5E8F PNG \u56FE\u7247\u3001\u9605\u8BFB\u9884\u89C8\u3001\u914D\u6587\u4E0E\u53EF\u7F16\u8F91\u5DE5\u7A0B" }
  }[s.key] ?? {} }))
});
var PROFILES = { video: { ...workflow_default, type: "video" }, article: publication("article"), "image-post": publication("image-post") };
var workflowFor = (value) => value?.state?.workflowProfile ?? value?.workflowProfile ?? PROFILES[typeof value === "string" ? value : workType(value)] ?? PROFILES.video;
var stepsFor = (value) => workflowFor(value).steps;

// src/styles.js
var CSS = `
/* \u4EA4\u4E92\u98CE\u683C\u5438\u6536\u81EA woniuniuniu/dsh-media-desk\uFF08MIT\uFF09\u3002\u989C\u8272\u4F18\u5148\u8D70 DSH \u8BED\u4E49 token\uFF0C
   \u5BBF\u4E3B\u65E0\u5BF9\u5E94 token \u65F6\u56DE\u9000\u5230 light-dark() \u81EA\u5E26\u8272\u677F\uFF0C\u4FDD\u8BC1\u72EC\u7ACB\u6E32\u67D3\u4E5F\u4E0D\u584C\u3002 */
.mw{
  --mw-bg:var(--dsw-alias-bg-base,light-dark(#f8f8f7,#191919));
  --mw-surface:var(--dsw-alias-bg-layer-2,light-dark(#fff,#232323));
  --mw-text:var(--dsw-alias-label-primary,light-dark(#242423,#f2f2f1));
  --mw-muted:var(--dsw-alias-label-secondary,light-dark(#696967,#b4b4b1));
  --mw-line:var(--dsw-alias-border-l2,light-dark(#e8e8e5,#383837));
  --mw-line-strong:var(--dsw-alias-border-l4,light-dark(#d2d2ce,#555553));
  --mw-accent:var(--dsw-alias-link,light-dark(#315abb,#a8c1ff));
  --mw-soft:color-mix(in srgb,var(--mw-accent) 12%,transparent);
  --mw-button:var(--dsw-alias-button-primary-fill,light-dark(#252524,#f0f0ed));
  --mw-button-text:var(--dsw-alias-label-primary-inverted,light-dark(#fff,#1b1b1a));
  --mw-hover:var(--dsw-alias-interactive-bg-hover,light-dark(#eeeeeb,#30302f));
  --mw-good:light-dark(#226849,#94dbb7);
  --mw-good-bg:light-dark(#e9f6ef,#223e32);
  --mw-warn:light-dark(#845800,#f3ca78);
  --mw-warn-bg:light-dark(#fff5df,#44351e);
  --mw-bad:light-dark(#aa3540,#ffa8b0);
  --mw-bad-bg:light-dark(#fff0f1,#452b33);
  --mw-ease:cubic-bezier(.2,.8,.2,1);
  --mw-r-sm:var(--dsw-radius-sm,8px);
  --mw-r-md:var(--dsw-radius-md,12px);
  --mw-r-lg:var(--dsw-radius-lg,16px);
  --mw-button-hover:var(--dsw-alias-button-primary-hover,light-dark(#3d3d3b,#d9d9d6));
  --mw-control:color-mix(in srgb,var(--mw-text) 4%,var(--mw-surface));
  color:var(--mw-text);
  background:var(--mw-bg);
  font:14px/1.6 var(--dsw-font-family,system-ui,sans-serif);
  height:100%;
  min-height:0;
  min-width:0;
  display:flex;
  flex-direction:column;
  container-type:inline-size;
  -webkit-font-smoothing:antialiased;
}
.mw *{box-sizing:border-box}.mw button,.mw input,.mw select,.mw textarea{font:inherit}.mw button,.mw a{touch-action:manipulation}.mw button{cursor:pointer}.mw button:disabled{cursor:default;opacity:.55}.mw h2{font-size:21px;font-weight:600;margin:0}.mw h3{font-size:16px;font-weight:600;margin:0 0 12px}.mw h4{font-size:14px;margin:0 0 8px}.mw p{margin:0 0 12px}.mw a{color:var(--mw-accent);overflow-wrap:anywhere}.mw small,.mw .mw-muted{color:var(--mw-muted);font-size:12px}.mw .mw-row{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.mw .mw-between{justify-content:space-between}.mw .mw-grow{flex:1;min-width:0}.mw .mw-icon{font-size:18px;line-height:1}.mw .mw-badge{display:inline-flex;align-items:center;background:var(--mw-soft);color:var(--mw-accent);font-size:12px;padding:2px 7px;border-radius:5px;white-space:normal}.mw .mw-badge.good{background:var(--mw-good-bg);color:var(--mw-good)}.mw .mw-badge.warn{background:var(--mw-warn-bg);color:var(--mw-warn)}.mw .mw-badge.bad{background:var(--mw-bad-bg);color:var(--mw-bad)}
.mw .mw-content{padding:22px;overflow:auto;min-height:0;flex:1}.mw .mw-notice,.mw .mw-error{margin:12px 0;padding:12px 14px;border-radius:8px;background:var(--mw-soft);color:var(--mw-accent);overflow-wrap:anywhere}.mw .mw-error{background:var(--mw-bad-bg);color:var(--mw-bad)}.mw .mw-help{background:var(--mw-warn-bg);color:var(--mw-warn);border-radius:8px;padding:13px;margin:14px 0}.mw .mw-empty{padding:40px 10px;text-align:center}.mw .mw-empty p{max-width:500px;margin:10px auto 18px}.mw .mw-task{padding:16px 0;border-bottom:1px solid var(--mw-line)}.mw .mw-task h3{margin-bottom:4px}.mw .mw-toolbar{margin-bottom:18px}.mw .mw-field{width:100%;min-width:0;border:1px solid var(--mw-line);border-radius:7px;background:var(--mw-surface);color:var(--mw-text);padding:9px 10px}.mw textarea.mw-field{min-height:100px;resize:vertical}.mw .mw-label{display:block;font-size:12px;color:var(--mw-muted);margin-bottom:6px}.mw .mw-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.mw .mw-full{grid-column:1/-1}.mw .mw-section{padding-bottom:21px;border-bottom:1px solid var(--mw-line);margin-bottom:21px}.mw .mw-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.mw .mw-choice{display:block;background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:8px;padding:12px;cursor:pointer}.mw .mw-choice:has(input:checked){background:var(--mw-soft);border-color:var(--mw-accent)}.mw .mw-choice small{display:block;margin-top:6px}.mw .mw-choice input,.mw .mw-check input{accent-color:var(--mw-accent)}.mw .mw-check{display:flex;align-items:flex-start;gap:8px}.mw .mw-check input{margin-top:5px}.mw .mw-upload{padding:12px 0;border-bottom:1px solid var(--mw-line)}.mw .mw-upload input[type=file]{max-width:100%}.mw .mw-file-row{display:grid;grid-template-columns:minmax(0,1fr) 130px 32px;gap:8px;margin-top:9px;align-items:center}.mw .mw-file-row span{overflow-wrap:anywhere}.mw fieldset{padding:0;margin:0;border:0;min-width:0}
.mw .mw-work-top{margin-bottom:17px}.mw .mw-progress{display:flex;gap:4px;margin-top:10px;max-width:260px}.mw .mw-progress span{height:4px;background:var(--mw-line);flex:1;border-radius:3px}.mw .mw-progress span.done{background:var(--mw-accent)}.mw .mw-work-grid{display:grid;grid-template-columns:174px minmax(0,1fr);gap:20px;min-width:0}.mw .mw-steps{display:flex;flex-direction:column;gap:3px}.mw .mw-step{display:flex;align-items:center;text-align:left;gap:8px;padding:8px;border:0;border-radius:7px;background:none;color:var(--mw-muted)}.mw .mw-step[aria-current=step]{background:var(--mw-soft);color:var(--mw-accent)}.mw .mw-step-number{border-radius:50%;background:var(--mw-surface);width:22px;height:22px;display:grid;place-items:center;font-size:12px;flex:none}.mw .mw-step-name{flex:1}.mw .mw-step-mark{font-size:11px}.mw .mw-stage{min-width:0}.mw .mw-stage-header{margin-bottom:14px}.mw .mw-step-select{display:none;margin-bottom:15px}.mw .mw-tabs{display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid var(--mw-line);padding-bottom:10px;margin-bottom:16px}.mw .mw-tabs button{border:0;border-radius:5px;padding:5px 9px;background:none;color:var(--mw-muted)}.mw .mw-tabs button[aria-selected=true]{background:var(--mw-soft);color:var(--mw-accent)}.mw .mw-artifact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px}.mw .mw-artifact{border:1px solid var(--mw-line);border-radius:9px;background:var(--mw-surface);color:var(--mw-text);padding:12px;text-align:left;min-width:0}.mw .mw-artifact[aria-pressed=true]{border-color:var(--mw-accent)}.mw .mw-artifact strong{display:block;overflow-wrap:anywhere}.mw .mw-artifact img{width:100%;height:110px;object-fit:contain;background:var(--mw-bg);border-radius:5px;margin-bottom:8px}.mw .mw-artifact .mw-file-type{height:60px;display:grid;place-items:center;color:var(--mw-muted);background:var(--mw-bg);border-radius:5px;margin-bottom:9px}.mw .mw-artifact small{display:block}.mw .mw-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,38%);gap:16px;align-items:start}.mw .mw-preview{background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:9px;padding:14px;min-width:0}.mw .mw-preview img,.mw .mw-preview video,.mw .mw-preview audio{width:100%;max-height:65vh;object-fit:contain;display:block}.mw .mw-preview audio{margin:16px 0}.mw .mw-preview pre,.mw .mw-diff pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.7 ui-monospace,monospace;margin:12px 0;max-height:60vh;overflow:auto}.mw .mw-preview .mw-source{margin-top:12px;font-size:12px;overflow-wrap:anywhere}.mw .mw-preview details{margin-top:12px;overflow-wrap:anywhere;font-size:12px}.mw .mw-preview summary{cursor:pointer}.mw .mw-script-section,.mw .mw-scene,.mw .mw-fact{padding:13px 0;border-bottom:1px solid var(--mw-line)}.mw .mw-scene:first-child{padding-top:0}.mw .mw-shot{display:flex;gap:16px;align-items:flex-start}.mw .mw-shot-text{flex:1;min-width:0}.mw .mw-shot-text h4{margin:0 0 6px}.mw .mw-shot-text strong{color:var(--mw-muted)}.mw .mw-shot-media{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;max-width:200px}.mw .mw-shot-media img,.mw .mw-shot-media video{width:184px;height:auto;max-height:340px;object-fit:contain;border-radius:8px;border:1px solid var(--mw-line);display:block;background:#000;cursor:zoom-in}.mw .mw-lightbox{position:fixed;inset:0;background:rgba(8,10,14,.78);display:flex;align-items:center;justify-content:center;z-index:80;cursor:zoom-out;padding:24px}.mw .mw-lightbox img{max-width:min(92vw,560px);max-height:92vh;border-radius:12px;background:#000;box-shadow:0 18px 60px rgba(0,0,0,.5)}.mw .mw-shot-file{font-size:12px;word-break:break-all}.mw .mw-script-section p:last-child{margin-bottom:0}.mw .mw-review{border:1px solid var(--mw-line);border-radius:9px;background:var(--mw-surface);padding:16px;margin-top:20px}.mw .mw-review h3{margin:9px 0}.mw .mw-feedback{padding-top:14px;margin-top:14px;border-top:1px solid var(--mw-line)}.mw .mw-feedback .mw-row{margin-top:10px}.mw .mw-check-row{padding:9px 0;border-bottom:1px solid var(--mw-line)}.mw .mw-check-row strong{font-size:13px}.mw .mw-check-row p{margin:6px 0 0}.mw .mw-compare{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mw .mw-compare img,.mw .mw-compare video{width:100%;max-height:50vh;object-fit:contain}.mw .mw-diff{background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:8px;overflow:hidden}.mw .mw-diff-line{display:grid;grid-template-columns:22px minmax(0,1fr);padding:3px 10px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 ui-monospace,monospace}.mw .mw-diff-line.add{background:var(--mw-good-bg);color:var(--mw-good)}.mw .mw-diff-line.remove{background:var(--mw-bad-bg);color:var(--mw-bad)}.mw .mw-receipt{border:1px solid var(--mw-line);border-radius:8px;padding:15px;background:var(--mw-surface);margin:12px 0}.mw .mw-receipt details{margin-top:12px}.mw .mw-receipt pre{max-height:240px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}.mw .mw-setting-row{padding:12px 0;border-bottom:1px solid var(--mw-line)}.mw .mw-setting-row small{display:block}.mw .mw-savebar{padding:14px 20px;border-top:1px solid var(--mw-line);background:var(--mw-surface);flex:none}.mw .mw-timeline-word{display:inline-block;margin:3px;padding:2px 5px;border-radius:4px;background:var(--mw-soft);font-size:12px}.mw .mw-compact .mw-steps{display:none}.mw .mw-pagination{margin-top:20px}
.mw[data-mode=companion] .mw-content{padding:14px}.mw[data-mode=companion] .mw-header{padding:13px 14px}.mw[data-mode=companion] .mw-header h2{font-size:17px}.mw[data-mode=companion] .mw-work-grid{grid-template-columns:1fr}.mw[data-mode=companion] .mw-steps{display:none}.mw[data-mode=companion] .mw-step-select{display:block}.mw[data-mode=companion] .mw-split{grid-template-columns:1fr}.mw[data-mode=companion] .mw-form-grid,.mw[data-mode=companion] .mw-choice-grid{grid-template-columns:1fr}.mw[data-mode=companion] .mw-compare{grid-template-columns:1fr}
@container(max-width:850px){.mw .mw-split{grid-template-columns:1fr}}@container(max-width:620px){.mw .mw-content{padding:14px}.mw .mw-header{padding:14px}.mw .mw-work-grid{grid-template-columns:1fr}.mw .mw-steps{display:none}.mw .mw-step-select{display:block}.mw .mw-form-grid,.mw .mw-choice-grid,.mw .mw-compare{grid-template-columns:1fr}.mw .mw-file-row{grid-template-columns:minmax(0,1fr) 105px 32px}.mw .mw-preview pre{max-height:45vh}}@media(pointer:coarse){.mw button{min-height:44px}.mw input,.mw select,.mw textarea{font-size:16px}}@media(prefers-reduced-motion:reduce){.mw *{scroll-behavior:auto!important;transition:none!important}}
.mw [hidden]{display:none!important}.mw .mw-content{padding:28px clamp(18px,3vw,42px)}.mw .mw-eyebrow{display:block;font-size:11px;font-weight:600;letter-spacing:.08em;color:var(--mw-muted);margin-bottom:6px}.mw .mw-page-title{display:flex;justify-content:space-between;gap:20px;align-items:center;margin:0 0 24px}.mw .mw-page-title h2{font-size:27px;letter-spacing:-.03em}.mw .mw-page-title p{margin:6px 0 0}.mw .mw-overview{max-width:1120px;margin:0 auto}.mw .mw-filter-tabs{display:flex;gap:22px;border-bottom:1px solid var(--mw-line);margin-bottom:20px;overflow:auto}.mw .mw-filter-tabs button{display:flex;gap:8px;align-items:center;white-space:nowrap;border:0;border-bottom:2px solid transparent;background:none;padding:11px 0;color:var(--mw-muted);font-size:13px}.mw .mw-filter-tabs button[aria-selected=true]{color:var(--mw-accent);border-bottom-color:var(--mw-accent);font-weight:600}.mw .mw-filter-tabs button span{font-size:11px;border-radius:5px;background:var(--mw-surface);padding:0 6px}.mw .mw-list-tools{display:flex;gap:10px;margin-bottom:18px}.mw .mw-list-tools input{max-width:340px}.mw .mw-list-tools select{width:auto;margin-left:auto;max-width:150px}.mw .mw-task-list{display:grid;gap:12px}.mw .mw-task{display:flex;gap:22px;background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:13px;padding:17px;align-items:stretch}.mw .mw-task-cover{width:125px;min-height:113px;flex:none;position:relative;background:var(--mw-soft);border-radius:9px;display:flex;flex-direction:column;padding:13px 15px;justify-content:space-between;color:var(--mw-accent);overflow:hidden}.mw .mw-task-cover.product{background:var(--mw-good-bg);color:var(--mw-good)}.mw .mw-task-cover>span{font-size:11px;letter-spacing:.12em}.mw .mw-task-cover b{font-size:30px;font-weight:500;letter-spacing:-.04em}.mw .mw-task-cover b small{font-size:11px;color:inherit;margin-left:6px}.mw .mw-task-cover img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.mw .mw-task-main{flex:1;min-width:0}.mw .mw-task h3{font-size:16px;margin:0;overflow-wrap:anywhere}.mw .mw-task-meta{font-size:12px;color:var(--mw-muted);margin:6px 0 10px}.mw .mw-task .mw-progress{max-width:100%;margin:10px 0}.mw .mw-task-next{padding-top:6px;font-size:12px;color:var(--mw-muted)}.mw .mw-task-next .mw-button{padding:5px 11px}.mw .mw-progress{max-width:100%;height:4px}.mw .mw-welcome{padding:52px 20px;text-align:center;border:1px dashed var(--mw-line);border-radius:14px;background:var(--mw-surface);margin:18px 0 26px}.mw .mw-welcome h3{font-size:21px;margin:16px 0 10px}.mw .mw-welcome p{max-width:450px;margin:0 auto 24px;color:var(--mw-muted);font-size:13px}.mw .mw-welcome-symbol{display:grid;place-items:center;margin:auto;width:54px;height:54px;border-radius:16px;background:var(--mw-soft);color:var(--mw-accent);font-size:22px}.mw .mw-onboarding{display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin:25px 0;color:var(--mw-muted);font-size:12px}.mw .mw-onboarding i{font-style:normal;color:var(--mw-line)}.mw .mw-welcome>.mw-button{margin:0 6px}.mw .mw-location-line{display:flex;align-items:center;gap:12px;margin-top:26px;font-size:11px;color:var(--mw-muted);overflow-wrap:anywhere}.mw .mw-location-line>span:first-child{min-width:0}.mw .mw-location-line button{font-size:11px;flex:none}.mw .mw-sync-dot{margin-left:auto;white-space:nowrap}.mw .mw-sync-dot:before{content:'\u25CF';font-size:7px;color:var(--mw-good);margin-right:6px}.mw .mw-breadcrumb{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--mw-muted);margin:-5px 0 20px}.mw .mw-breadcrumb button{font-size:12px}.mw .mw-panel{background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:12px;padding:22px;margin-bottom:18px}.mw .mw-panel h3{font-size:15px}.mw .mw-panel summary{cursor:pointer;font-size:13px;font-weight:500}.mw .mw-panel pre{font:12px/1.6 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;max-height:340px;overflow:auto}.mw .mw-settings{max-width:1140px;margin:auto}.mw .mw-settings-layout{display:grid;grid-template-columns:180px minmax(0,1fr);gap:34px;align-items:start}.mw .mw-settings-nav{display:flex;flex-direction:column;gap:5px;position:sticky;top:0}.mw .mw-settings-nav button{background:none;border:0;color:var(--mw-muted);text-align:left;padding:12px 14px;border-radius:9px}.mw .mw-settings-nav button[aria-current=page]{background:var(--mw-soft);color:var(--mw-accent)}.mw .mw-settings-nav strong{display:block;font-size:13px;font-weight:600}.mw .mw-settings-nav small{display:block;font-size:11px;margin-top:3px;color:inherit;opacity:.8}.mw .mw-setting-heading{margin:1px 0 22px}.mw .mw-setting-heading h3{font-size:19px;margin-bottom:6px}.mw .mw-setting-heading p{color:var(--mw-muted);font-size:12px;margin:0}.mw .mw-settings-body{min-width:0}.mw .mw-folder-preview{background:var(--mw-bg);border-radius:8px;padding:15px;margin:16px 0;color:var(--mw-muted);font:12px/1.8 ui-monospace,monospace;overflow-wrap:anywhere}.mw .mw-folder-preview span{display:block}.mw .mw-settings-save{position:sticky;bottom:-28px;display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 0;margin-top:30px;border-top:1px solid var(--mw-line);background:var(--mw-bg);font-size:12px;color:var(--mw-muted);z-index:3}.mw .mw-two{grid-template-columns:1fr 1fr}.mw .mw-connection-list{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.mw .mw-create{max-width:940px;margin:0 auto}.mw .mw-wizard-nav{display:flex;gap:12px;margin:25px 0 30px}.mw .mw-wizard-nav button{display:flex;align-items:center;gap:9px;flex:1;background:none;border:0;border-bottom:2px solid var(--mw-line);color:var(--mw-muted);padding:12px 0;font-size:13px}.mw .mw-wizard-nav button[aria-current=step]{color:var(--mw-accent);border-color:var(--mw-accent)}.mw .mw-wizard-nav span{display:grid;place-items:center;border:1px solid var(--mw-line);border-radius:50%;width:25px;height:25px;flex:none;font-size:11px}.mw .mw-wizard-nav button[aria-current=step] span{background:var(--mw-soft);border-color:var(--mw-accent)}.mw .mw-wizard-footer{display:flex;justify-content:space-between;gap:18px;position:sticky;bottom:-28px;background:var(--mw-bg);padding:18px 0;border-top:1px solid var(--mw-line);margin-top:20px;z-index:2}.mw .mw-confirm-summary{background:var(--mw-soft);border-radius:12px;padding:20px;margin-bottom:25px}.mw .mw-confirm-summary p{font-size:12px;margin:0;color:var(--mw-muted)}.mw .mw-work-top{padding-bottom:22px;border-bottom:1px solid var(--mw-line);margin-bottom:22px}.mw .mw-work-top h2{font-size:25px;letter-spacing:-.02em}.mw .mw-work-grid{gap:26px;grid-template-columns:185px minmax(0,1fr)}.mw .mw-steps{position:sticky;top:0;align-self:start}.mw .mw-stage{background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:13px;padding:22px}.mw .mw-next-action{padding:18px 20px;border-left:3px solid var(--mw-accent);background:var(--mw-soft);border-radius:0 10px 10px 0;margin-bottom:24px}.mw .mw-next-action h3{margin:0 0 4px;font-size:16px}.mw .mw-next-action p{margin:0;font-size:12px;color:var(--mw-muted)}.mw .mw-review{border-color:var(--mw-accent);background:var(--mw-soft)}.mw .mw-companion-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--mw-surface);border-bottom:1px solid var(--mw-line);font-size:13px}.mw .mw-companion h2{font-size:19px;line-height:1.5;margin:12px 0;overflow-wrap:anywhere}.mw .mw-companion .mw-progress{margin:10px 0 22px}.mw .mw-companion .mw-next-action{margin-top:20px;padding:15px}.mw .mw-companion .mw-next-action button{margin-top:13px}.mw .mw-companion .mw-next-action h3{font-size:15px}.mw .mw-companion .mw-review{margin:15px 0 24px;padding:15px}.mw .mw-compact-artifacts{display:grid;gap:8px;margin:8px 0 20px}.mw .mw-compact-artifacts button{display:flex;align-items:center;gap:11px;text-align:left;border:1px solid var(--mw-line);border-radius:9px;background:var(--mw-surface);color:var(--mw-text);padding:11px;min-width:0}.mw .mw-compact-artifacts button>span:nth-child(2){flex:1;min-width:0}.mw .mw-compact-artifacts strong{display:block;font-size:12px;overflow-wrap:anywhere}.mw .mw-compact-artifacts small{display:block;font-size:11px}.mw .mw-file-icon{display:grid;place-items:center;width:30px;height:34px;flex:none;background:var(--mw-soft);border-radius:5px;color:var(--mw-accent)}.mw .mw-companion-footer{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--mw-muted);margin:20px 0}.mw .mw-companion-pick{display:block;width:100%;text-align:left;background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:10px;color:var(--mw-text);padding:14px;margin:10px 0}.mw .mw-companion-pick strong,.mw .mw-companion-pick span{display:block;overflow-wrap:anywhere}.mw .mw-companion-pick span{font-size:12px;color:var(--mw-muted);margin-top:5px}.mw[data-mode=companion] .mw-content{padding:18px}.mw[data-mode=companion] .mw-welcome{padding:30px 15px}.mw[data-mode=companion] .mw-welcome h3{font-size:17px}
@container(max-width:780px){.mw .mw-settings-layout{grid-template-columns:1fr;gap:20px}.mw .mw-settings-nav{flex-direction:row;gap:5px;position:static;overflow:auto;padding-bottom:4px}.mw .mw-settings-nav button{white-space:nowrap;padding:10px 12px}.mw .mw-settings-nav small{display:none}.mw .mw-settings-save{bottom:-18px}.mw .mw-task-cover{width:98px}.mw .mw-task{gap:14px}.mw .mw-panel{padding:18px}.mw .mw-work-grid{grid-template-columns:1fr}.mw .mw-steps{display:none}.mw .mw-step-select{display:block}}
@container(max-width:520px){.mw .mw-page-title h2{font-size:23px}.mw .mw-task{padding:14px;gap:12px}.mw .mw-task-cover{width:62px;min-height:70px;padding:10px;align-self:flex-start}.mw .mw-task-cover b{font-size:23px}.mw .mw-task-cover b small{display:none}.mw .mw-task .mw-row:first-child{align-items:flex-start}.mw .mw-task h3{font-size:14px}.mw .mw-task-next{display:block}.mw .mw-task-next button{margin-top:10px;width:100%}.mw .mw-filter-tabs{gap:18px}.mw .mw-list-tools input{max-width:100%}.mw .mw-list-tools select{max-width:110px;font-size:12px}.mw .mw-location-line{flex-wrap:wrap}.mw .mw-sync-dot{margin-left:0}.mw .mw-settings-save{flex-wrap:wrap;bottom:-14px}.mw .mw-two{grid-template-columns:1fr}.mw .mw-wizard-nav{gap:7px}.mw .mw-wizard-nav button{font-size:11px;gap:6px}.mw .mw-wizard-nav span{width:21px;height:21px}.mw .mw-stage{padding:15px}.mw .mw-work-top h2{font-size:20px}.mw .mw-welcome{padding:30px 15px}.mw .mw-content{padding:18px 14px}}

.mw .mw-announcement{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%)}.mw .mw-next-action>.mw-button{margin-top:12px}
.mw .mw-task.mw-archived{background:var(--mw-bg)}.mw .mw-task.mw-archived .mw-task-cover{opacity:.6}.mw .mw-task.mw-archived h3{color:var(--mw-muted)}.mw .mw-badge.archived{background:var(--mw-bg);color:var(--mw-muted)}


/* \u4E3B\u9898\u548C\u5E38\u7528\u63A7\u4EF6 */
body[data-ds-dark-theme] .mw { color-scheme: dark; }
.mw :is(option, optgroup) { background: var(--mw-surface); color: var(--mw-text); }
.mw :focus-visible { outline: 2px solid var(--mw-accent); outline-offset: 2px; }
.mw .mw-content { scrollbar-width: thin; }

.mw .mw-header {
  flex: none;
  padding: 14px clamp(16px, 3vw, 40px);
  background: var(--mw-bg);
  border-bottom: 1px solid var(--mw-line);
}
.mw .mw-header h2 { font-size: 15px; }
.mw .mw-brand-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--mw-r-sm);
  background: var(--mw-control);
  color: var(--mw-text);
}
.mw .mw-header nav { display: flex; gap: 4px; }
.mw .mw-nav button {
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--mw-muted);
  min-height: 33px;
  padding: 5px 13px;
  font-size: 13px;
  white-space: nowrap;
  transition: background .15s var(--mw-ease), color .15s var(--mw-ease);
}
.mw .mw-nav button:hover { background: var(--mw-hover); color: var(--mw-text); }
.mw .mw-nav button[aria-selected=true] { background: var(--mw-button); color: var(--mw-button-text); font-weight: 600; }

.mw .mw-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 6px 13px;
  border: 1px solid var(--mw-line);
  border-radius: 999px;
  background: var(--mw-surface);
  color: var(--mw-text);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  text-decoration: none;
  transition: background .15s var(--mw-ease), border-color .15s var(--mw-ease);
}
.mw .mw-button:hover:not(:disabled) { background: var(--mw-hover); }
.mw .mw-primary { background: var(--mw-button); color: var(--mw-button-text); border-color: transparent; font-weight: 600; }
.mw .mw-primary:hover:not(:disabled) { background: var(--mw-button-hover); }
.mw .mw-quiet { background: transparent; border-color: transparent; color: var(--mw-muted); }
.mw .mw-danger { color: var(--mw-bad); }
.mw .mw-badge { border-radius: 999px; }
.mw .mw-button svg { flex: none; }

.mw .mw-task,.mw .mw-panel,.mw .mw-stage,.mw .mw-preview,.mw .mw-review,.mw .mw-artifact {
  border-radius: var(--mw-r-lg);
}
.mw .mw-task,.mw .mw-artifact { transition: border-color .15s var(--mw-ease); }
.mw .mw-task:hover,.mw .mw-artifact:hover { border-color: var(--mw-line-strong); }
.mw .mw-field { border-radius: var(--mw-r-sm); }
.mw .mw-file-pick { position: relative; overflow: hidden; cursor: pointer; }
.mw .mw-file-pick input { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }
.mw .mw-file-pick:has(:focus-visible) { outline: 2px solid var(--mw-accent); outline-offset: 2px; }
.mw fieldset:disabled .mw-file-pick { opacity: .55; cursor: default; }

/* \u7075\u611F\u548C\u5FEB\u901F\u5236\u4F5C */
.mw .mw-ideas,.mw .mw-styles-panel,.mw .mw-insights { display: flex; flex-direction: column; gap: 4px; }
.mw .mw-ideas { max-width: 1080px; margin-inline: auto; }
.mw .mw-compose { max-width: 800px; }
.mw .mw-ideas .mw-page-title,.mw .mw-compose .mw-page-title { margin-bottom: 18px; }
.mw .mw-idea-form,.mw .mw-brief-composer {
  margin: 0 0 18px;
  padding: 16px;
  border: 1px solid var(--mw-line);
  border-radius: var(--mw-r-lg);
  background: var(--mw-surface);
}
.mw .mw-idea-form fieldset,.mw .mw-compose fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
.mw .mw-brief-composer { padding: clamp(16px, 2.5cqw, 22px); }
.mw .mw-writing-input.mw-field {
  display: block;
  min-height: 0;
  border: 0;
  padding: 4px 0;
  background: transparent;
  line-height: 1.65;
}
.mw .mw-writing-input::placeholder { color: var(--mw-muted); opacity: 1; }
.mw .mw-writing-input:focus-visible { outline: none; }
.mw :is(.mw-idea-form,.mw-brief-composer):has(.mw-writing-input:focus-visible) {
  border-color: var(--mw-line-strong);
  box-shadow: 0 0 0 2px color-mix(in srgb,var(--mw-text) 8%,transparent);
}
.mw .mw-idea-capture .mw-label,.mw .mw-brief-composer .mw-label:has(+ .mw-writing-input) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.mw .mw-work-choices {
  grid-template-columns: repeat(2,minmax(0,170px));
  gap: 10px;
  margin: 12px 0;
}
.mw .mw-work-choices select { border-color: transparent; background: var(--mw-control); padding: 7px 9px; font-size: 13px; }
.mw :is(.mw-brief-composer,.mw-idea-production) .mw-work-choices { padding-top: 12px; border-top: 1px solid var(--mw-line); }
.mw .mw-compose-actions { margin-top: 10px; }
.mw .mw-idea-capture .mw-compose-actions { margin-top: 6px; }
.mw .mw-idea-capture .mw-compose-actions>button[type=submit] { margin-inline-start: auto; }
.mw .mw-brief-composer .mw-compose-actions>.mw-file-pick { margin-inline-end: auto; }
.mw .mw-idea-production h3 { margin-bottom: 3px; }
.mw .mw-idea-production .mw-compose-actions>small { margin-inline-end: auto; }
.mw .mw-create-advanced>summary { color: var(--mw-muted); cursor: pointer; width: fit-content; }
.mw .mw-create-advanced[open]>summary,.mw .mw-create-advanced>summary:hover { color: var(--mw-text); }

.mw .mw-idea-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill,minmax(min(100%,255px),1fr));
  gap: 12px;
  align-items: start;
}
.mw .mw-idea-card {
  background: var(--mw-surface);
  border: 1px solid var(--mw-line);
  border-radius: var(--mw-r-lg);
  padding: 14px;
  transition: border-color .15s var(--mw-ease);
}
.mw .mw-idea-card:focus-within,.mw .mw-idea-card:hover { border-color: var(--mw-line-strong); }
.mw .mw-idea-card h3 { margin: 0 0 6px; font-size: 15px; overflow-wrap: anywhere; }
.mw .mw-idea-card p { margin: 0 0 10px; color: var(--mw-muted); white-space: pre-wrap; overflow-wrap: anywhere; }
.mw .mw-idea-media img,.mw .mw-idea-media video { width: 100%; max-height: 220px; object-fit: cover; border-radius: var(--mw-r-sm); background: #000; display: block; margin-bottom: 10px; }
.mw .mw-idea-card a { display: inline-block; margin-bottom: 8px; }
.mw .mw-idea-actions { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 12px; }
.mw .mw-idea-start { border-color: transparent; background: var(--mw-control); min-height: 30px; padding: 5px 10px; }
.mw .mw-idea-menu { position: relative; }
.mw .mw-idea-menu summary { min-height: 30px; width: 30px; padding: 0; cursor: pointer; list-style: none; }
.mw .mw-idea-menu summary::-webkit-details-marker { display: none; }
.mw .mw-idea-menu[open] summary { background: var(--mw-hover); }
.mw .mw-idea-menu>div {
  position: absolute;
  z-index: 2;
  right: 0;
  top: calc(100% + 4px);
  display: grid;
  min-width: 104px;
  padding: 4px;
  border: 1px solid var(--mw-line);
  border-radius: var(--mw-r-md);
  background: var(--mw-surface);
  box-shadow: 0 6px 20px rgb(0 0 0 / .08);
}
.mw .mw-idea-menu>div button { justify-content: flex-start; border-radius: var(--mw-r-sm); }

/* \u5DE5\u4F5C\u533A\u9996\u9875 */
.mw .mw-home { max-width: 980px; margin: 10px auto 32px; }
.mw .mw-home-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 18px;
}
.mw .mw-home-heading h2 { font-size: clamp(24px, 3.2cqw, 32px); font-weight: 650; letter-spacing: -.035em; }
.mw .mw-home-tag {
  display: inline-block;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--mw-control);
  color: var(--mw-muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.mw .mw-home-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.mw .mw-home-metric {
  display: grid;
  justify-items: start;
  align-content: start;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid var(--mw-line);
  border-radius: var(--mw-r-lg);
  background: var(--mw-surface);
  color: var(--mw-text);
  text-align: start;
  transition: background .15s var(--mw-ease), border-color .15s var(--mw-ease);
}
.mw .mw-home-metric:hover { background: var(--mw-control); border-color: var(--mw-line-strong); }
.mw .mw-home-metric>span { font-size: 13px; font-weight: 550; }
.mw .mw-home-metric strong { font-size: clamp(23px, 3.3cqw, 32px); font-weight: 600; line-height: 1.2; font-variant-numeric: tabular-nums; }
.mw .mw-home-metric small { margin-top: 2px; }
.mw .mw-home-capture,.mw .mw-home-feed { margin-top: 30px; }
.mw .mw-home-capture .mw-idea-form { margin: 0; }
.mw .mw-home-section-head { display: flex; align-items: start; justify-content: space-between; flex-wrap: wrap; gap: 6px 12px; margin-bottom: 10px; }
.mw .mw-home-section-head h3 { margin: 0; font-size: 17px; }
.mw .mw-home-section-head p,.mw .mw-source-empty p,.mw .mw-source-item p { margin: 2px 0 0; color: var(--mw-muted); font-size: 13px; }
.mw .mw-source-list,.mw .mw-source-empty { border: 1px solid var(--mw-line); border-radius: var(--mw-r-lg); background: var(--mw-surface); }
.mw .mw-source-empty { display: flex; align-items: center; gap: 12px; padding: 18px 16px; }
.mw .mw-source-empty strong { font-weight: 550; }
.mw .mw-source-icon {
  display: grid;
  place-items: center;
  flex: 0 0 38px;
  height: 38px;
  border-radius: var(--mw-r-md);
  background: var(--mw-control);
  color: var(--mw-muted);
}
.mw .mw-source-list { list-style: none; margin: 0; padding: 4px 12px; }
.mw .mw-source-list li + li { border-top: 1px solid var(--mw-line); }
.mw .mw-source-item {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 4px;
  color: var(--mw-text);
  text-decoration: none;
}
.mw .mw-source-item strong { display: block; font-weight: 550; }
.mw .mw-source-item:hover strong { text-decoration: underline; }
.mw .mw-source-item>span { color: var(--mw-muted); }

@container (max-width: 520px) {
  .mw .mw-header { padding: 12px 14px; }
  .mw .mw-header nav { gap: 2px; }
  .mw .mw-nav button { padding-inline: 10px; }
  .mw .mw-idea-form,.mw .mw-panel.mw-brief-composer { padding: 14px; }
  .mw .mw-home-metrics { gap: 8px; }
  .mw .mw-home-metric { padding: 10px; }
  .mw .mw-home-metric small { font-size: 11px; }
  .mw .mw-home-capture,.mw .mw-home-feed { margin-top: 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .mw * { transition: none !important; }
}

.mw .mw-style-active{display:flex;flex-direction:column;gap:4px}
.mw .mw-choice.is-active{border-color:var(--mw-accent);background:var(--mw-soft)}
.mw .mw-metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px;margin:12px 0}
.mw .mw-metric-grid>div{background:var(--mw-bg);border:1px solid var(--mw-line);border-radius:10px;padding:12px;text-align:center}
.mw .mw-metric-grid strong{display:block;font-size:22px;line-height:1.2}.mw .mw-metric-grid small{color:var(--mw-muted);font-size:12px}
.mw .mw-rule-row{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--mw-line)}
.mw .mw-rule-row p{margin:4px 0}
.mw .mw-work-preview,.mw .mw-work-details{margin-top:18px}.mw .mw-work-details>.mw-work-grid{margin-top:12px}
.mw .mw-bad{color:var(--mw-bad)}
`;

// src/navigation.js
function readTabState(key) {
  try {
    return JSON.parse(globalThis.sessionStorage?.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
function writeTabState(key, value) {
  try {
    if (value === null) globalThis.sessionStorage?.removeItem(key);
    else globalThis.sessionStorage?.setItem(key, JSON.stringify(value));
  } catch {
  }
}
function currentSession() {
  return new URL(globalThis.location?.href || "http://localhost/").searchParams.get("session");
}
function rememberPanel(layout, panel) {
  const info = layout?.panelInfo;
  if (!info) return;
  const key = `media-workflow:panel:${globalThis.location?.pathname || "/"}`;
  const saved = readTabState(key);
  if (saved?.active === true && saved.session === currentSession() && info.getSnapshot().activePanelId === null) {
    layout.selectPanel(panel);
  }
  const save = () => writeTabState(key, { active: info.getSnapshot().activePanelId === panel, session: currentSession() });
  save();
  return info.subscribe(save);
}

// src/client.js
var ENDPOINT = "dsh-media-workflow";
var WORKSPACE_PAGES = ["home", "tasks", "settings", "create", "workbench", "ideas", "styles", "insights"];
var TASK_GROUPS = ["", "attention", "active", "done", "draft", "archived"];
function requireStorageRoot(settings) {
  const root = settings?.storage?.root;
  if (typeof root !== "string" || !root.trim()) {
    const error = new Error("\u5DE5\u4F5C\u76EE\u5F55\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u91CD\u65B0\u8FDE\u63A5\u540E\u518D\u8BBE\u7F6E\u76EE\u5F55\u3002");
    error.code = "host-not-ready";
    throw error;
  }
  return root;
}
function createClient(connection, { base = new URL("./", document.baseURI).href } = {}) {
  const listeners = /* @__PURE__ */ new Set();
  let disposed = false, storageRoot = null;
  const selected = /* @__PURE__ */ new Map(), views = /* @__PURE__ */ new Map();
  const selectionKey = (scope) => `media-workflow-selection:${base}:${scope || "global"}`;
  const workspaceKey = `${selectionKey(null)}:workspace`;
  const viewKey = () => `media-workflow:view:${base}${currentSession() || ""}`;
  const clearSelection = () => {
    selected.clear();
    views.clear();
    writeTabState(viewKey(), null);
    try {
      for (const key of Object.keys(localStorage)) if (key.startsWith(`media-workflow-selection:${base}:`)) localStorage.removeItem(key);
    } catch {
    }
  };
  return {
    async call(method, payload = {}, signal) {
      if (disposed) throw new Error("\u8FDE\u63A5\u5DF2\u5173\u95ED");
      const wire = await connection.rpc.call("/api", ENDPOINT, { method, payload: { ...payload, ...storageRoot ? { storageRoot } : {} } }, signal);
      const response = wire?.result ?? wire;
      if (!response?.ok) {
        const e = new Error(response?.error?.message || "\u5A92\u4F53\u5DE5\u4F5C\u6D41\u8BF7\u6C42\u5931\u8D25");
        e.code = response?.error?.code;
        e.details = response?.error?.details;
        if (e.code === "workspace-changed") {
          storageRoot = null;
          clearSelection();
          for (const fn of listeners) {
            try {
              fn({ type: "storage" });
            } catch {
            }
          }
        }
        throw e;
      }
      if (method === "settings.get") storageRoot = response.value.storage?.root || null;
      return response.value;
    },
    artifactUrl(id, path) {
      const url = new URL(`api/${ENDPOINT}/artifact`, base);
      url.searchParams.set("task", id);
      url.searchParams.set("path", path);
      return url.href;
    },
    ideaMediaUrl(src) {
      const url = new URL(`api/${ENDPOINT}/idea-media`, base);
      url.searchParams.set("src", src);
      return url.href;
    },
    async ideaUpload(file) {
      const url = new URL(`api/${ENDPOINT}/idea-upload`, base);
      url.searchParams.set("name", file.name);
      url.searchParams.set("mime", file.type || "");
      const response = await fetch(url, { method: "POST", body: file, credentials: "same-origin" });
      const body = await response.json();
      if (!body.ok) {
        const e = new Error(body.error?.message || "\u4E0A\u4F20\u5931\u8D25");
        e.code = body.error?.code;
        throw e;
      }
      return body.value;
    },
    canvasImageUrl(id, path, image) {
      const url = new URL(`api/${ENDPOINT}/canvas-image`, base);
      url.searchParams.set("task", id);
      url.searchParams.set("path", path);
      url.searchParams.set("image", image);
      return url.href;
    },
    uploads(id, signal) {
      return this.call("uploads.list", { id }, signal).then((r) => r.uploads ?? []);
    },
    sampleUrl(voice) {
      const url = new URL(`api/${ENDPOINT}/sample`, base);
      url.searchParams.set("name", voice);
      return url.href;
    },
    exportUrl(id) {
      const url = new URL(`api/${ENDPOINT}/export`, base);
      url.searchParams.set("id", id);
      return url.href;
    },
    getWorkspaceView() {
      const key = viewKey();
      const saved = views.get(key) ?? readTabState(key);
      if (!WORKSPACE_PAGES.includes(saved?.page)) return null;
      const taskId = typeof saved.taskId === "string" && saved.taskId ? saved.taskId : null;
      if (saved.page === "workbench" && !taskId) return null;
      return { page: saved.page, taskId, group: TASK_GROUPS.includes(saved.group) ? saved.group : "" };
    },
    rememberWorkspaceView(page, taskId, group) {
      const key = viewKey(), view = { page, taskId, group };
      views.set(key, view);
      writeTabState(key, view);
      try {
        localStorage.removeItem(workspaceKey);
      } catch {
      }
    },
    navigate(page) {
      if (!WORKSPACE_PAGES.includes(page)) return;
      const taskId = page === "workbench" ? this.getSelected(null) : null;
      this.rememberWorkspaceView(page, taskId, "");
      for (const fn of listeners) {
        try {
          fn({ type: "navigation", page, taskId });
        } catch {
        }
      }
    },
    getSelected(scope) {
      if (selected.has(scope || "global")) return selected.get(scope || "global");
      try {
        return localStorage.getItem(selectionKey(scope));
      } catch {
        return null;
      }
    },
    getWorkspaceTask() {
      try {
        return localStorage.getItem(workspaceKey);
      } catch {
        return null;
      }
    },
    select(id, scope) {
      selected.set(scope || "global", id);
      try {
        localStorage.setItem(selectionKey(scope), id);
      } catch {
      }
      for (const fn of listeners) {
        try {
          fn({ type: "selection", id, scope: scope || null });
        } catch {
        }
      }
    },
    // Forget a persisted selection without broadcasting one: archiving must not reopen that task after a refresh.
    deselect(scope) {
      const key = scope || "global";
      selected.delete(key);
      try {
        localStorage.removeItem(selectionKey(key));
      } catch {
      }
    },
    storageChanged() {
      clearSelection();
      storageRoot = null;
      for (const fn of listeners) {
        try {
          fn({ type: "storage" });
        } catch {
        }
      }
    },
    async upload(id, entry, signal, staged = false) {
      if (entry.file.size > 8 * 1024 * 1024) {
        const key = `media-workflow-transfer:${base}:${storageRoot}:${id}:${entry.file.name}:${entry.file.size}:${entry.file.lastModified}:${staged}`;
        let record;
        try {
          const previous = localStorage.getItem(key);
          if (previous) record = await this.call("uploads.status", { id, transferId: previous }, signal);
        } catch (e) {
          if (signal?.aborted) throw e;
        }
        if (record?.chunks?.length) {
          for (const c of record.chunks) {
            const bytes2 = await entry.file.slice(c.offset, c.offset + c.size).arrayBuffer(), hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes2))].map((x) => x.toString(16).padStart(2, "0")).join("");
            if (hash !== c.sha256) {
              record = null;
              break;
            }
          }
        }
        if (!record) {
          record = await this.call("uploads.begin", { id, name: entry.file.name, size: entry.file.size, role: entry.role || "source", attribution: entry.attribution, usage: entry.usage, staged }, signal);
          try {
            localStorage.setItem(key, record.id);
          } catch {
          }
        }
        if (record.result) return record.result;
        for (let offset = record.offset; offset < entry.file.size; ) {
          const url2 = new URL(`api/${ENDPOINT}/upload-chunk`, base);
          url2.searchParams.set("task", id);
          url2.searchParams.set("transfer", record.id);
          url2.searchParams.set("offset", offset);
          const response = await fetch(url2, { method: "POST", body: entry.file.slice(offset, offset + record.chunkSize), credentials: "same-origin", signal }), body2 = await response.json();
          if (!body2.ok) {
            const e = new Error(body2.error?.message || "\u5206\u7247\u4E0A\u4F20\u5931\u8D25");
            e.code = body2.error?.code;
            throw e;
          }
          offset = body2.value.offset;
          entry.onProgress?.({ uploaded: offset, total: entry.file.size });
        }
        const result2 = await this.call("uploads.complete", { id, transferId: record.id }, signal);
        try {
          localStorage.removeItem(key);
        } catch {
        }
        return result2;
      }
      const url = new URL(`api/${ENDPOINT}/upload`, base);
      url.searchParams.set("task", id);
      url.searchParams.set("name", entry.file.name);
      url.searchParams.set("role", entry.role);
      url.searchParams.set("attribution", entry.attribution || "");
      url.searchParams.set("usage", entry.usage || "");
      if (staged) url.searchParams.set("staged", "true");
      const result = await fetch(url, { method: "POST", body: entry.file, credentials: "same-origin", signal });
      const body = await result.json();
      if (!body.ok) throw new Error(body.error?.message || "\u4E0A\u4F20\u5931\u8D25");
      return body.value;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    reset() {
      for (const fn of listeners) {
        try {
          fn();
        } catch {
        }
      }
    },
    dispose() {
      disposed = true;
      listeners.clear();
    }
  };
}
function lineDiff(before, after) {
  const a = before.split("\n"), b = after.split("\n");
  if (a.length > 700 || b.length > 700) return { truncated: true, lines: [] };
  const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i2 = a.length - 1; i2 >= 0; i2--) for (let j2 = b.length - 1; j2 >= 0; j2--) table[i2][j2] = a[i2] === b[j2] ? table[i2 + 1][j2 + 1] + 1 : Math.max(table[i2 + 1][j2], table[i2][j2 + 1]);
  const lines = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ kind: "same", text: a[i++] });
      j++;
    } else if (j < b.length && (i === a.length || table[i][j + 1] >= table[i + 1][j])) lines.push({ kind: "add", text: b[j++] });
    else lines.push({ kind: "remove", text: a[i++] });
  }
  return { truncated: false, lines };
}
async function draftDatabase() {
  if (!globalThis.indexedDB) return null;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dsh-media-workflow-ui", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function draftStore(key, value) {
  const db = await draftDatabase();
  if (!db) return null;
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("drafts", value === void 0 ? "readonly" : "readwrite"), store = transaction.objectStore("drafts");
      const request = value === void 0 ? store.get(key) : value === null ? store.delete(key) : store.put(value, key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

// src/settings.jsx
var import_react2 = __toESM(require("react"), 1);

// src/ui.jsx
var import_react = __toESM(require("react"), 1);

// embedded-skill/lib/content.mjs
var CONTENT_TYPES = [
  { id: "article", label: "\u6587\u7AE0", nativeWorkflow: true, skillWorkflow: true, reference: "references/formats.md", outputs: ["\u6B63\u6587 Markdown", "\u6392\u7248 HTML", "\u914D\u56FE\u4E0E\u51FA\u5904\u6E05\u5355"] },
  { id: "image-post", label: "\u56FE\u6587 / \u8D34\u56FE", nativeWorkflow: true, skillWorkflow: true, reference: "references/formats.md", outputs: ["\u6709\u5E8F\u56FE\u7247", "\u914D\u6587", "\u53EF\u7F16\u8F91\u9875\u9762\u4E0E\u7D20\u6750\u6E05\u5355"] },
  { id: "video", label: "\u89C6\u9891", nativeWorkflow: true, skillWorkflow: true, reference: "references/formats.md", outputs: ["\u6210\u7247", "\u5B57\u5E55\u4E0E\u97F3\u9891", "\u53EF\u7F16\u8F91\u5DE5\u7A0B", "\u5C01\u9762\u4E0E\u68C0\u67E5\u8BB0\u5F55"] }
];
var EXPRESSIONS = [
  { id: "auto", label: "\u6309\u9700\u6C42\u5224\u65AD", guidance: "\u7ED3\u5408\u53D7\u4F17\u3001\u8D44\u6599\u4E0E\u672C\u6B21\u76EE\u7684\u9009\u62E9\u8868\u8FBE\u65B9\u5F0F\uFF0C\u4E0D\u5957\u7EDF\u4E00\u53D9\u4E8B\u7ED3\u6784\u3002" },
  { id: "explainer", label: "\u89E3\u91CA\u79D1\u666E", guidance: "\u56F4\u7ED5\u4E00\u4E2A\u95EE\u9898\u8BB2\u6E05\u673A\u5236\uFF0C\u7528\u6709\u8FB9\u754C\u7684\u7C7B\u6BD4\u3001\u53EF\u6838\u67E5\u8BC1\u636E\u548C\u5177\u4F53\u4F8B\u5B50\uFF0C\u907F\u514D\u540D\u8BCD\u5806\u53E0\u3002" },
  { id: "tutorial", label: "\u5B9E\u64CD\u6559\u7A0B", guidance: "\u7ED9\u51FA\u53EF\u590D\u73B0\u7684\u524D\u63D0\u3001\u6B65\u9AA4\u3001\u7ED3\u679C\u4E0E\u5E38\u89C1\u5931\u8D25\u70B9\uFF1B\u8BF4\u660E\u9002\u7528\u7248\u672C\uFF0C\u753B\u9762\u6216\u914D\u56FE\u652F\u6301\u6B63\u5728\u8BB2\u7684\u52A8\u4F5C\u3002" },
  { id: "review", label: "\u5B9E\u6D4B / \u5BF9\u6BD4", guidance: "\u5148\u4EA4\u4EE3\u6D4B\u8BD5\u6761\u4EF6\u4E0E\u8BC4\u4EF7\u7EF4\u5EA6\uFF0C\u518D\u7ED9\u89C2\u5BDF\u53CA\u53D6\u820D\uFF1B\u6CA1\u6709\u5B9E\u9645\u6D4B\u8BD5\u4E0D\u80FD\u5199\u6210\u4EB2\u6D4B\u6216\u7ED9\u865A\u6784\u8BC4\u5206\u3002" },
  { id: "case-study", label: "\u6848\u4F8B / \u573A\u666F", guidance: "\u4EE5\u5177\u4F53\u95EE\u9898\u3001\u8FC7\u7A0B\u548C\u7ED3\u679C\u7EC4\u7EC7\uFF1B\u4EA7\u54C1\u5BA3\u4F20\u4F18\u5148\u5C55\u793A\u771F\u5B9E\u4F7F\u7528\u4EF7\u503C\uFF0C\u540C\u65F6\u4FDD\u7559\u9650\u5236\u4E0E\u9002\u7528\u5BF9\u8C61\u3002" },
  { id: "personal-story", label: "\u4E2A\u4EBA\u53D9\u4E8B", guidance: "\u56F4\u7ED5\u771F\u5B9E\u4E8B\u4EF6\u3001\u7EC6\u8282\u4E0E\u611F\u53D7\u5EFA\u7ACB\u53D9\u4E8B\uFF0C\u4E0D\u66FF\u7528\u6237\u7F16\u9020\u7ECF\u5386\u3001\u5F15\u8BED\u3001\u5173\u7CFB\u6216\u7B2C\u4E00\u4EBA\u79F0\u89C1\u95FB\u3002" },
  { id: "documentary", label: "\u751F\u6D3B\u8BB0\u5F55", guidance: "\u8BA9\u4EBA\u7269\u3001\u8FC7\u7A0B\u3001\u73AF\u5883\u58F0\u548C\u65F6\u95F4\u53D8\u5316\u627F\u8F7D\u5185\u5BB9\uFF1B\u6309\u8D44\u6599\u9009\u62E9\u5E73\u5B9E\u3001\u6E29\u6696\u6216\u89C2\u5BDF\u5F0F\u8BED\u6C14\uFF0C\u907F\u514D\u628A\u65E5\u5E38\u5F3A\u884C\u5199\u6210\u5E7F\u544A\u3002" },
  { id: "launch", label: "\u4EA7\u54C1\u53D1\u5E03", guidance: "\u805A\u7126\u65B0\u53D8\u5316\u3001\u53D7\u4F17\u4EF7\u503C\u548C\u771F\u5B9E\u6F14\u793A\uFF1B\u89C6\u89C9\u4E0E\u8282\u594F\u53EF\u52A0\u5F3A\u54C1\u724C\u8868\u8FBE\uFF0C\u4F46\u4E0D\u5F97\u7528\u7279\u6548\u4EE3\u66FF\u80FD\u529B\u8BC1\u636E\u3002" },
  { id: "humor", label: "\u8F7B\u677E / \u73A9\u6897", guidance: "\u7528\u4E0E\u5185\u5BB9\u6709\u5173\u7684\u5E7D\u9ED8\u6216\u53CD\u5DEE\u5E2E\u52A9\u7406\u89E3\uFF0C\u907F\u514D\u4E3A\u4E86\u8DDF\u70ED\u70B9\u6B6A\u66F2\u4E8B\u5B9E\uFF1B\u4E0D\u4F2A\u88C5\u4E3A\u771F\u5B9E\u4E8B\u4EF6\u6216\u7528\u6237\u4F53\u9A8C\u3002" }
];
var VISUAL_STYLES = [
  { id: "auto", label: "\u6309\u5185\u5BB9\u9009\u62E9", guidance: "\u5148\u8003\u8651\u4FE1\u606F\u3001\u7D20\u6750\u548C\u9605\u8BFB\u573A\u666F\uFF0C\u53C2\u8003\u98CE\u683C\u4E0D\u7B49\u4E8E\u590D\u5236\u522B\u4EBA\u7684\u4F5C\u54C1\u3002" },
  { id: "editorial", label: "\u7F16\u8F91 / \u6742\u5FD7", guidance: "\u5F3A\u8C03\u6807\u9898\u5C42\u7EA7\u3001\u7559\u767D\u3001\u56FE\u6587\u8282\u594F\u548C\u7EC6\u8282\u56FE\u6CE8\uFF1B\u9002\u5408\u89E3\u91CA\u6587\u7AE0\u3001\u89C2\u70B9\u548C\u4EA7\u54C1\u6545\u4E8B\u3002" },
  { id: "knowledge-cards", label: "\u77E5\u8BC6\u5361\u7247", guidance: "\u6BCF\u9875\u6216\u6BCF\u5C4F\u4E00\u4E2A\u91CD\u70B9\uFF0C\u5229\u7528\u5C42\u7EA7\u3001\u56FE\u793A\u548C\u77ED\u6587\u6848\u5E2E\u52A9\u7406\u89E3\uFF1B\u4E0D\u628A\u6574\u6BB5\u6B63\u6587\u622A\u56FE\u585E\u6EE1\u753B\u9762\u3002" },
  { id: "collage", label: "\u624B\u8D26 / \u62FC\u8D34", guidance: "\u7528\u771F\u5B9E\u7167\u7247\u3001\u4FBF\u7B7E\u3001\u624B\u7ED8\u6807\u6CE8\u7EC4\u7EC7\u7EC6\u8282\u548C\u4E2A\u4EBA\u611F\u53D7\uFF1B\u88C5\u9970\u670D\u4ECE\u9605\u8BFB\uFF0C\u4E0D\u906E\u6321\u8BC1\u636E\u3002" },
  { id: "screen-demo", label: "\u771F\u5B9E\u64CD\u4F5C", guidance: "\u4EE5\u622A\u56FE\u6216\u5F55\u5C4F\u4E3A\u4E3B\u4F53\uFF0C\u8BA9\u64CD\u4F5C\u7126\u70B9\u3001\u5C40\u90E8\u653E\u5927\u4E0E\u8BF4\u660E\u5BF9\u5E94\uFF1B\u4FDD\u6301\u771F\u5B9E\u754C\u9762\u4E0E\u793A\u4F8B\u6570\u636E\u8FB9\u754C\u3002" },
  { id: "natural", label: "\u81EA\u7136\u7EAA\u5B9E", guidance: "\u4FDD\u7559\u751F\u6D3B\u7EC6\u8282\u548C\u5408\u7406\u7684\u4E0D\u5B8C\u7F8E\uFF0C\u7528\u81EA\u7136\u753B\u9762\u3001\u514B\u5236\u6587\u5B57\u4E0E\u58F0\u97F3\u5EFA\u7ACB\u53EF\u4FE1\u611F\uFF1B\u4E0D\u4EBA\u4E3A\u5236\u9020\u4F2A\u7ECF\u5386\u3002" },
  { id: "motion", label: "\u52A8\u6001\u8BBE\u8BA1", guidance: "\u4F7F\u7528\u4E0E\u4FE1\u606F\u5BF9\u5E94\u7684\u56FE\u5C42\u3001\u5361\u7247\u548C\u52A8\u6548\uFF0C\u6309\u8282\u594F\u63ED\u793A\u5185\u5BB9\uFF1B\u9700\u8981\u5B9E\u9645\u5236\u4F5C\u5DE5\u7A0B\uFF0C\u4E0D\u80FD\u9760\u63CF\u8FF0\u5BA3\u79F0\u5DF2\u5B9E\u73B0\u3002" }
];
function linksInText(text) {
  const links = /* @__PURE__ */ new Set();
  for (const match of String(text || "").matchAll(/https?:\/\/[^\s<>"'，。；！？、）】》]+/gi)) {
    let candidate = match[0].replace(/[.,;!?]+$/, "");
    while (candidate.endsWith(")") && candidate.split(")").length > candidate.split("(").length) candidate = candidate.slice(0, -1);
    try {
      const url = new URL(candidate);
      if (!url.username && !url.password) links.add(url.href);
    } catch {
    }
  }
  return [...links];
}

// src/ui.jsx
function safeLink(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
function Button({ primary, quiet, danger, className = "", children, ...props }) {
  return /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: `mw-button ${primary ? "mw-primary" : ""} ${quiet ? "mw-quiet" : ""} ${danger ? "mw-danger" : ""} ${className}`, ...props }, children);
}
function Badge({ status, children }) {
  return /* @__PURE__ */ import_react.default.createElement("span", { className: `mw-badge ${["complete", "verified", "pass", "available"].includes(status) ? "good" : ["failed", "fail", "corrupt"].includes(status) ? "bad" : ["needs_review", "needs_check", "blocked", "waiting_for_login", "unknown", "unavailable"].includes(status) ? "warn" : ""}` }, children || status);
}
function Field({ label, children }) {
  const id = (0, import_react.useId)();
  return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("label", { className: "mw-label", htmlFor: id }, label), import_react.default.cloneElement(children, { id }));
}
function AttachmentIcon() {
  return /* @__PURE__ */ import_react.default.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ import_react.default.createElement("path", { d: "M12 5v14M5 12h14" }));
}
function WorkChoices({ client, visible = true, type, styleId = "", savedStyle, revising, keepOriginal, onType, onStyle }) {
  const [library, setLibrary] = (0, import_react.useState)(null), [error, setError] = (0, import_react.useState)(false);
  const [attempt, setAttempt] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    if (!visible) return;
    const controller = new AbortController();
    setError(false);
    client.call("styles.list", {}, controller.signal).then((data) => {
      if (!controller.signal.aborted) setLibrary(data);
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [client, visible, attempt]);
  const styles = library?.styles ?? [];
  const groups = [
    ["\u6211\u7684\u98CE\u683C", styles.filter((row) => !row.preset)],
    ...(library?.categories ?? []).map((category) => [category, styles.filter((row) => row.preset && row.category === category)])
  ];
  const defaultLabel = keepOriginal ? `\u539F\u98CE\u683C\uFF1A${savedStyle?.name || "\u9ED8\u8BA4"}` : `\u968F\u5DE5\u4F5C\u533A${library?.active ? `\uFF1A${library.active.name}` : ""}`;
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "mw-form-grid mw-work-choices" }, /* @__PURE__ */ import_react.default.createElement(Field, { label: "\u4F5C\u54C1\u7C7B\u578B" }, /* @__PURE__ */ import_react.default.createElement("select", { className: "mw-field", value: type, disabled: revising, onChange: (e) => onType(e.target.value) }, CONTENT_TYPES.map((row) => /* @__PURE__ */ import_react.default.createElement("option", { key: row.id, value: row.id }, row.label)))), /* @__PURE__ */ import_react.default.createElement(Field, { label: "\u521B\u4F5C\u98CE\u683C" }, /* @__PURE__ */ import_react.default.createElement("select", { className: "mw-field", value: styleId, onChange: (e) => onStyle(e.target.value) }, /* @__PURE__ */ import_react.default.createElement("option", { value: "" }, defaultLabel), styleId && !styles.some((row) => row.id === styleId) && /* @__PURE__ */ import_react.default.createElement("option", { value: styleId }, savedStyle?.id === styleId ? savedStyle.name : library ? "\u539F\u9009\u98CE\u683C\u5DF2\u4E0D\u53EF\u7528" : "\u5DF2\u9009\u98CE\u683C"), groups.filter(([, rows]) => rows.length > 0).map(([name2, rows]) => /* @__PURE__ */ import_react.default.createElement("optgroup", { key: name2, label: name2 }, rows.map((row) => /* @__PURE__ */ import_react.default.createElement("option", { key: row.id, value: row.id }, row.name)))))), error && /* @__PURE__ */ import_react.default.createElement(Button, { quiet: true, onClick: () => setAttempt((n) => n + 1) }, "\u91CD\u65B0\u8BFB\u53D6\u98CE\u683C"));
}
var MODES = { none: "\u514D\u9636\u6BB5\u8BC4\u5BA1", gates: "\u56DB\u5173\u8BC4\u5BA1", steps: "\u9010\u6B65\u8BC4\u5BA1" };
var STATUS = { draft: "\u8349\u7A3F", ready: "\u5F85\u6267\u884C", running: "\u5236\u4F5C\u4E2D", publishing: "\u53D1\u5E03\u4E2D", needs_review: "\u7B49\u4F60\u8BC4\u5BA1", blocked: "\u9700\u8981\u8865\u5145", failed: "\u6267\u884C\u5931\u8D25", pausing: "\u6682\u505C\u4E2D", paused: "\u5DF2\u6682\u505C", complete: "\u5DF2\u5B8C\u6210", needs_check: "\u53D1\u5E03\u5F85\u6838\u9A8C", corrupt: "\u6587\u4EF6\u9700\u68C0\u67E5" };
var artifactLabel = (file) => ({ "article.html": "\u6392\u7248\u6587\u7AE0", "gallery.html": "\u56FE\u6587\u9605\u8BFB\u9884\u89C8", "article.md": "\u5B8C\u6574\u6B63\u6587\u4E0E\u914D\u56FE\u8BF4\u660E", "publication.json": "\u53EF\u7F16\u8F91\u6392\u7248\u5DE5\u7A0B", "layout.json": "\u7F16\u6392\u65B9\u6848", "layout.md": "\u7F16\u6392\u8BF4\u660E", "sources.json": "\u51FA\u5904\u4E0E\u5F85\u6838\u5B9E", "brief.json": "\u5236\u4F5C\u9700\u6C42", "brief.md": "\u9700\u6C42\u8BF4\u660E", "materials.json": "\u6765\u6E90\u4E0E\u4E8B\u5B9E", "materials.md": "\u7D20\u6750\u6E05\u5355", "script.json": "\u5185\u5BB9\u811A\u672C", "script.md": "\u6587\u7A3F", "storyboard.json": "\u5206\u955C", "storyboard.md": "\u5206\u955C\u7A3F", "timeline.json": "\u914D\u97F3\u65F6\u95F4\u8F74", "preview.mp4": "\u753B\u9762\u9884\u89C8", "final.mp4": "\u6700\u7EC8\u6210\u7247", "cover.png": "\u5C01\u9762", "qa.json": "\u68C0\u67E5\u62A5\u544A", "package.json": "\u53D1\u5E03\u6587\u6848", "render-project.json": "\u53EF\u7F16\u8F91\u5DE5\u7A0B", "stage-edit.json": "\u672C\u7248\u4FEE\u6539" })[file.name] || file.name;
function nextAction(task) {
  if (task.archivedAt) return { title: "\u4EFB\u52A1\u5DF2\u5F52\u6863", action: "\u67E5\u770B\u5F52\u6863\u4EFB\u52A1", detail: "\u5F52\u6863\u53EA\u9690\u85CF\u4EFB\u52A1\uFF1B\u6062\u590D\u540E\u8FDB\u5EA6\u3001\u8BC4\u5BA1\u548C\u4EA7\u7269\u90FD\u4FDD\u6301\u539F\u6837\u3002" };
  if (task.pendingReview) return { title: task.pendingReview.step === "publish" ? "\u786E\u8BA4\u53D1\u5E03\u5185\u5BB9\u4E0E\u8D26\u53F7" : "\u67E5\u770B\u672C\u6B21\u8BC4\u5BA1", action: "\u67E5\u770B\u8BC4\u5BA1", detail: "\u5DF2\u6709\u4EA7\u7269\u7B49\u5F85\u4F60\u7684\u51B3\u5B9A\uFF0C\u901A\u8FC7\u540E\u7EE7\u7EED\u5236\u4F5C\u3002" };
  if (task.status === "draft") return { title: "\u8865\u9F50\u9700\u6C42\uFF0C\u5F00\u59CB\u5236\u4F5C", action: "\u7F16\u8F91\u9700\u6C42", detail: "\u8D44\u6599\u3001\u4EA4\u4ED8\u89C4\u683C\u548C\u672C\u6B21\u8BC4\u5BA1\u65B9\u5F0F\u4F1A\u5728\u5F00\u59CB\u524D\u4E00\u8D77\u786E\u8BA4\u3002" };
  if (task.status === "complete" && task.workType && task.workType !== "video") return { title: "\u4F5C\u54C1\u548C\u5DE5\u7A0B\u5DF2\u51C6\u5907\u597D", action: "\u67E5\u770B\u4F5C\u54C1", detail: "\u53EF\u4EE5\u9605\u8BFB\u6587\u7AE0\u3001\u67E5\u770B\u6709\u5E8F\u56FE\u7247\u3001\u4E0B\u8F7D\u5DE5\u7A0B\uFF0C\u6216\u68C0\u67E5\u4EA4\u4ED8\u8BB0\u5F55\u3002" };
  if (task.status === "complete") return { title: "\u6210\u7247\u548C\u5DE5\u7A0B\u5DF2\u51C6\u5907\u597D", action: "\u67E5\u770B\u6210\u7247", detail: "\u53EF\u4EE5\u64AD\u653E\u6210\u7247\u3001\u4E0B\u8F7D\u5DE5\u7A0B\uFF0C\u6216\u67E5\u770B\u53D1\u5E03\u7ED3\u679C\u3002" };
  if (task.status === "needs_check") return { title: "\u6838\u67E5\u539F\u53D1\u5E03\u8BF7\u6C42", action: "\u6838\u9A8C\u7ED3\u679C", detail: "\u53D1\u5E03\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u68C0\u67E5\u539F\u8BF7\u6C42\u540E\u518D\u51B3\u5B9A\u3002" };
  if (task.status === "blocked" && ["generation-required", "model-required"].includes(task.error?.code)) return { title: "\u7B49\u5F85\u5185\u5BB9\u8F93\u5165", action: "\u67E5\u770B\u8F93\u5165\u8981\u6C42", detail: "\u53EF\u5728\u5F53\u524D\u5BF9\u8BDD\u4E2D\u7EE7\u7EED\u811A\u672C\u6216\u5206\u955C\uFF1B\u4E5F\u53EF\u5728\u5236\u4F5C\u504F\u597D\u4E2D\u8BBE\u7F6E\u72EC\u7ACB\u5185\u5BB9\u6A21\u578B\u3002" };
  if (task.status === "blocked" || task.status === "failed" || task.status === "corrupt") return { title: task.error?.message || "\u6709\u4E00\u9879\u5185\u5BB9\u9700\u8981\u5904\u7406", action: "\u5904\u7406\u95EE\u9898", detail: "\u5DF2\u6709\u4EA7\u7269\u4F1A\u4FDD\u7559\uFF0C\u4ECE\u5F53\u524D\u9636\u6BB5\u7EE7\u7EED\u3002" };
  if (task.status === "paused") return { title: "\u4EFB\u52A1\u5DF2\u6682\u505C", action: "\u7EE7\u7EED\u5236\u4F5C", detail: "\u5DF2\u5B8C\u6210\u7684\u6B65\u9AA4\u548C\u5BA1\u6279\u4F1A\u7EE7\u7EED\u590D\u7528\u3002" };
  if (task.status === "ready") return { title: "\u5DF2\u51C6\u5907\u597D\uFF0C\u7B49\u5F85\u6267\u884C", action: "\u7EE7\u7EED\u5236\u4F5C", detail: "\u4ECE\u5DF2\u4FDD\u5B58\u7684\u9636\u6BB5\u8F93\u5165\u548C\u4EA7\u7269\u7EE7\u7EED\u3002" };
  if (task.status === "pausing") return { title: "\u6B63\u5728\u6682\u505C", action: "\u67E5\u770B\u8FDB\u5EA6", detail: "\u7B49\u5F85\u5B9E\u9645\u6267\u884C\u8FDB\u7A0B\u505C\u6B62\uFF0C\u5DF2\u6709\u8BB0\u5F55\u4F1A\u4FDD\u7559\u3002" };
  return { title: task.status === "publishing" ? "\u6B63\u5728\u7B49\u5F85\u5E73\u53F0\u56DE\u6267" : "\u6B63\u5728\u5236\u4F5C", action: "\u67E5\u770B\u8FDB\u5EA6", detail: "\u53EF\u4EE5\u5148\u5904\u7406\u5176\u4ED6\u4E8B\u60C5\uFF1B\u9700\u8981\u8BC4\u5BA1\u65F6\u518D\u56DE\u6765\u3002" };
}

// src/settings.jsx
var MI_MO_VOICES = [
  { name: "\u51B0\u7CD6", label: "\u5973\u58F0 \xB7 \u9AD8\u97F3" },
  { name: "\u8309\u8389", label: "\u5973\u58F0 \xB7 \u504F\u4E2D" },
  { name: "\u82CF\u6253", label: "\u5973\u58F0 \xB7 \u4E2D\u97F3" },
  { name: "\u767D\u6866", label: "\u7537\u58F0 \xB7 \u4F4E\u97F3" },
  { name: "Mia", label: "\u5973\u58F0 \xB7 \u504F\u9AD8" },
  { name: "Chloe", label: "\u5973\u58F0 \xB7 \u504F\u9AD8" },
  { name: "Milo", label: "\u7537\u58F0 \xB7 \u4F4E\u97F3" },
  { name: "Dean", label: "\u7537\u58F0 \xB7 \u4F4E\u97F3" }
];
function Settings({ client, bootstrap, onSaved, busy, perform }) {
  const [previewing, setPreviewing] = (0, import_react2.useState)(null), audioRef = (0, import_react2.useRef)(null), stopPreview = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPreviewing(null);
  }, preview = (voice) => {
    stopPreview();
    const audio = new Audio(client.sampleUrl(voice));
    audioRef.current = audio;
    setPreviewing(voice);
    audio.onended = () => setPreviewing(null);
    audio.onerror = () => setPreviewing("error");
    audio.play().catch(() => setPreviewing("error"));
  };
  const [section, setSection] = (0, import_react2.useState)("workspace"), [value, setValue] = (0, import_react2.useState)(bootstrap.value), [baseline, setBaseline] = (0, import_react2.useState)(bootstrap), [root, setRoot] = (0, import_react2.useState)(bootstrap.storage?.root || ""), [models, setModels] = (0, import_react2.useState)([]), [report, setReport] = (0, import_react2.useState)(bootstrap.doctor), [discovery, setDiscovery] = (0, import_react2.useState)(null), [conflict, setConflict] = (0, import_react2.useState)(false);
  const dirty = JSON.stringify(value) !== JSON.stringify(baseline.value), set = (key, next) => setValue((old) => ({ ...old, [key]: next })), modelList = (0, import_react2.useId)();
  const rootReady = typeof bootstrap.storage?.root === "string" && !!bootstrap.storage.root.trim();
  (0, import_react2.useEffect)(() => {
    const c = new AbortController();
    client.call("models.list", {}, c.signal).then((result) => setModels(result.providers)).catch(() => {
    });
    return () => c.abort();
  }, [client]);
  (0, import_react2.useEffect)(() => {
    if (!dirty && (bootstrap.revision !== baseline.revision || bootstrap.storage?.root !== baseline.storage?.root)) {
      setBaseline(bootstrap);
      setValue(bootstrap.value);
      setRoot((old) => !old.trim() || old === baseline.storage?.root ? bootstrap.storage?.root || "" : old);
      setReport(bootstrap.doctor);
      setConflict(false);
    }
  }, [bootstrap, dirty]);
  const reload = async () => {
    const latest = await client.call("settings.get");
    setValue(latest.value);
    setBaseline(latest);
    setConflict(false);
    onSaved(latest);
  };
  const save = () => perform("settings-save", async () => {
    try {
      const typed = String(value.mimoApiKey || "").trim(), result = await client.call("settings.save", { value, revision: baseline.revision });
      if (typed && !result.value.mimoApiKeySet) throw Object.assign(new Error("\u5F53\u524D\u5BBF\u4E3B\u4ECD\u662F\u65E7\u7248\u672C\uFF0CMiMo Token \u672A\u4FDD\u5B58\uFF1B\u91CD\u542F DSH Web \u540E\u91CD\u8BD5\u3002"), { code: "host-outdated" });
      await reload();
    } catch (error) {
      if (error.code === "conflict") setConflict(true);
      throw error;
    }
  });
  const discover = (query) => perform(query, async () => setDiscovery({ query, value: await client.call("publish.discover", { query, bridgeId: value.bridgeId, browserContext: value.browserContext, refresh: query === "accounts" }) }));
  const knownAccount = (a) => {
    const age = Date.now() - Number(a.checkedAt);
    return a.loggedIn === true && !a.stale && ["detector", "page"].includes(a.source) && Number.isFinite(age) && age >= -6e4 && age <= 9e5;
  };
  const nvenc = report?.capabilities?.find((c) => c.id === "nvenc");
  const data = discovery?.value?.result ?? discovery?.value, bridges = Array.isArray(data?.bridges) ? data.bridges : [], accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  const sections = [["workspace", "\u5DE5\u4F5C\u76EE\u5F55", "\u4EFB\u52A1\u3001\u7D20\u6750\u4E0E\u4EA4\u4ED8"], ["creation", "\u5236\u4F5C\u504F\u597D", "\u914D\u97F3\u3001\u8BC4\u5BA1\u4E0E\u5185\u5BB9\u751F\u6210"], ["understanding", "\u7D20\u6750\u7406\u89E3", "\u56FE\u50CF\u3001OCR\u3001\u89C6\u9891\u4E0E\u8BED\u97F3"], ["publishing", "\u53D1\u5E03\u8D26\u53F7", "\u6D4F\u89C8\u5668\u4E0E\u5E73\u53F0\u8FDE\u63A5"], ["tools", "\u5DE5\u5177\u4E0E\u8BCA\u65AD", "\u73AF\u5883\u72B6\u6001\u548C\u9AD8\u7EA7\u8DEF\u5F84"]];
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-settings" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-page-title" }, /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("span", { className: "mw-eyebrow" }, "\u5DE5\u4F5C\u7A7A\u95F4"), /* @__PURE__ */ import_react2.default.createElement("h2", null, "\u5A92\u4F53\u5DE5\u4F5C\u6D41\u8BBE\u7F6E"), /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted" }, "\u8BBE\u7F6E\u7528\u4E8E\u65B0\u4EFB\u52A1\uFF1B\u5DF2\u5F00\u59CB\u4EFB\u52A1\u7EE7\u7EED\u4F7F\u7528\u539F\u6765\u7684\u5236\u4F5C\u914D\u7F6E\u3002"))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-settings-layout" }, /* @__PURE__ */ import_react2.default.createElement("nav", { "aria-label": "\u8BBE\u7F6E\u5206\u7C7B", className: "mw-settings-nav" }, sections.map(([key, title, note]) => /* @__PURE__ */ import_react2.default.createElement("button", { type: "button", key, "aria-current": section === key ? "page" : void 0, onClick: () => setSection(key) }, /* @__PURE__ */ import_react2.default.createElement("strong", null, title), /* @__PURE__ */ import_react2.default.createElement("small", null, note)))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-settings-body" }, /* @__PURE__ */ import_react2.default.createElement("fieldset", { disabled: !!busy }, /* @__PURE__ */ import_react2.default.createElement("section", { hidden: section !== "workspace" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-setting-heading" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u5185\u5BB9\u653E\u5728\u54EA\u91CC"), /* @__PURE__ */ import_react2.default.createElement("p", null, "\u804A\u5929\u548C\u5DE5\u4F5C\u53F0\u4ECE\u540C\u4E00\u76EE\u5F55\u8BFB\u53D6\u4EFB\u52A1\uFF0C\u8FDB\u5EA6\u4E0E\u4EA7\u7269\u4F1A\u81EA\u52A8\u540C\u6B65\u3002")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, !rootReady && /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-help", role: "status" }, "\u5DE5\u4F5C\u76EE\u5F55\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u91CD\u65B0\u8FDE\u63A5\u540E\u8BBE\u7F6E\u3002", /* @__PURE__ */ import_react2.default.createElement(Button, { quiet: true, onClick: () => perform("storage-reconnect", reload) }, "\u91CD\u65B0\u8FDE\u63A5")), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u4EFB\u52A1\u5DE5\u4F5C\u76EE\u5F55" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", value: root, onChange: (e) => setRoot(e.target.value), placeholder: "\u4F8B\u5982 /home/user/\u5185\u5BB9\u521B\u4F5C" })), /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted", style: { marginTop: 12 } }, "\u4EFB\u52A1\u4FDD\u5B58\u5230\u8BE5\u76EE\u5F55\u7684 tasks/ \u4E0B\u3002\u6765\u6E90\u6587\u4EF6\u3001\u9879\u76EE\u7D20\u6750\u53EF\u4EE5\u7EE7\u7EED\u6309\u4F5C\u54C1\u5206\u76EE\u5F55\u7BA1\u7406\u3002"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-folder-preview" }, /* @__PURE__ */ import_react2.default.createElement("span", null, "\u25B1 ", root || "\u5DE5\u4F5C\u76EE\u5F55"), /* @__PURE__ */ import_react2.default.createElement("span", null, "\u2514 tasks / \u4EFB\u52A1 ID / \u9700\u6C42 \xB7 \u4EA7\u7269 \xB7 \u5DE5\u7A0B \xB7 \u8BC4\u5BA1")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react2.default.createElement("span", { className: "mw-muted" }, "\u5207\u6362\u53EA\u8BFB\u53D6\u76EE\u6807\u76EE\u5F55\uFF0C\u4E0D\u642C\u52A8\u539F\u6709\u4EFB\u52A1\u3002"), /* @__PURE__ */ import_react2.default.createElement(Button, { disabled: !rootReady || dirty || !root.trim() || root.trim() === bootstrap.storage?.root, onClick: () => perform("storage", async () => {
    await client.call("storage.set", { root: root.trim(), expectedRoot: requireStorageRoot(bootstrap) });
    client.storageChanged?.();
  }) }, "\u4F7F\u7528\u6B64\u76EE\u5F55")), dirty && /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted" }, "\u5148\u4FDD\u5B58\u6216\u653E\u5F03\u5176\u4ED6\u8BBE\u7F6E\u4FEE\u6539\uFF0C\u518D\u5207\u6362\u76EE\u5F55\u3002")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u989D\u5916\u4EA4\u4ED8\u4E00\u4EFD\u6210\u7247"), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u9ED8\u8BA4\u4EA4\u4ED8\u76EE\u5F55\uFF08\u7559\u7A7A\u4F7F\u7528\u4EFB\u52A1\u76EE\u5F55\uFF09" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", value: value.outputDirectory, onChange: (e) => set("outputDirectory", e.target.value), placeholder: "\u53EF\u9009\uFF0C\u4F8B\u5982 /home/user/\u5185\u5BB9\u521B\u4F5C/\u5DF2\u4EA4\u4ED8" })), /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted", style: { marginTop: 12 } }, "\u5236\u4F5C\u8BB0\u5F55\u59CB\u7EC8\u7559\u5728\u4EFB\u52A1\u4E2D\uFF0C\u8FD9\u91CC\u53EA\u989D\u5916\u4FDD\u5B58\u4EA4\u4ED8\u526F\u672C\u3002"))), /* @__PURE__ */ import_react2.default.createElement("section", { hidden: section !== "creation" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-setting-heading" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u628A\u5E38\u7528\u9009\u62E9\u7559\u7ED9\u4E0B\u4E00\u6B21"), /* @__PURE__ */ import_react2.default.createElement("p", null, "\u8BBE\u7F6E\u5F71\u54CD\u65B0\u4EFB\u52A1\uFF1B\u5DF2\u6709\u4EFB\u52A1\u4FDD\u7559\u521B\u5EFA\u65F6\u7684\u6A21\u578B\u4E0E\u5DE5\u5177\u914D\u7F6E\u3002\u6BCF\u6B21\u65B0\u5EFA\u53EF\u5355\u72EC\u9009\u62E9\u753B\u9762\u3001\u914D\u97F3\u548C\u8BC4\u5BA1\u65B9\u5F0F\u3002")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u914D\u97F3\u4E0E\u8BC4\u5BA1"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-form-grid" }, /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u9ED8\u8BA4\u914D\u97F3\u670D\u52A1" }, /* @__PURE__ */ import_react2.default.createElement("select", { className: "mw-field", value: value.ttsProvider || "edge", onChange: (e) => setValue((old) => ({ ...old, ttsProvider: e.target.value, ...e.target.value === "mimo" && !String(old.mimoVoice || "").trim() && !/^(zh-CN-|cmn-|en-US-)/.test(String(old.defaultVoice || "")) ? { mimoVoice: old.defaultVoice } : {} })) }, /* @__PURE__ */ import_react2.default.createElement("option", { value: "edge" }, "edge-tts \xB7 \u514D\u8D39\uFF0C\u542B\u8BCD\u7EA7\u65F6\u95F4\u7801"), /* @__PURE__ */ import_react2.default.createElement("option", { value: "mimo" }, "MiMo \u8BED\u97F3 \xB7 \u5C0F\u7C73\uFF08\u9700 Token\uFF09"))), value.ttsProvider !== "mimo" && /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u9ED8\u8BA4\u97F3\u8272" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", list: `${modelList}-voices`, value: value.defaultVoice, onChange: (e) => set("defaultVoice", e.target.value) })), /* @__PURE__ */ import_react2.default.createElement("datalist", { id: `${modelList}-voices` }, /* @__PURE__ */ import_react2.default.createElement("option", { value: "zh-CN-XiaoxiaoNeural" }, "\u6653\u6653 \xB7 \u666E\u901A\u8BDD\u5973\u58F0"), /* @__PURE__ */ import_react2.default.createElement("option", { value: "zh-CN-YunxiNeural" }, "\u4E91\u5E0C \xB7 \u666E\u901A\u8BDD\u7537\u58F0"))), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u65B0\u4EFB\u52A1\u63A8\u8350\u8BC4\u5BA1" }, /* @__PURE__ */ import_react2.default.createElement("select", { className: "mw-field", value: value.defaultReview, onChange: (e) => set("defaultReview", e.target.value) }, /* @__PURE__ */ import_react2.default.createElement("option", { value: "gates" }, "\u6807\u51C6 \xB7 \u56DB\u5173\u8BC4\u5BA1"), /* @__PURE__ */ import_react2.default.createElement("option", { value: "steps" }, "\u9010\u6B65\u8BC4\u5BA1")))), /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted", style: { marginTop: 12 } }, "\u8BC4\u5BA1\u65B9\u5F0F\u53EA\u5728\u63D0\u9700\u6C42\u65F6\u786E\u5B9A\u3002\u514D\u9636\u6BB5\u8BC4\u5BA1\u9700\u5728\u672C\u6B21\u4EFB\u52A1\u4E2D\u660E\u786E\u9009\u62E9\u3002")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "MiMo \u8BED\u97F3\uFF08\u5C0F\u7C73\uFF09"), /* @__PURE__ */ import_react2.default.createElement(Badge, { status: value.mimoApiKeySet ? "available" : "unknown" }, value.mimoApiKeySet ? `Token \u5DF2\u4FDD\u5B58 ${value.mimoApiKeyHint || ""}` : "\u672A\u914D\u7F6E Token")), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "API Token" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", type: "password", autoComplete: "off", value: value.mimoApiKey || "", placeholder: value.mimoApiKeySet ? "\u5DF2\u4FDD\u5B58\uFF0C\u7559\u7A7A\u8868\u793A\u4FDD\u6301\u4E0D\u53D8" : "\u5728\u5C0F\u7C73\u5F00\u653E\u5E73\u53F0\u521B\u5EFA\u540E\u7C98\u8D34\u5230\u8FD9\u91CC", onChange: (e) => setValue((old) => ({ ...old, mimoApiKey: e.target.value, clearMimoApiKey: false })) })), value.mimoApiKeySet && /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-row", style: { marginTop: 10 } }, /* @__PURE__ */ import_react2.default.createElement(Button, { onClick: () => setValue((old) => ({ ...old, mimoApiKey: "", clearMimoApiKey: true })) }, "\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684 Token")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 16 } }, /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u8BED\u97F3\u6A21\u578B" }, /* @__PURE__ */ import_react2.default.createElement("select", { className: "mw-field", value: value.mimoModel || "mimo-v2.5-tts", onChange: (e) => set("mimoModel", e.target.value) }, /* @__PURE__ */ import_react2.default.createElement("option", { value: "mimo-v2.5-tts" }, "mimo-v2.5-tts \xB7 \u9884\u7F6E\u97F3\u8272"), /* @__PURE__ */ import_react2.default.createElement("option", { value: "mimo-v2.5-tts-voicedesign" }, "mimo-v2.5-tts-voicedesign \xB7 \u6587\u672C\u8BBE\u8BA1\u97F3\u8272"), /* @__PURE__ */ import_react2.default.createElement("option", { value: "mimo-v2.5-tts-voiceclone" }, "mimo-v2.5-tts-voiceclone \xB7 \u53C2\u8003\u97F3\u9891\u590D\u523B"))), (value.ttsProvider === "mimo" || String(value.mimoApiKeySet || value.mimoApiKey || value.mimoVoice || "").trim()) && /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement(Field, { label: "MiMo \u9ED8\u8BA4\u97F3\u8272" }, /* @__PURE__ */ import_react2.default.createElement("select", { className: "mw-field", value: value.mimoVoice || "\u51B0\u7CD6", onChange: (e) => set("mimoVoice", e.target.value) }, MI_MO_VOICES.map((item) => /* @__PURE__ */ import_react2.default.createElement("option", { key: item.name, value: item.name }, item.name, " \xB7 ", item.label)))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-voice-preview" }, /* @__PURE__ */ import_react2.default.createElement(Button, { quiet: true, onClick: previewing ? stopPreview : () => preview(value.mimoVoice || "\u51B0\u7CD6") }, previewing ? "\u505C\u6B62\u8BD5\u542C" : "\u8BD5\u542C\u97F3\u8272"), previewing === "error" && /* @__PURE__ */ import_react2.default.createElement("span", { className: "mw-muted" }, "\u8BD5\u542C\u6837\u672C\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002"), /* @__PURE__ */ import_react2.default.createElement("span", { className: "mw-muted" }, "\u9884\u751F\u6210\u7684\u56FA\u5B9A\u6837\u672C\uFF08MiMo \u5B9E\u9645\u5408\u6210\uFF0C\u79BB\u7EBF\u53EF\u542C\uFF09\uFF0C\u4E0D\u6D88\u8017 Token\u3002")), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u63A5\u53E3\u5730\u5740" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", value: value.mimoBaseUrl || "", onChange: (e) => set("mimoBaseUrl", e.target.value), placeholder: "https://api.xiaomimimo.com/v1" })))), /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted", style: { marginTop: 12 } }, "MiMo \u53EA\u8FD4\u56DE\u97F3\u9891\uFF0C\u4E0D\u8FD4\u56DE\u8BCD\u7EA7\u65F6\u95F4\u7801\uFF0C\u6240\u4EE5 MiMo \u4EFB\u52A1\u6309\u6BCF\u53E5\u5B9E\u9645\u97F3\u9891\u65F6\u957F\u5BF9\u9F50\u5B57\u5E55\uFF1BToken \u53EA\u5B58\u5728\u672C\u5DE5\u4F5C\u7A7A\u95F4\uFF0C\u4E0D\u4F1A\u5199\u5165\u4EFB\u52A1\u76EE\u5F55\u3002\u914D\u97F3\u670D\u52A1\u5728\u65B0\u5EFA\u4EFB\u52A1\u65F6\u4ECD\u53EF\u5355\u72EC\u66F4\u6362\u3002")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u5185\u5BB9\u7531\u8C01\u6765\u5B8C\u6210"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-choice-grid mw-two" }, /* @__PURE__ */ import_react2.default.createElement("label", { className: "mw-choice" }, /* @__PURE__ */ import_react2.default.createElement("input", { type: "radio", name: "mw-generation", checked: !value.provider, onChange: () => {
    set("provider", "");
    set("model", "");
  } }), " \u5F53\u524D\u5BF9\u8BDD", /* @__PURE__ */ import_react2.default.createElement("small", null, "\u7531\u5BF9\u8BDD\u52A9\u624B\u67E5\u770B\u7D20\u6750\u3001\u5B8C\u6210\u811A\u672C\u4E0E\u5206\u955C\uFF0C\u5E76\u5BFC\u5165\u672C\u4EFB\u52A1\u3002")), /* @__PURE__ */ import_react2.default.createElement("label", { className: "mw-choice" }, /* @__PURE__ */ import_react2.default.createElement("input", { type: "radio", name: "mw-generation", checked: !!value.provider, disabled: !models.length, onChange: () => {
    set("provider", models[0]?.id || "");
    set("model", "");
  } }), " \u5DE5\u4F5C\u53F0\u6A21\u677F\u5236\u4F5C", /* @__PURE__ */ import_react2.default.createElement("small", null, "\u6307\u5B9A\u6A21\u578B\u751F\u6210\u5185\u5BB9\uFF0C\u5185\u7F6E\u6A21\u677F\u5408\u6210\u753B\u9762\uFF1B\u9002\u5408\u57FA\u7840\u89C6\u9891\u3002"))), value.provider && /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 18 } }, /* @__PURE__ */ import_react2.default.createElement(Field, { label: "DSH \u6A21\u578B\u63D0\u4F9B\u5546" }, /* @__PURE__ */ import_react2.default.createElement("select", { className: "mw-field", value: value.provider, onChange: (e) => {
    set("provider", e.target.value);
    set("model", "");
  } }, models.map((p) => /* @__PURE__ */ import_react2.default.createElement("option", { key: p.id, value: p.id }, p.name)))), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u6A21\u578B" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", list: modelList, value: value.model, onChange: (e) => set("model", e.target.value), placeholder: "\u9009\u62E9\u6216\u586B\u5199\u6A21\u578B\u6807\u8BC6" })), /* @__PURE__ */ import_react2.default.createElement("datalist", { id: modelList }, models.find((p) => p.id === value.provider)?.models.map((m) => /* @__PURE__ */ import_react2.default.createElement("option", { key: m.id, value: m.id }, m.name)))))), /* @__PURE__ */ import_react2.default.createElement("section", { hidden: section !== "publishing" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-setting-heading" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u8FDE\u63A5\u5B9E\u9645\u53D1\u5E03\u8D26\u53F7"), /* @__PURE__ */ import_react2.default.createElement("p", null, "\u5148\u9009\u62E9\u6D4F\u89C8\u5668\uFF0C\u518D\u68C0\u67E5\u5E73\u53F0\u767B\u5F55\u72B6\u6001\u3002\u53D1\u5E03\u8303\u56F4\u5728\u6BCF\u4E2A\u4EFB\u52A1\u4E2D\u786E\u5B9A\u3002")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u6D4F\u89C8\u5668\u8FDE\u63A5"), /* @__PURE__ */ import_react2.default.createElement(Button, { onClick: () => discover("bridges") }, "\u53D1\u73B0\u6D4F\u89C8\u5668")), bridges.length > 0 && /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-connection-list" }, bridges.map((b, i) => {
    const id = b.bridgeId || b.id;
    return /* @__PURE__ */ import_react2.default.createElement(Button, { key: id || i, primary: value.bridgeId === id, disabled: !id, onClick: () => set("bridgeId", id) }, b.browser || b.name || "Chrome", " \xB7 ", b.profileName || id);
  })), /* @__PURE__ */ import_react2.default.createElement("details", { open: !value.bridgeId }, /* @__PURE__ */ import_react2.default.createElement("summary", null, "\u624B\u52A8\u6307\u5B9A\u8FDE\u63A5"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 14 } }, /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u6D4F\u89C8\u5668\u6865\u63A5" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", value: value.bridgeId, onChange: (e) => set("bridgeId", e.target.value), placeholder: "bridge-\u2026" })), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u6D4F\u89C8\u5668\u4E0A\u4E0B\u6587" }, /* @__PURE__ */ import_react2.default.createElement("select", { className: "mw-field", value: value.browserContext, onChange: (e) => set("browserContext", e.target.value) }, /* @__PURE__ */ import_react2.default.createElement("option", { value: "regular" }, "\u666E\u901A\u7A97\u53E3"), /* @__PURE__ */ import_react2.default.createElement("option", { value: "incognito" }, "\u65E0\u75D5\u7A97\u53E3"))))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-row", style: { marginTop: 18 } }, /* @__PURE__ */ import_react2.default.createElement(Button, { primary: true, disabled: !value.bridgeId, onClick: () => discover("accounts") }, "\u68C0\u6D4B\u8D26\u53F7"), /* @__PURE__ */ import_react2.default.createElement(Button, { disabled: !value.bridgeId, onClick: () => discover("capabilities") }, "\u67E5\u770B\u5E73\u53F0\u80FD\u529B"))), accounts.length > 0 && /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, accounts.map((a, i) => /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-setting-row mw-row mw-between", key: i }, /* @__PURE__ */ import_react2.default.createElement("div", null, /* @__PURE__ */ import_react2.default.createElement("strong", null, a.platform), /* @__PURE__ */ import_react2.default.createElement("small", null, a.displayName || "\u8D26\u53F7\u8EAB\u4EFD\u672A\u786E\u8BA4")), /* @__PURE__ */ import_react2.default.createElement(Badge, { status: knownAccount(a) ? "available" : "unknown" }, knownAccount(a) ? "\u5DF2\u767B\u5F55" : "\u5F85\u786E\u8BA4")))), discovery && /* @__PURE__ */ import_react2.default.createElement("details", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("summary", null, "\u67E5\u770B\u8FDE\u63A5\u68C0\u6D4B\u8BE6\u60C5"), /* @__PURE__ */ import_react2.default.createElement("pre", null, JSON.stringify(discovery.value, null, 2)))), /* @__PURE__ */ import_react2.default.createElement("section", { hidden: section !== "understanding" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-setting-heading" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u8BFB\u61C2\u5B9E\u9645\u7D20\u6750"), /* @__PURE__ */ import_react2.default.createElement("p", null, "OCR\u3001\u8F6C\u5F55\u548C\u56FE\u50CF\u89C2\u5BDF\u4F1A\u4FDD\u7559\u6765\u6E90\u3001\u65F6\u95F4\u7801\u3001\u5DE5\u5177\u53CA\u5F85\u6838\u5B9E\u9879\u3002\u673A\u5668\u63D0\u53D6\u4E0D\u4F1A\u81EA\u52A8\u53D8\u6210\u5DF2\u6838\u5B9E\u4E8B\u5B9E\u3002")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel mw-form-grid" }, /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u7D20\u6750\u7406\u89E3\u7B56\u7565" }, /* @__PURE__ */ import_react2.default.createElement("select", { className: "mw-field", value: value.analysisMode, onChange: (e) => set("analysisMode", e.target.value) }, /* @__PURE__ */ import_react2.default.createElement("option", { value: "auto" }, "\u81EA\u52A8\u5904\u7406\uFF0C\u4FDD\u7559\u7F3A\u5931\u80FD\u529B\u4E0E\u672A\u77E5"), /* @__PURE__ */ import_react2.default.createElement("option", { value: "required" }, "\u5FC5\u987B\u5B8C\u6210\u5B9E\u9645\u63D0\u53D6\u4E0E\u56FE\u50CF\u7406\u89E3"), /* @__PURE__ */ import_react2.default.createElement("option", { value: "off" }, "\u4FDD\u7559\u539F\u4EF6\uFF0C\u7531\u5F53\u524D\u5BF9\u8BDD\u81EA\u884C\u7406\u89E3"))), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u7D20\u6750\u8BC6\u522B Python" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", value: value.mediaPython, onChange: (e) => set("mediaPython", e.target.value) })), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u8BED\u97F3\u6A21\u578B\u672C\u5730\u76EE\u5F55" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", value: value.asrModel, onChange: (e) => set("asrModel", e.target.value), placeholder: "\u8FD0\u884C\u73AF\u5883\u5B89\u88C5\u540E\u586B\u5199\u5B9E\u9645\u6A21\u578B\u76EE\u5F55" })), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u8BC6\u522B\u8BED\u8A00" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", value: value.analysisLanguage, onChange: (e) => set("analysisLanguage", e.target.value), placeholder: "auto / zh / en" })), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u89C6\u9891\u5173\u952E\u5E27\u6570\u91CF" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", type: "number", min: "1", max: "12", value: value.videoFrames, onChange: (e) => set("videoFrames", Number(e.target.value)) })), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u6BCF\u4EFD\u7D20\u6750\u8F6C\u5F55\u65F6\u957F\u9884\u7B97\uFF08\u5206\u949F\uFF09" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", type: "number", min: "1", max: "1440", value: value.analysisMaxMinutes, onChange: (e) => set("analysisMaxMinutes", Number(e.target.value)) })), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u56FE\u50CF\u7406\u89E3\u63D0\u4F9B\u5546" }, /* @__PURE__ */ import_react2.default.createElement("select", { className: "mw-field", value: value.visionProvider, onChange: (e) => set("visionProvider", e.target.value) }, /* @__PURE__ */ import_react2.default.createElement("option", { value: "" }, "\u6CBF\u7528\u5185\u5BB9\u6A21\u578B\u63D0\u4F9B\u5546"), models.map((p) => /* @__PURE__ */ import_react2.default.createElement("option", { value: p.id, key: p.id }, p.name)))), /* @__PURE__ */ import_react2.default.createElement(Field, { label: "\u56FE\u50CF\u7406\u89E3\u6A21\u578B" }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", value: value.visionModel, onChange: (e) => set("visionModel", e.target.value), placeholder: "\u7559\u7A7A\u6CBF\u7528\u5185\u5BB9\u6A21\u578B\uFF1B\u6267\u884C\u65F6\u68C0\u67E5\u56FE\u50CF\u80FD\u529B" }))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("p", null, "\u56FE\u7247\u4F1A\u901A\u8FC7\u5BBF\u4E3B\u9644\u4EF6\u670D\u52A1\u4F5C\u4E3A\u771F\u5B9E\u56FE\u50CF\u8F93\u5165\u3002\u6240\u9009\u6A21\u578B\u9700\u660E\u786E\u652F\u6301 image\uFF1B\u4EC5\u652F\u6301\u6587\u5B57\u65F6\u4E0D\u4F1A\u58F0\u79F0\u770B\u8FC7\u56FE\u7247\u3002\u5F53\u524D\u5BF9\u8BDD\u5236\u4F5C\u53EF\u8BFB\u53D6\u56FE\u50CF\u8BF7\u6C42\u5E76\u5BFC\u5165\u89C2\u5BDF\u7ED3\u679C\u3002"), /* @__PURE__ */ import_react2.default.createElement("p", null, "\u539F\u89C6\u9891\u4EC5\u62BD\u53D6\u5DF2\u6807\u660E\u65F6\u95F4\u7801\u7684\u5173\u952E\u5E27\uFF1B\u8FD9\u4E9B\u5E27\u4E0D\u4EE3\u8868\u9010\u5E27\u89C2\u770B\u3002\u8BED\u97F3\u8BCD\u65F6\u95F4\u7801\u6765\u81EA ASR\uFF0C\u4E0D\u80FD\u5192\u5145\u5F3A\u5236\u5BF9\u9F50\u6216\u4EBA\u5DE5\u542C\u6821\u3002"))), /* @__PURE__ */ import_react2.default.createElement("section", { hidden: section !== "tools" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-setting-heading" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u5236\u4F5C\u73AF\u5883"), /* @__PURE__ */ import_react2.default.createElement("p", null, "\u53EF\u7528\u65F6\u6CBF\u7528\u81EA\u52A8\u68C0\u6D4B\u7ED3\u679C\uFF0C\u9047\u5230\u95EE\u9898\u518D\u4FEE\u6539\u5DE5\u5177\u8DEF\u5F84\u3002")), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u786C\u4EF6\u7F16\u7801"), nvenc && /* @__PURE__ */ import_react2.default.createElement(Badge, { status: nvenc.status }, nvenc.status === "available" ? "GPU \u53EF\u7528" : nvenc.status === "unavailable" ? "\u672A\u53EF\u7528" : "\u5F85\u786E\u8BA4")), /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted" }, "GPU \u7F16\u7801\u80FD\u663E\u8457\u964D\u4F4E CPU \u5360\u7528\u3002\u5B83\u9700\u8981\u5728\u8FD9\u91CC\u660E\u786E\u6388\u6743\uFF0C\u63D2\u4EF6\u4E0D\u4F1A\u81EA\u884C\u7533\u8BF7\u63D0\u6743\u3002"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-choice-grid", style: { marginTop: 12 } }, [["auto", "\u81EA\u52A8\uFF08\u63A8\u8350\uFF09", "\u5148\u5B9E\u6D4B\uFF1A\u80FD\u7528 GPU \u5C31\u7528\uFF0C\u5931\u8D25\u81EA\u52A8\u56DE\u9000 CPU\u3002"], ["gpu", "\u5C3D\u91CF\u7528 GPU", "\u5DF2\u6388\u6743\u4F7F\u7528 GPU\uFF1B\u5B9E\u6D4B\u4ECD\u4E0D\u53EF\u7528\u65F6\u56DE\u9000 CPU \u5E76\u8BF4\u660E\u539F\u56E0\u3002"], ["cpu", "\u53EA\u7528 CPU", "\u59CB\u7EC8\u7528 libx264\u3002\u786E\u8BA4 GPU \u4E0D\u53EF\u7528\u65F6\u9009\u8FD9\u9879\u53EF\u7701\u53BB\u63A2\u6D4B\u3002"]].map(([v, name2, note]) => /* @__PURE__ */ import_react2.default.createElement("label", { className: "mw-choice", key: v }, /* @__PURE__ */ import_react2.default.createElement("input", { type: "radio", name: "mw-hwaccel", checked: (value.hardwareAcceleration || "auto") === v, onChange: () => set("hardwareAcceleration", v) }), " ", name2, /* @__PURE__ */ import_react2.default.createElement("small", null, note)))), nvenc?.details && /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted", style: { marginTop: 10 } }, typeof nvenc.details === "string" ? nvenc.details : JSON.stringify(nvenc.details))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react2.default.createElement("h3", null, "\u4F9D\u8D56\u4E0E\u81EA\u68C0"), /* @__PURE__ */ import_react2.default.createElement(Button, { disabled: dirty, onClick: () => perform("doctor", async () => setReport(await client.call("doctor"))) }, "\u91CD\u65B0\u68C0\u67E5")), dirty && /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted" }, "\u4FDD\u5B58\u5DE5\u5177\u8DEF\u5F84\u540E\u518D\u68C0\u6D4B\u3002"), report ? /* @__PURE__ */ import_react2.default.createElement(import_react2.default.Fragment, null, /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted" }, "\u68C0\u6D4B\u65F6\u95F4\uFF1A", new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" }).format(new Date(report.checkedAt))), report.capabilities.map((c) => /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-setting-row", key: c.id }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react2.default.createElement("strong", null, c.label), /* @__PURE__ */ import_react2.default.createElement(Badge, { status: c.status }, { available: "\u53EF\u7528", unavailable: "\u4E0D\u53EF\u7528", unknown: "\u5F85\u786E\u8BA4" }[c.status])), /* @__PURE__ */ import_react2.default.createElement("small", null, c.required ? "\u5F53\u524D\u5236\u4F5C\u5FC5\u9700" : "\u6309\u9700\u4F7F\u7528", c.version && ` \xB7 ${typeof c.version === "string" ? c.version : JSON.stringify(c.version)}`), c.status !== "available" && /* @__PURE__ */ import_react2.default.createElement("small", null, typeof c.details === "string" ? c.details : JSON.stringify(c.details)), /* @__PURE__ */ import_react2.default.createElement("details", null, /* @__PURE__ */ import_react2.default.createElement("summary", null, "\u68C0\u6D4B\u8BE6\u60C5"), /* @__PURE__ */ import_react2.default.createElement("pre", null, JSON.stringify(c, null, 2)))))) : /* @__PURE__ */ import_react2.default.createElement("p", { className: "mw-muted" }, "\u5C1A\u672A\u68C0\u6D4B")), /* @__PURE__ */ import_react2.default.createElement("details", { className: "mw-panel" }, /* @__PURE__ */ import_react2.default.createElement("summary", null, "\u9AD8\u7EA7\uFF1A\u81EA\u5B9A\u4E49\u5DE5\u5177\u8DEF\u5F84"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 18 } }, [["browser", "\u56FE\u7247\u5BFC\u51FA Chrome \u8DEF\u5F84"], ["ffmpeg", "ffmpeg \u8DEF\u5F84"], ["ffprobe", "ffprobe \u8DEF\u5F84"], ["python", "\u914D\u97F3 Python \u8DEF\u5F84"], ["postfaro", "PostFaro CLI \u8DEF\u5F84"], ["om", "huashu-motion \u5165\u53E3\uFF08\u7559\u7A7A\u81EA\u52A8\u67E5\u627E\u5DF2\u5B89\u88C5\u5DE5\u5177\uFF09"], ["font", "\u5B57\u5E55\u5B57\u4F53\u6587\u4EF6\uFF08\u53EF\u9009\uFF09"]].map(([key, label]) => /* @__PURE__ */ import_react2.default.createElement(Field, { key, label }, /* @__PURE__ */ import_react2.default.createElement("input", { className: "mw-field", value: value[key], onChange: (e) => set(key, e.target.value) }))))))))), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-settings-save" }, /* @__PURE__ */ import_react2.default.createElement("span", { role: "status" }, conflict ? "\u8BBE\u7F6E\u5DF2\u88AB\u5176\u4ED6\u7A97\u53E3\u4FEE\u6539\uFF0C\u4F60\u7684\u8349\u7A3F\u4ECD\u4FDD\u7559\u3002" : dirty ? "\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539" : "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58"), /* @__PURE__ */ import_react2.default.createElement("div", { className: "mw-row" }, /* @__PURE__ */ import_react2.default.createElement(Button, { disabled: !dirty && !conflict, onClick: () => perform("settings-reload", reload) }, conflict ? "\u8F7D\u5165\u6700\u65B0\u5E76\u653E\u5F03\u5F53\u524D\u4FEE\u6539" : "\u653E\u5F03\u4FEE\u6539"), /* @__PURE__ */ import_react2.default.createElement(Button, { primary: true, disabled: !dirty || conflict || !!busy, onClick: save }, "\u4FDD\u5B58\u8BBE\u7F6E"))));
}

// src/materials.jsx
var import_react3 = __toESM(require("react"), 1);
var t = (n) => Number.isFinite(n) ? `${n.toFixed(2)} \u79D2` : "\u672A\u6807\u6CE8";
function MaterialList({ materials, artifact, client, taskId }) {
  const path = (name2) => `${artifact.path.split("/").slice(0, -1).join("/")}/${name2}`;
  return /* @__PURE__ */ import_react3.default.createElement("div", null, materials.map((m) => /* @__PURE__ */ import_react3.default.createElement("section", { key: m.id, className: "mw-scene" }, /* @__PURE__ */ import_react3.default.createElement("h4", null, m.name), /* @__PURE__ */ import_react3.default.createElement("p", { className: "mw-muted" }, m.id, " \xB7 ", m.mime, " \xB7 \u51FA\u5904\uFF1A", m.attribution || m.url || "\u7528\u6237\u63D0\u4F9B", " \xB7 \u53EF\u7528\u8303\u56F4\uFF1A", m.usage || "\u672A\u58F0\u660E"), m.mime?.startsWith("image/") && /* @__PURE__ */ import_react3.default.createElement("img", { src: client.artifactUrl(taskId, path(m.file)), alt: m.name, style: { maxWidth: "100%", maxHeight: 260, objectFit: "contain" } }), m.mime?.startsWith("audio/") && /* @__PURE__ */ import_react3.default.createElement("audio", { controls: true, src: client.artifactUrl(taskId, path(m.file)), style: { maxWidth: "100%" } }), m.mime?.startsWith("video/") && /* @__PURE__ */ import_react3.default.createElement("video", { controls: true, preload: "metadata", src: client.artifactUrl(taskId, path(m.file)), style: { maxWidth: "100%" } }), m.analysis?.ocr && /* @__PURE__ */ import_react3.default.createElement("details", null, /* @__PURE__ */ import_react3.default.createElement("summary", null, "\u56FE\u7247 / \u6587\u6863\u8BC6\u522B\u6587\u5B57"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "mw-muted" }, m.analysis.ocr.tool, " \xB7 \u673A\u5668\u8BC6\u522B\uFF0C\u5F85\u7ED3\u5408\u539F\u4EF6\u6838\u5BF9\u3002"), /* @__PURE__ */ import_react3.default.createElement("pre", { style: { whiteSpace: "pre-wrap" } }, m.analysis.ocr.text?.slice(0, 2e4) || "\u672A\u8BC6\u522B\u51FA\u6587\u5B57"), m.analysis.ocr.text?.length > 2e4 && /* @__PURE__ */ import_react3.default.createElement("p", null, "\u6B64\u5904\u5C55\u793A\u524D 20000 \u5B57\uFF0C\u5B8C\u6574\u7ED3\u679C\u4FDD\u7559\u5728\u8BC6\u522B\u4EA7\u7269\u4E2D\u3002")), m.analysis?.transcript && /* @__PURE__ */ import_react3.default.createElement("details", null, /* @__PURE__ */ import_react3.default.createElement("summary", null, "\u8BED\u97F3\u8F6C\u5F55\u4E0E\u65F6\u95F4\u7801"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "mw-muted" }, m.analysis.transcript.tool, " \xB7 ", m.analysis.transcript.language, " \xB7 \u5B9E\u9645\u65F6\u957F ", t(m.analysis.transcript.duration), " \xB7 ASR \u65F6\u95F4\u7801"), m.analysis.transcript.segments.slice(0, 200).map((s, i) => /* @__PURE__ */ import_react3.default.createElement("div", { className: "mw-script-section", key: i }, /* @__PURE__ */ import_react3.default.createElement("small", null, t(s.start), " \u2013 ", t(s.end)), /* @__PURE__ */ import_react3.default.createElement("p", null, s.text), /* @__PURE__ */ import_react3.default.createElement("details", null, /* @__PURE__ */ import_react3.default.createElement("summary", null, "\u8BCD\u65F6\u95F4\u7801"), s.words?.map((w, j) => /* @__PURE__ */ import_react3.default.createElement("span", { className: "mw-timeline-word", key: j }, w.text, " \xB7 ", t(w.start)))))), m.analysis.transcript.segments.length > 200 && /* @__PURE__ */ import_react3.default.createElement("p", null, "\u6B64\u5904\u5C55\u793A\u524D 200 \u6BB5\uFF0C\u5B8C\u6574\u8F6C\u5F55\u4FDD\u7559\u5728\u4EA7\u7269\u6587\u4EF6\u4E2D\u3002")), m.analysis?.frames?.length > 0 && /* @__PURE__ */ import_react3.default.createElement("details", { open: true }, /* @__PURE__ */ import_react3.default.createElement("summary", null, "\u5B9E\u9645\u62BD\u53D6\u7684\u89C6\u9891\u5E27"), /* @__PURE__ */ import_react3.default.createElement("div", { style: { display: "flex", gap: 8, overflow: "auto" } }, m.analysis.frames.map((f) => /* @__PURE__ */ import_react3.default.createElement("figure", { key: f.file, style: { margin: 0, minWidth: 140, maxWidth: 220 } }, /* @__PURE__ */ import_react3.default.createElement("img", { src: client.artifactUrl(taskId, path(f.file)), alt: `${m.name} ${t(f.time)} \u62BD\u6837\u5E27`, style: { width: "100%" } }), /* @__PURE__ */ import_react3.default.createElement("figcaption", null, t(f.time))))), /* @__PURE__ */ import_react3.default.createElement("p", { className: "mw-muted" }, "\u8FD9\u662F\u5E26\u65F6\u95F4\u7801\u7684\u62BD\u6837\u5E27\uFF0C\u672A\u8868\u793A\u9010\u5E27\u89C2\u770B\u3002")), m.visualObservations?.length > 0 && /* @__PURE__ */ import_react3.default.createElement("details", { open: true }, /* @__PURE__ */ import_react3.default.createElement("summary", null, "\u5B9E\u9645\u56FE\u50CF\u89C2\u5BDF"), m.visualObservations.map((o) => /* @__PURE__ */ import_react3.default.createElement("div", { className: "mw-fact", key: o.id }, /* @__PURE__ */ import_react3.default.createElement("small", null, o.id), /* @__PURE__ */ import_react3.default.createElement("p", null, o.summary), o.readableText && /* @__PURE__ */ import_react3.default.createElement("pre", { style: { whiteSpace: "pre-wrap" } }, o.readableText), o.unknowns?.length > 0 && /* @__PURE__ */ import_react3.default.createElement("p", { className: "mw-muted" }, "\u5F85\u6838\u5B9E\uFF1A", o.unknowns.join("\uFF1B"))))), m.analysis?.unknowns?.length > 0 && /* @__PURE__ */ import_react3.default.createElement("p", { className: "mw-help" }, "\u5F85\u5904\u7406\uFF1A", m.analysis.unknowns.join("\uFF1B")), m.textEvidence && /* @__PURE__ */ import_react3.default.createElement("p", { className: "mw-muted" }, "\u6B63\u6587\u6765\u6E90\uFF1A", m.textEvidence, "\uFF1B\u673A\u5668\u63D0\u53D6\u4FDD\u7559\u4E0D\u786E\u5B9A\u6027\u3002"), m.text && !m.analysis?.ocr && !m.analysis?.transcript && /* @__PURE__ */ import_react3.default.createElement("details", null, /* @__PURE__ */ import_react3.default.createElement("summary", null, "\u6765\u6E90\u6B63\u6587"), /* @__PURE__ */ import_react3.default.createElement("pre", { style: { whiteSpace: "pre-wrap" } }, m.text.slice(0, 2e4))))));
}

// src/canvas.jsx
var import_react4 = __toESM(require("react"), 1);
function CanvasEditor({ client, task, busy, perform, refresh }) {
  const [data, setData] = (0, import_react4.useState)(null), [canvas, setCanvas] = (0, import_react4.useState)(null), [open, setOpen] = (0, import_react4.useState)(false), [pageId, setPageId] = (0, import_react4.useState)(""), [selected, setSelected] = (0, import_react4.useState)(""), [undo, setUndo] = (0, import_react4.useState)([]), [redo, setRedo] = (0, import_react4.useState)([]), [note, setNote] = (0, import_react4.useState)(""), [error, setError] = (0, import_react4.useState)(null), [width, setWidth] = (0, import_react4.useState)(600);
  const holder = (0, import_react4.useRef)(null), drag = (0, import_react4.useRef)(null), latest = (0, import_react4.useRef)(canvas);
  latest.current = canvas;
  (0, import_react4.useEffect)(() => {
    if (!holder.current) return;
    const o = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    o.observe(holder.current);
    return () => o.disconnect();
  }, [open, data]);
  const load = () => perform("canvas-load", async () => {
    const result = await client.call("canvas.get", { id: task.state.id });
    setData(result);
    setCanvas(result.canvas);
    setPageId(result.canvas.pages[0].id);
    setSelected("");
    setUndo([]);
    setRedo([]);
    setError(null);
    setOpen(true);
  });
  const change = (next) => {
    setUndo((h) => [...h.slice(-39), structuredClone(latest.current)]);
    setRedo([]);
    setCanvas(next);
  };
  const update = (patch, id = selected) => change({ ...canvas, pages: canvas.pages.map((p) => p.id === pageId ? { ...p, elements: p.elements.map((e) => e.id === id ? { ...e, ...patch } : e) } : p) });
  const page = canvas?.pages.find((p) => p.id === pageId) || canvas?.pages[0], element = page?.elements.find((e) => e.id === selected), scale = data ? Math.min(1, Math.max(0.12, (width - 8) / data.project.width)) : 1;
  const movePage = (delta) => {
    const pages = [...canvas.pages], i = pages.findIndex((p) => p.id === page.id), target = i + delta;
    if (target < 0 || target >= pages.length) return;
    [pages[i], pages[target]] = [pages[target], pages[i]];
    change({ ...canvas, pages });
  };
  const layer = (delta) => {
    const elements = [...page.elements], i = elements.findIndex((e) => e.id === selected), target = i + delta;
    if (target < 0 || target >= elements.length) return;
    [elements[i], elements[target]] = [elements[target], elements[i]];
    change({ ...canvas, pages: canvas.pages.map((p) => p.id === page.id ? { ...p, elements } : p) });
  };
  const pointerDown = (event, e, resize = false) => {
    if (busy) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(e.id);
    drag.current = { x: event.clientX, y: event.clientY, element: e, before: structuredClone(canvas), resize };
  };
  const pointerMove = (event) => {
    const d = drag.current;
    if (!d) return;
    const dx = (event.clientX - d.x) / scale, dy = (event.clientY - d.y) / scale, e = d.element, W = data.project.width, H = data.project.height;
    const patch = d.resize ? { width: Math.min(W - e.x, Math.max(20, Math.round(e.width + dx))), height: Math.min(H - e.y, Math.max(20, Math.round(e.height + dy))) } : { x: Math.max(0, Math.min(W - e.width, Math.round(e.x + dx))), y: Math.max(0, Math.min(H - e.height, Math.round(e.y + dy))) };
    setCanvas((old) => ({ ...old, pages: old.pages.map((p) => p.id === page.id ? { ...p, elements: p.elements.map((item) => item.id === e.id ? { ...item, ...patch } : item) } : p) }));
  };
  const pointerUp = () => {
    if (!drag.current) return;
    const before = drag.current.before;
    drag.current = null;
    setUndo((h) => [...h.slice(-39), before]);
    setRedo([]);
  };
  const add = (kind) => {
    const id = `layer-${crypto.randomUUID().slice(0, 12)}`, e = { id, kind, x: 30, y: 30, width: Math.min(300, data.project.width - 60), height: 120, ...kind === "text" ? { text: "\u8865\u5145\u8BF4\u660E", color: "#19242a", fontSize: 32, fontWeight: 400, lineHeight: 1.6 } : kind === "image" ? { imageId: Object.keys(data.project.images)[0], fit: "contain" } : { fill: data.project.primary, shape: "rect" } };
    change({ ...canvas, pages: canvas.pages.map((p) => p.id === page.id ? { ...p, elements: [...p.elements, e] } : p) });
    setSelected(id);
  };
  const dirty = data && JSON.stringify(canvas) !== JSON.stringify(data.canvas);
  return /* @__PURE__ */ import_react4.default.createElement("section", { style: { marginTop: 18 }, "aria-label": "\u81EA\u7531\u6392\u7248\u7F16\u8F91" }, /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: busy, onClick: load }, open ? "\u91CD\u65B0\u8F7D\u5165\u5F53\u524D\u7248\u672C" : "\u7F16\u8F91\u6B63\u6587\u4E0E\u81EA\u7531\u6392\u7248"), open && data && /* @__PURE__ */ import_react4.default.createElement("div", { className: "mw-canvas-editor", style: { marginTop: 14 } }, /* @__PURE__ */ import_react4.default.createElement("p", { className: "mw-muted" }, "\u62D6\u52A8\u753B\u5E03\u56FE\u5C42\uFF0C\u62D6\u52A8\u53F3\u4E0B\u89D2\u8C03\u6574\u5927\u5C0F\uFF1B\u6587\u5B57\u548C\u5750\u6807\u53EF\u5728\u4E0B\u65B9\u7CBE\u786E\u4FEE\u6539\u3002\u4FDD\u5B58\u540E\u751F\u6210\u4EA4\u4ED8\u65B0\u7248\u672C\uFF0C\u5E76\u6309\u5F53\u524D\u8BC4\u5BA1\u65B9\u5F0F\u7EE7\u7EED\u3002"), error && /* @__PURE__ */ import_react4.default.createElement("p", { role: "alert", className: "mw-error" }, error.message), /* @__PURE__ */ import_react4.default.createElement("div", { className: "mw-row", style: { margin: "12px 0" } }, /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: !undo.length || busy, onClick: () => {
    setRedo((h) => [...h, structuredClone(canvas)]);
    setCanvas(undo.at(-1));
    setUndo((h) => h.slice(0, -1));
  } }, "\u64A4\u9500"), /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: !redo.length || busy, onClick: () => {
    setUndo((h) => [...h, structuredClone(canvas)]);
    setCanvas(redo.at(-1));
    setRedo((h) => h.slice(0, -1));
  } }, "\u6062\u590D\u7F16\u8F91"), /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: busy, onClick: () => add("text") }, "\u52A0\u6587\u5B57"), /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: busy || !Object.keys(data.project.images).length, onClick: () => add("image") }, "\u52A0\u56FE\u7247"), /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: busy, onClick: () => add("shape") }, "\u52A0\u5F62\u72B6"), /* @__PURE__ */ import_react4.default.createElement(Button, { quiet: true, onClick: () => setOpen(false) }, "\u6536\u8D77\u7F16\u8F91")), /* @__PURE__ */ import_react4.default.createElement("div", { className: "mw-row" }, /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u5F53\u524D\u9875\u9762" }, /* @__PURE__ */ import_react4.default.createElement("select", { className: "mw-field", value: page.id, onChange: (e) => {
    setPageId(e.target.value);
    setSelected("");
  } }, canvas.pages.map((p, i) => /* @__PURE__ */ import_react4.default.createElement("option", { value: p.id, key: p.id }, "\u7B2C ", i + 1, " \u9875")))), /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: busy, onClick: () => movePage(-1) }, "\u9875\u9762\u524D\u79FB"), /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: busy, onClick: () => movePage(1) }, "\u9875\u9762\u540E\u79FB"), /* @__PURE__ */ import_react4.default.createElement(Button, { disabled: busy || canvas.pages.length >= 40, onClick: () => {
    const id = `page-${crypto.randomUUID().slice(0, 10)}`;
    change({ ...canvas, pages: [...canvas.pages, { id, background: "#ffffff", elements: [] }] });
    setPageId(id);
    setSelected("");
  } }, "\u52A0\u9875\u9762"), /* @__PURE__ */ import_react4.default.createElement(Button, { danger: true, disabled: busy || canvas.pages.length <= 1 || page.elements.some((e) => e.sectionId), onClick: () => {
    change({ ...canvas, pages: canvas.pages.filter((p) => p.id !== page.id) });
    setPageId(canvas.pages.find((p) => p.id !== page.id).id);
    setSelected("");
  } }, "\u5220\u9664\u7A7A\u767D\u6216\u88C5\u9970\u9875"), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u9875\u9762\u5E95\u8272" }, /* @__PURE__ */ import_react4.default.createElement("input", { type: "color", value: page.background, onChange: (e) => change({ ...canvas, pages: canvas.pages.map((p) => p.id === page.id ? { ...p, background: e.target.value } : p) }) }))), /* @__PURE__ */ import_react4.default.createElement("div", { ref: holder, style: { width: "100%", minWidth: 0, overflow: "auto", margin: "14px 0", background: "#dfe3e7" } }, /* @__PURE__ */ import_react4.default.createElement("div", { style: { width: data.project.width * scale, height: data.project.height * scale } }, /* @__PURE__ */ import_react4.default.createElement("div", { "aria-label": "\u53EF\u7F16\u8F91\u753B\u5E03", style: { position: "relative", width: data.project.width, height: data.project.height, background: page.background, transform: `scale(${scale})`, transformOrigin: "top left", overflow: "hidden" } }, page.elements.map((e) => {
    const common = { position: "absolute", left: e.x, top: e.y, width: e.width, height: e.height, transform: `rotate(${e.rotate || 0}deg)`, opacity: e.opacity ?? 1, borderRadius: e.radius || 0, outline: selected === e.id ? `${2 / scale}px solid #315abb` : void 0, touchAction: "none", cursor: "move", boxSizing: "border-box" };
    return /* @__PURE__ */ import_react4.default.createElement("div", { role: "button", tabIndex: 0, "aria-label": `\u56FE\u5C42 ${e.text?.slice(0, 30) || e.kind}`, "aria-pressed": selected === e.id, key: e.id, style: common, onPointerDown: (ev) => pointerDown(ev, e), onPointerMove: pointerMove, onPointerUp: pointerUp, onPointerCancel: pointerUp, onKeyDown: (ev) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(ev.key)) {
        ev.preventDefault();
        const d = ev.shiftKey ? 10 : 1;
        update({ x: Math.max(0, Math.min(data.project.width - e.width, e.x + (ev.key === "ArrowLeft" ? -d : ev.key === "ArrowRight" ? d : 0))), y: Math.max(0, Math.min(data.project.height - e.height, e.y + (ev.key === "ArrowUp" ? -d : ev.key === "ArrowDown" ? d : 0))) }, e.id);
      } else if (ev.key === "Enter") setSelected(e.id);
    } }, e.kind === "text" ? /* @__PURE__ */ import_react4.default.createElement("div", { style: { width: "100%", height: "100%", color: e.color, fontSize: e.fontSize, fontWeight: e.fontWeight || 400, lineHeight: e.lineHeight || 1.6, textAlign: e.align || "left", whiteSpace: "pre-wrap", overflowWrap: "anywhere", overflow: "hidden" } }, e.text) : e.kind === "shape" ? /* @__PURE__ */ import_react4.default.createElement("div", { style: { width: "100%", height: "100%", background: e.fill, borderRadius: e.shape === "ellipse" ? "50%" : e.radius || 0 } }) : /* @__PURE__ */ import_react4.default.createElement("img", { draggable: false, alt: data.project.images[e.imageId]?.name || "", src: data.project.images[e.imageId]?.sourcePath ? client.artifactUrl(task.state.id, data.project.images[e.imageId].sourcePath) : client.canvasImageUrl(task.state.id, data.sourcePath, e.imageId), style: { width: "100%", height: "100%", objectFit: e.fit || "contain", pointerEvents: "none" } }), selected === e.id && /* @__PURE__ */ import_react4.default.createElement("span", { "aria-label": "\u8C03\u6574\u56FE\u5C42\u5927\u5C0F", style: { position: "absolute", right: -5 / scale, bottom: -5 / scale, width: 12 / scale, height: 12 / scale, background: "#315abb", cursor: "nwse-resize" }, onPointerDown: (ev) => pointerDown(ev, e, true), onPointerMove: pointerMove, onPointerUp: pointerUp }));
  })))), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u9009\u62E9\u56FE\u5C42" }, /* @__PURE__ */ import_react4.default.createElement("select", { className: "mw-field", value: selected, onChange: (e) => setSelected(e.target.value) }, /* @__PURE__ */ import_react4.default.createElement("option", { value: "" }, "\u8BF7\u9009\u62E9"), page.elements.map((e, i) => /* @__PURE__ */ import_react4.default.createElement("option", { value: e.id, key: e.id }, i + 1, ". ", e.text?.slice(0, 24) || data.project.images[e.imageId]?.name || "\u5F62\u72B6")))), element && /* @__PURE__ */ import_react4.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 12 } }, element.kind === "text" && /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u56FE\u5C42\u6587\u5B57" }, /* @__PURE__ */ import_react4.default.createElement("textarea", { className: "mw-field", value: element.text, onChange: (e) => update({ text: e.target.value }) })), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u56FE\u5C42\u5B57\u53F7" }, /* @__PURE__ */ import_react4.default.createElement("input", { className: "mw-field", type: "number", min: "8", max: "300", value: element.fontSize, onChange: (e) => update({ fontSize: Number(e.target.value) }) })), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u6587\u5B57\u989C\u8272" }, /* @__PURE__ */ import_react4.default.createElement("input", { type: "color", value: element.color, onChange: (e) => update({ color: e.target.value }) })), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u6587\u5B57\u5BF9\u9F50" }, /* @__PURE__ */ import_react4.default.createElement("select", { className: "mw-field", value: element.align || "left", onChange: (e) => update({ align: e.target.value }) }, /* @__PURE__ */ import_react4.default.createElement("option", { value: "left" }, "\u5DE6\u5BF9\u9F50"), /* @__PURE__ */ import_react4.default.createElement("option", { value: "center" }, "\u5C45\u4E2D"), /* @__PURE__ */ import_react4.default.createElement("option", { value: "right" }, "\u53F3\u5BF9\u9F50"))), /* @__PURE__ */ import_react4.default.createElement(Button, { onClick: () => update({ fontWeight: element.fontWeight === 700 ? 400 : 700 }) }, "\u5207\u6362\u7C97\u4F53")), [["x", "\u6A2A\u5750\u6807"], ["y", "\u7EB5\u5750\u6807"], ["width", "\u56FE\u5C42\u5BBD\u5EA6"], ["height", "\u56FE\u5C42\u9AD8\u5EA6"], ["rotate", "\u65CB\u8F6C\u89D2\u5EA6"], ["opacity", "\u900F\u660E\u5EA6"], ["radius", "\u5706\u89D2"]].map(([key, label]) => /* @__PURE__ */ import_react4.default.createElement(Field, { key, label }, /* @__PURE__ */ import_react4.default.createElement("input", { className: "mw-field", type: "number", step: key === "opacity" ? 0.1 : 1, value: element[key] ?? (key === "opacity" ? 1 : 0), onChange: (e) => update({ [key]: Number(e.target.value) }) }))), element.kind === "image" && /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u56FE\u5C42\u56FE\u7247" }, /* @__PURE__ */ import_react4.default.createElement("select", { className: "mw-field", value: element.imageId, onChange: (e) => update({ imageId: e.target.value }) }, Object.entries(data.project.images).map(([id, image]) => /* @__PURE__ */ import_react4.default.createElement("option", { value: id, key: id }, image.name)))), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u56FE\u7247\u88C1\u5207" }, /* @__PURE__ */ import_react4.default.createElement("select", { className: "mw-field", value: element.fit || "contain", onChange: (e) => update({ fit: e.target.value }) }, /* @__PURE__ */ import_react4.default.createElement("option", { value: "contain" }, "\u5B8C\u6574\u663E\u793A"), /* @__PURE__ */ import_react4.default.createElement("option", { value: "cover" }, "\u586B\u6EE1\u88C1\u5207")))), element.kind === "shape" && /* @__PURE__ */ import_react4.default.createElement(import_react4.default.Fragment, null, /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u5F62\u72B6\u989C\u8272" }, /* @__PURE__ */ import_react4.default.createElement("input", { type: "color", value: element.fill, onChange: (e) => update({ fill: e.target.value }) })), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u5F62\u72B6" }, /* @__PURE__ */ import_react4.default.createElement("select", { className: "mw-field", value: element.shape, onChange: (e) => update({ shape: e.target.value }) }, /* @__PURE__ */ import_react4.default.createElement("option", { value: "rect" }, "\u77E9\u5F62"), /* @__PURE__ */ import_react4.default.createElement("option", { value: "ellipse" }, "\u692D\u5706")))), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u56FE\u5C42\u79FB\u5230\u9875\u9762" }, /* @__PURE__ */ import_react4.default.createElement("select", { className: "mw-field", value: page.id, onChange: (ev) => {
    const target = ev.target.value;
    change({ ...canvas, pages: canvas.pages.map((p) => p.id === page.id ? { ...p, elements: p.elements.filter((e) => e.id !== element.id) } : p.id === target ? { ...p, elements: [...p.elements, element] } : p) });
    setPageId(target);
  } }, canvas.pages.map((p, i) => /* @__PURE__ */ import_react4.default.createElement("option", { value: p.id, key: p.id }, "\u7B2C ", i + 1, " \u9875")))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "mw-row" }, /* @__PURE__ */ import_react4.default.createElement(Button, { onClick: () => layer(1) }, "\u4E0A\u79FB\u4E00\u5C42"), /* @__PURE__ */ import_react4.default.createElement(Button, { onClick: () => layer(-1) }, "\u4E0B\u79FB\u4E00\u5C42"), /* @__PURE__ */ import_react4.default.createElement(Button, { danger: true, disabled: !!element.sectionId, onClick: () => {
    change({ ...canvas, pages: canvas.pages.map((p) => p.id === page.id ? { ...p, elements: p.elements.filter((e) => e.id !== element.id) } : p) });
    setSelected("");
  } }, "\u5220\u9664\u56FE\u5C42"))), /* @__PURE__ */ import_react4.default.createElement(Field, { label: "\u753B\u5E03\u4FEE\u6539\u8BF4\u660E" }, /* @__PURE__ */ import_react4.default.createElement("textarea", { className: "mw-field", value: note, onChange: (e) => setNote(e.target.value), placeholder: "\u672C\u7248\u5B9E\u9645\u4FEE\u6539\uFF1B\u672A\u6838\u5B9E\u5185\u5BB9\u4F1A\u4FDD\u7559\u6807\u8BB0\u3002" })), /* @__PURE__ */ import_react4.default.createElement(Button, { primary: true, disabled: !dirty || busy, onClick: () => perform("canvas-save", async () => {
    try {
      await client.call("canvas.save", { id: task.state.id, canvas, inputDigest: data.inputDigest, note });
      setOpen(false);
      refresh();
    } catch (e) {
      setError(e);
      throw e;
    }
  }) }, "\u4FDD\u5B58\u753B\u5E03\u4E3A\u65B0\u7248\u672C")));
}

// src/ideas.jsx
var import_react5 = __toESM(require("react"), 1);
function editableText(item) {
  const body = item.body?.trim() || "";
  const title = item.title?.trim() || "";
  const repeatsTitle = body.split(/\r?\n/, 1)[0] === title || title.endsWith("\u2026") && body.startsWith(title.slice(0, -1));
  return [
    repeatsTitle ? "" : title,
    body,
    item.url && !linksInText(`${title}
${body}`).includes(new URL(item.url).href) ? item.url : ""
  ].filter(Boolean).join("\n\n");
}
function IdeaProduction({ client, item, busy, onStart, onCancel }) {
  const [type, setType] = (0, import_react5.useState)("article"), [styleId, setStyleId] = (0, import_react5.useState)(""), [request, setRequest] = (0, import_react5.useState)("");
  const dialog = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    dialog.current?.focus();
  }, []);
  return /* @__PURE__ */ import_react5.default.createElement("section", { ref: dialog, tabIndex: -1, className: "mw-idea-form mw-idea-production", role: "dialog", "aria-label": "\u4ECE\u7075\u611F\u5236\u4F5C" }, /* @__PURE__ */ import_react5.default.createElement("h3", null, "\u4ECE\u8FD9\u6761\u7075\u611F\u5F00\u59CB"), /* @__PURE__ */ import_react5.default.createElement("p", { className: "mw-muted" }, item.title), /* @__PURE__ */ import_react5.default.createElement("fieldset", { disabled: !!busy }, /* @__PURE__ */ import_react5.default.createElement(Field, { label: "\u5236\u4F5C\u8BF4\u660E\uFF08\u53EF\u9009\uFF09" }, /* @__PURE__ */ import_react5.default.createElement("textarea", { className: "mw-field mw-writing-input", rows: 2, maxLength: 3e4, value: request, onChange: (e) => setRequest(e.target.value), placeholder: "\u60F3\u5F3A\u8C03\u4EC0\u4E48\u3001\u7ED9\u8C01\u770B\uFF0C\u76F4\u63A5\u8BF4\u3002" })), /* @__PURE__ */ import_react5.default.createElement(WorkChoices, { client, type, styleId, onType: setType, onStyle: setStyleId }), /* @__PURE__ */ import_react5.default.createElement("div", { className: "mw-row mw-compose-actions" }, /* @__PURE__ */ import_react5.default.createElement("small", { className: "mw-muted" }, "\u540C\u7C7B\u578B\u5DF2\u6709\u4F5C\u54C1\u4F1A\u6253\u5F00\u539F\u7A3F\u3002"), /* @__PURE__ */ import_react5.default.createElement(Button, { quiet: true, onClick: onCancel }, "\u53D6\u6D88"), /* @__PURE__ */ import_react5.default.createElement(Button, { primary: true, onClick: () => onStart(item.id, type, { request: request.trim(), writingStyleId: styleId }) }, "\u5F00\u59CB\u5236\u4F5C"))));
}
async function saveIdea(client, operation) {
  const result = await client.call("ideas.save", { ops: [operation] });
  if (result.errors.length) throw new Error(result.errors[0]);
  return result.state.items;
}
function IdeaCapture({ client, busy, perform, onSaved, editing, onCancel, onUploading, hidden }) {
  const [form, setForm] = (0, import_react5.useState)(() => ({ text: editing ? editableText(editing) : "", media: editing?.media ?? null }));
  const [uploading, setUploading] = (0, import_react5.useState)(false), [error, setError] = (0, import_react5.useState)(null), [saved, setSaved] = (0, import_react5.useState)(false);
  const capture = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    if (editing && !hidden) capture.current?.querySelector("textarea")?.focus();
  }, [editing, hidden]);
  const submit = (event) => {
    event.preventDefault();
    const text = form.text.trim();
    if (busy || uploading || !text && !form.media) return;
    const firstLine = text.split(/\r?\n/, 1)[0];
    const title = firstLine.length > 80 ? `${firstLine.slice(0, 79)}\u2026` : firstLine || "\u7075\u611F\u7D20\u6750";
    const fields = { title, body: text, url: linksInText(text)[0] || null, media: form.media };
    setError(null);
    perform("idea-save", async () => {
      const items = await saveIdea(client, editing ? { op: "update", id: editing.id, ...fields } : { op: "add", ...fields });
      setForm({ text: "", media: null });
      setSaved(true);
      onSaved(items);
    });
  };
  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    onUploading?.(true);
    setError(null);
    setSaved(false);
    try {
      const media = await client.ideaUpload(file);
      setForm((current) => ({ ...current, media: { src: media.src, mime: media.mime } }));
    } catch (error2) {
      setError(error2);
    } finally {
      setUploading(false);
      onUploading?.(false);
    }
  };
  return /* @__PURE__ */ import_react5.default.createElement("form", { ref: capture, className: "mw-idea-form mw-idea-capture", hidden, onSubmit: submit, "aria-label": editing ? "\u7F16\u8F91\u7075\u611F\u8868\u5355" : "\u8BB0\u5F55\u7075\u611F" }, /* @__PURE__ */ import_react5.default.createElement("fieldset", { disabled: !!busy || uploading }, /* @__PURE__ */ import_react5.default.createElement(Field, { label: editing ? "\u7F16\u8F91\u7075\u611F" : "\u8BB0\u4E0B\u7075\u611F" }, /* @__PURE__ */ import_react5.default.createElement("textarea", { className: "mw-field mw-writing-input", rows: 2, maxLength: 4e4, value: form.text, onChange: (e) => {
    setForm({ ...form, text: e.target.value });
    setSaved(false);
  }, placeholder: "\u5199\u4E00\u53E5\u60F3\u6CD5\uFF0C\u6216\u8D34\u4E00\u6761\u94FE\u63A5\u3002" })), /* @__PURE__ */ import_react5.default.createElement("div", { className: "mw-row mw-compose-actions" }, /* @__PURE__ */ import_react5.default.createElement("label", { className: "mw-button mw-quiet mw-file-pick" }, /* @__PURE__ */ import_react5.default.createElement(AttachmentIcon, null), "\u6DFB\u52A0\u56FE\u7247\u6216\u89C6\u9891", /* @__PURE__ */ import_react5.default.createElement("input", { type: "file", accept: "image/*,video/*", onChange: (e) => {
    upload(e.target.files?.[0]);
    e.target.value = "";
  } })), form.media && /* @__PURE__ */ import_react5.default.createElement(Button, { quiet: true, onClick: () => setForm({ ...form, media: null }) }, "\u79FB\u9664\u9644\u4EF6"), editing && /* @__PURE__ */ import_react5.default.createElement(Button, { quiet: true, onClick: onCancel }, "\u53D6\u6D88\u7F16\u8F91"), saved && /* @__PURE__ */ import_react5.default.createElement("small", { role: "status" }, "\u5DF2\u8BB0\u5230\u7075\u611F\u5899"), /* @__PURE__ */ import_react5.default.createElement("button", { className: "mw-button mw-primary", type: "submit", disabled: !form.text.trim() && !form.media }, editing ? "\u4FDD\u5B58\u4FEE\u6539" : "\u8BB0\u4E0B"))), uploading && /* @__PURE__ */ import_react5.default.createElement("small", { role: "status" }, "\u6B63\u5728\u4E0A\u4F20\u9644\u4EF6\u2026"), error && /* @__PURE__ */ import_react5.default.createElement("div", { className: "mw-error", role: "alert" }, error.message));
}
function IdeaWall({ client, busy, perform, onStartWork, visible }) {
  const [items, setItems] = (0, import_react5.useState)(null), [error, setError] = (0, import_react5.useState)(null);
  const [editing, setEditing] = (0, import_react5.useState)(null), [producing, setProducing] = (0, import_react5.useState)(null), [uploading, setUploading] = (0, import_react5.useState)(false);
  const productionTrigger = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    if (!visible) {
      setProducing(null);
      return;
    }
    const controller = new AbortController();
    client.call("ideas.list", {}, controller.signal).then((data) => {
      if (!controller.signal.aborted) {
        setItems(data.items || []);
        setError(null);
      }
    }).catch((error2) => {
      if (!controller.signal.aborted) setError(error2);
    });
    return () => controller.abort();
  }, [client, visible]);
  const remove = (id) => perform("idea-delete", async () => {
    setItems(await saveIdea(client, { op: "delete", id }));
    if (editing?.id === id) setEditing(null);
    if (producing?.id === id) setProducing(null);
  });
  return /* @__PURE__ */ import_react5.default.createElement("div", { className: "mw-ideas" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "mw-page-title" }, /* @__PURE__ */ import_react5.default.createElement("div", null, /* @__PURE__ */ import_react5.default.createElement("span", { className: "mw-eyebrow" }, "\u7075\u611F\u5899"), /* @__PURE__ */ import_react5.default.createElement("h2", null, "\u5148\u8BB0\u4E0B\u6765"))), error && /* @__PURE__ */ import_react5.default.createElement("div", { className: "mw-error", role: "alert" }, error.message), /* @__PURE__ */ import_react5.default.createElement(
    IdeaCapture,
    {
      key: editing?.id || "new",
      client,
      busy,
      perform,
      hidden: !!producing,
      onUploading: setUploading,
      editing,
      onCancel: () => setEditing(null),
      onSaved: (next) => {
        setItems(next);
        setEditing(null);
      }
    }
  ), producing && /* @__PURE__ */ import_react5.default.createElement(IdeaProduction, { key: producing.id, client, item: producing, busy, onStart: onStartWork, onCancel: () => {
    setProducing(null);
    productionTrigger.current?.focus();
  } }), /* @__PURE__ */ import_react5.default.createElement("div", { className: "mw-idea-wall" }, items === null ? /* @__PURE__ */ import_react5.default.createElement("p", { className: "mw-muted" }, "\u6B63\u5728\u8BFB\u53D6\u7075\u611F\u2026") : items.length ? items.map((item) => {
    const firstLine = item.body?.split(/\r?\n/, 1)[0] || "";
    const body = firstLine === item.title ? item.body.slice(firstLine.length).trim() : item.body;
    return /* @__PURE__ */ import_react5.default.createElement("article", { className: "mw-idea-card", key: item.id }, item.media?.src && /* @__PURE__ */ import_react5.default.createElement("div", { className: "mw-idea-media" }, item.media.mime?.startsWith("video") ? /* @__PURE__ */ import_react5.default.createElement("video", { src: client.ideaMediaUrl(item.media.src), controls: true, preload: "metadata" }) : /* @__PURE__ */ import_react5.default.createElement("img", { src: client.ideaMediaUrl(item.media.src), alt: item.title, loading: "lazy" })), /* @__PURE__ */ import_react5.default.createElement("h3", null, item.title), body && /* @__PURE__ */ import_react5.default.createElement("p", null, body), item.url && /* @__PURE__ */ import_react5.default.createElement("a", { href: item.url, target: "_blank", rel: "noopener noreferrer nofollow" }, "\u6253\u5F00\u539F\u94FE\u63A5 \u2197"), /* @__PURE__ */ import_react5.default.createElement("div", { className: "mw-idea-actions" }, /* @__PURE__ */ import_react5.default.createElement(Button, { className: "mw-idea-start", disabled: !!busy || uploading, onClick: (event) => {
      productionTrigger.current = event.currentTarget;
      setProducing(item);
    } }, "\u5F00\u59CB\u5236\u4F5C ", /* @__PURE__ */ import_react5.default.createElement("span", { "aria-hidden": "true" }, "\u2192")), /* @__PURE__ */ import_react5.default.createElement(
      "details",
      {
        className: "mw-idea-menu",
        onBlur: (event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
        },
        onKeyDown: (event) => {
          if (event.key === "Escape" && event.currentTarget.open) {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }
      },
      /* @__PURE__ */ import_react5.default.createElement("summary", { className: "mw-button mw-quiet", "aria-label": "\u66F4\u591A\u64CD\u4F5C" }, /* @__PURE__ */ import_react5.default.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true" }, /* @__PURE__ */ import_react5.default.createElement("circle", { cx: "3", cy: "8", r: "1" }), /* @__PURE__ */ import_react5.default.createElement("circle", { cx: "8", cy: "8", r: "1" }), /* @__PURE__ */ import_react5.default.createElement("circle", { cx: "13", cy: "8", r: "1" }))),
      /* @__PURE__ */ import_react5.default.createElement("div", null, /* @__PURE__ */ import_react5.default.createElement(Button, { quiet: true, disabled: !!busy || uploading, onClick: (event) => {
        event.currentTarget.closest("details").open = false;
        setProducing(null);
        setEditing({ ...item });
      } }, "\u7F16\u8F91"), /* @__PURE__ */ import_react5.default.createElement(Button, { quiet: true, danger: true, disabled: !!busy || uploading, onClick: (event) => {
        event.currentTarget.closest("details").open = false;
        remove(item.id);
      } }, "\u5220\u9664"))
    )));
  }) : /* @__PURE__ */ import_react5.default.createElement("p", { className: "mw-muted" }, "\u8BB0\u4E0B\u7684\u60F3\u6CD5\u548C\u7D20\u6750\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002")));
}

// src/styles-panel.jsx
var import_react6 = __toESM(require("react"), 1);
function StylePanel({ client, busy, perform }) {
  const [data, setData] = (0, import_react6.useState)(null), [error, setError] = (0, import_react6.useState)(null), [paste, setPaste] = (0, import_react6.useState)(""), [name2, setName] = (0, import_react6.useState)(""), [editing, setEditing] = (0, import_react6.useState)(null);
  const load = (0, import_react6.useCallback)(() => {
    const c = new AbortController();
    client.call("styles.list", {}, c.signal).then((value) => {
      if (!c.signal.aborted) {
        setData(value);
        setError(null);
      }
    }).catch((e) => {
      if (!c.signal.aborted) setError(e);
    });
    return () => c.abort();
  }, [client]);
  (0, import_react6.useEffect)(() => load(), [load]);
  const save = (ops, label) => perform(label || "styles", async () => {
    const result = await client.call("styles.save", { ops });
    setData(result);
    setEditing(null);
  });
  const active = data?.active || null;
  const grouped = (data?.categories || []).map((category) => [category, (data?.styles || []).filter((row) => row.category === category)]);
  const custom = (data?.styles || []).filter((row) => !row.preset);
  return /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-styles-panel" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-page-title" }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("span", { className: "mw-eyebrow" }, "\u98CE\u683C\u7CFB\u7EDF"), /* @__PURE__ */ import_react6.default.createElement("h2", null, "\u9009\u5B9A\u4E00\u79CD\u5199\u6CD5"), /* @__PURE__ */ import_react6.default.createElement("p", { className: "mw-muted" }, "\u9009\u4E00\u4E2A\u9884\u8BBE\u6216\u7528\u4F60\u81EA\u5DF1\u7684\u6587\u672C\u63D0\u70BC\u4E13\u5C5E\u98CE\u683C\uFF1B\u751F\u6548\u7684\u98CE\u683C\u4F1A\u8FDB\u5165\u65B0\u5EFA\u4EFB\u52A1\u7684\u751F\u6210\u6307\u5BFC\u3002")), /* @__PURE__ */ import_react6.default.createElement(Badge, { status: active ? "available" : "unknown" }, active ? `\u751F\u6548\uFF1A${active.name}` : "\u672A\u9009\u62E9\u98CE\u683C")), error && /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-error", role: "alert" }, error.message || String(error)), active && /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-panel mw-style-active" }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react6.default.createElement("strong", null, active.icon, " ", active.name), /* @__PURE__ */ import_react6.default.createElement(Button, { quiet: true, onClick: () => save([{ op: "setActive", id: null }], "style-clear") }, "\u505C\u7528")), /* @__PURE__ */ import_react6.default.createElement("p", { className: "mw-muted" }, active.summary), /* @__PURE__ */ import_react6.default.createElement("details", null, /* @__PURE__ */ import_react6.default.createElement("summary", null, "\u67E5\u770B\u4F1A\u6CE8\u5165\u7684\u751F\u6210\u6307\u5BFC"), /* @__PURE__ */ import_react6.default.createElement("pre", null, [active.tone && `\u8BED\u6C14\uFF1A${active.tone}`, active.sentences && `\u53E5\u5F0F\uFF1A${active.sentences}`, active.structure && `\u7ED3\u6784\uFF1A${active.structure}`, active.words?.length ? `\u5E38\u7528\u8868\u8FBE\uFF1A${active.words.join("\u3001")}` : ""].filter(Boolean).join("\n")))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react6.default.createElement("h3", null, "\u4ECE\u81EA\u5DF1\u7684\u6587\u672C\u63D0\u70BC\u4E13\u5C5E\u98CE\u683C"), /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-form-grid" }, /* @__PURE__ */ import_react6.default.createElement("label", { className: "mw-label mw-full" }, "\u7C98\u8D34\u4E00\u6BB5\u4F60\u7684\u771F\u5B9E\u4F5C\u54C1\uFF08\u81F3\u5C11 40 \u5B57\uFF09", /* @__PURE__ */ import_react6.default.createElement("textarea", { className: "mw-field", value: paste, onChange: (e) => setPaste(e.target.value), placeholder: "\u7C98\u8D34\u4F60\u5199\u8FC7\u7684\u6587\u6848\u3001\u811A\u672C\u6216\u6587\u7AE0\u6BB5\u843D\uFF0C\u672C\u5730\u63D0\u70BC\uFF0C\u4E0D\u4E0A\u4F20\u5916\u90E8\u63A5\u53E3\u3002" })), /* @__PURE__ */ import_react6.default.createElement("label", { className: "mw-label" }, "\u98CE\u683C\u5361\u540D\u79F0", /* @__PURE__ */ import_react6.default.createElement("input", { className: "mw-field", value: name2, onChange: (e) => setName(e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u6211\u7684\u53E3\u64AD\u98CE\u683C" }))), /* @__PURE__ */ import_react6.default.createElement(Button, { disabled: busy || paste.trim().length < 40, onClick: () => perform("style-extract", async () => {
    const result = await client.call("styles.extract", { text: paste, name: name2 });
    setData(result);
    setPaste("");
    setName("");
  }) }, "\u63D0\u70BC\u5E76\u4FDD\u5B58\u98CE\u683C\u5361"), /* @__PURE__ */ import_react6.default.createElement("p", { className: "mw-muted" }, "\u63D0\u70BC\u53EA\u57FA\u4E8E\u4F60\u7C98\u8D34\u7684\u6587\u672C\uFF0C\u7528\u8BCD/\u53E5\u5F0F\u7ED3\u8BBA\u53EF\u5728\u4E0B\u9762\u7F16\u8F91\u6838\u5BF9\u3002")), custom.length > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react6.default.createElement("h3", null, "\u6211\u7684\u98CE\u683C\u5361"), /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-choice-grid" }, custom.map((row) => /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-choice", key: row.id }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react6.default.createElement("strong", null, row.icon, " ", row.name), /* @__PURE__ */ import_react6.default.createElement(Badge, null, row.category)), /* @__PURE__ */ import_react6.default.createElement("small", null, row.summary), /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-row", style: { marginTop: 8 } }, /* @__PURE__ */ import_react6.default.createElement(Button, { quiet: true, onClick: () => save([{ op: "setActive", id: row.id }], "style-set") }, "\u4F7F\u7528"), /* @__PURE__ */ import_react6.default.createElement(Button, { quiet: true, onClick: () => setEditing(row) }, "\u7F16\u8F91"), /* @__PURE__ */ import_react6.default.createElement(Button, { quiet: true, danger: true, onClick: () => save([{ op: "delete", id: row.id }], "style-delete") }, "\u5220\u9664")))))), grouped.map(([category, rows]) => /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-section", key: category }, /* @__PURE__ */ import_react6.default.createElement("h3", null, category), /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-choice-grid" }, rows.map((row) => /* @__PURE__ */ import_react6.default.createElement("div", { className: `mw-choice ${data.activeId === row.id ? "is-active" : ""}`, key: row.id }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react6.default.createElement("strong", null, row.icon, " ", row.name), row.preset ? /* @__PURE__ */ import_react6.default.createElement(Badge, null, "\u9884\u8BBE") : null), /* @__PURE__ */ import_react6.default.createElement("small", null, row.summary), /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-row", style: { marginTop: 8 } }, /* @__PURE__ */ import_react6.default.createElement(Button, { quiet: true, onClick: () => save([{ op: "setActive", id: row.id }], "style-set") }, "\u4F7F\u7528"))))))), editing && /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-idea-form", role: "dialog", "aria-label": "\u7F16\u8F91\u98CE\u683C\u5361" }, /* @__PURE__ */ import_react6.default.createElement("h3", null, "\u7F16\u8F91\u98CE\u683C\u5361"), /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-form-grid" }, /* @__PURE__ */ import_react6.default.createElement("label", { className: "mw-label" }, "\u540D\u79F0", /* @__PURE__ */ import_react6.default.createElement("input", { className: "mw-field", value: editing.name, onChange: (e) => setEditing({ ...editing, name: e.target.value }) })), /* @__PURE__ */ import_react6.default.createElement("label", { className: "mw-label" }, "\u6982\u8FF0", /* @__PURE__ */ import_react6.default.createElement("input", { className: "mw-field", value: editing.summary || "", onChange: (e) => setEditing({ ...editing, summary: e.target.value }) })), /* @__PURE__ */ import_react6.default.createElement("label", { className: "mw-label mw-full" }, "\u8BED\u6C14", /* @__PURE__ */ import_react6.default.createElement("input", { className: "mw-field", value: editing.tone || "", onChange: (e) => setEditing({ ...editing, tone: e.target.value }) })), /* @__PURE__ */ import_react6.default.createElement("label", { className: "mw-label mw-full" }, "\u53E5\u5F0F", /* @__PURE__ */ import_react6.default.createElement("input", { className: "mw-field", value: editing.sentences || "", onChange: (e) => setEditing({ ...editing, sentences: e.target.value }) })), /* @__PURE__ */ import_react6.default.createElement("label", { className: "mw-label mw-full" }, "\u5E38\u7528\u8868\u8FBE\uFF08\u987F\u53F7\u5206\u9694\uFF09", /* @__PURE__ */ import_react6.default.createElement("input", { className: "mw-field", value: (editing.words || []).join("\u3001"), onChange: (e) => setEditing({ ...editing, words: e.target.value.split(/[、,，\s]+/).filter(Boolean) }) }))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "mw-row", style: { marginTop: 14 } }, /* @__PURE__ */ import_react6.default.createElement(Button, { primary: true, disabled: busy || !editing.name?.trim(), onClick: () => save([{ op: "update", id: editing.id, name: editing.name, summary: editing.summary, tone: editing.tone, sentences: editing.sentences, words: editing.words }], "style-update") }, "\u4FDD\u5B58"), /* @__PURE__ */ import_react6.default.createElement(Button, { onClick: () => setEditing(null) }, "\u53D6\u6D88"))));
}

// src/insights.jsx
var import_react7 = __toESM(require("react"), 1);
function parseRows(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.rows)) return parsed.rows;
    if (Array.isArray(parsed.metrics)) return parsed.metrics;
  } catch {
  }
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV \u81F3\u5C11\u9700\u8981\u8868\u5934\u548C\u4E00\u884C\u6570\u636E");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    headers.forEach((h, i) => {
      row[h] = isNaN(Number(cells[i])) ? (cells[i] || "").trim() : Number(cells[i]);
    });
    return row;
  });
}
function InsightsPanel({ client, busy, perform }) {
  const [report, setReport] = (0, import_react7.useState)(null), [rules, setRules] = (0, import_react7.useState)([]), [error, setError] = (0, import_react7.useState)(null), [text, setText] = (0, import_react7.useState)(""), [exported, setExported] = (0, import_react7.useState)(null), [note, setNote] = (0, import_react7.useState)("");
  const load = (0, import_react7.useCallback)(() => {
    const c = new AbortController();
    Promise.all([client.call("insights.analyze", {}, c.signal), client.call("rules.list", {}, c.signal), client.call("styles.list", {}, c.signal)]).then(([analysis, ruleData, styleData]) => {
      if (c.signal.aborted) return;
      setReport(analysis);
      setRules(ruleData.rules || []);
      setNote(styleData.active && !styleData.active.preset ? `\u81EA\u5B9A\u4E49\u98CE\u683C\u300C${styleData.active.name}\u300D\u4E5F\u4F1A\u4E00\u5E76\u5BFC\u51FA\u3002` : "\u5185\u7F6E\u9884\u8BBE\u4E0D\u4F1A\u5199\u8FDB\u4F60\u7684 Skill\uFF0C\u53EA\u5BFC\u51FA\u4F60\u786E\u8BA4\u7684\u89C4\u5219\u548C\u81EA\u5B9A\u4E49\u98CE\u683C\u3002");
    }).catch((e) => {
      if (!c.signal.aborted) setError(e);
    });
    return () => c.abort();
  }, [client]);
  (0, import_react7.useEffect)(() => load(), [load]);
  const importRows = () => perform("insights-import", async () => {
    const rows = parseRows(text);
    if (!rows.length) throw new Error("\u6CA1\u6709\u53EF\u5BFC\u5165\u7684\u6570\u636E\u884C");
    const saved = await client.call("insights.import", { rows });
    const analysis = await client.call("insights.analyze", {});
    setReport(analysis);
    setText("");
    setExported(null);
  });
  const confirm = (proposal) => perform("rule-confirm", async () => {
    const result = await client.call("rules.save", { ops: [{ op: "add", name: proposal.name, rule: proposal.rule, evidence: proposal.evidence, source: proposal.source, confidence: proposal.confidence }] });
    setRules(result.rules || []);
  });
  const removeRule = (id) => perform("rule-delete", async () => {
    const result = await client.call("rules.save", { ops: [{ op: "delete", id }] });
    setRules(result.rules || []);
  });
  const exportSkill = () => perform("skill-export", async () => setExported(await client.call("skills.export", {})));
  const active = rules.filter((row) => row.status === "active" || row.status === "exported");
  return /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-insights" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-page-title" }, /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("span", { className: "mw-eyebrow" }, "\u590D\u76D8"), /* @__PURE__ */ import_react7.default.createElement("h2", null, "\u628A\u6570\u636E\u53D8\u6210\u4E0B\u4E00\u6B21\u7684\u89C4\u5219"), /* @__PURE__ */ import_react7.default.createElement("p", { className: "mw-muted" }, "\u5F55\u5165\u771F\u5B9E\u9605\u8BFB/\u4E92\u52A8\u6570\u636E\uFF0C\u5148\u770B\u5EFA\u8BAE\uFF0C\u786E\u8BA4\u540E\u624D\u6210\u4E3A\u89C4\u5219\uFF1B\u89C4\u5219\u53EF\u5BFC\u51FA\u6210 DSH Skill\u3002"))), error && /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-error", role: "alert" }, error.message || String(error)), /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react7.default.createElement("h3", null, "\u5F55\u5165\u6216\u5BFC\u5165\u6570\u636E"), /* @__PURE__ */ import_react7.default.createElement("p", { className: "mw-muted" }, "\u652F\u6301 JSON \u6570\u7EC4\uFF0C\u6216 CSV\uFF08\u8868\u5934 platform,date,views,likes,comments,shares,saves,title\uFF09\u3002"), /* @__PURE__ */ import_react7.default.createElement("textarea", { className: "mw-field", style: { minHeight: 120 }, value: text, onChange: (e) => setText(e.target.value), placeholder: "platform,date,views,likes,comments,shares,saves,title\nxiaohongshu,2026-11-01,1200,80,12,6,20,\u793A\u4F8B\u6807\u9898" }), /* @__PURE__ */ import_react7.default.createElement(Button, { primary: true, disabled: busy || !text.trim(), onClick: importRows }, "\u5BFC\u5165\u5E76\u5206\u6790")), report && /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-panel" }, /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react7.default.createElement("h3", null, "\u6570\u636E\u6982\u89C8"), /* @__PURE__ */ import_react7.default.createElement(Badge, null, report.total, " \u6761\u8BB0\u5F55")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-metric-grid" }, /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("strong", null, report.summary.views), /* @__PURE__ */ import_react7.default.createElement("small", null, "\u603B\u9605\u8BFB")), /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("strong", null, report.summary.engaged), /* @__PURE__ */ import_react7.default.createElement("small", null, "\u603B\u4E92\u52A8")), /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("strong", null, (report.summary.engagementRate * 100).toFixed(1), "%"), /* @__PURE__ */ import_react7.default.createElement("small", null, "\u4E92\u52A8\u7387")), /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("strong", null, report.summary.platforms), /* @__PURE__ */ import_react7.default.createElement("small", null, "\u5E73\u53F0\u6570"))), report.note && /* @__PURE__ */ import_react7.default.createElement("p", { className: "mw-muted" }, report.note)), /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react7.default.createElement("h3", null, "\u5EFA\u8BAE\u89C4\u5219"), report?.proposals?.length ? report.proposals.map((p, i) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-rule-row", key: i }, /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("strong", null, p.name), /* @__PURE__ */ import_react7.default.createElement("p", { className: "mw-muted" }, p.rule), /* @__PURE__ */ import_react7.default.createElement("small", { className: "mw-muted" }, "\u4F9D\u636E\uFF1A", p.evidence, " \xB7 \u7F6E\u4FE1\u5EA6 ", Math.round((p.confidence || 0) * 100), "%")), /* @__PURE__ */ import_react7.default.createElement(Button, { primary: true, disabled: busy, onClick: () => confirm(p) }, "\u786E\u8BA4\u4E3A\u89C4\u5219"))) : /* @__PURE__ */ import_react7.default.createElement("p", { className: "mw-muted" }, "\u8FD8\u6CA1\u6709\u8DB3\u591F\u6570\u636E\u63D0\u51FA\u65B0\u5EFA\u8BAE\u3002\u6837\u672C\u4E0D\u8DB3\u65F6\u4E0D\u4F1A\u51D1\u6570\u3002")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react7.default.createElement("h3", null, "\u5F53\u524D\u751F\u6548\u89C4\u5219\uFF08", active.length, "\uFF09"), active.length ? active.map((row) => /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-rule-row", key: row.id }, /* @__PURE__ */ import_react7.default.createElement("div", null, /* @__PURE__ */ import_react7.default.createElement("strong", null, row.name), /* @__PURE__ */ import_react7.default.createElement("p", { className: "mw-muted" }, row.rule), row.evidence && /* @__PURE__ */ import_react7.default.createElement("small", { className: "mw-muted" }, "\u4F9D\u636E\uFF1A", row.evidence)), /* @__PURE__ */ import_react7.default.createElement(Button, { quiet: true, danger: true, disabled: busy, onClick: () => removeRule(row.id) }, "\u5220\u9664"))) : /* @__PURE__ */ import_react7.default.createElement("p", { className: "mw-muted" }, "\u8FD8\u6CA1\u6709\u786E\u8BA4\u7684\u89C4\u5219\u3002")), /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react7.default.createElement("h3", null, "\u5BFC\u51FA\u4E3A DSH Skill"), /* @__PURE__ */ import_react7.default.createElement("p", { className: "mw-muted" }, note, " \u5199\u5165\u672C\u63D2\u4EF6\u6570\u636E\u6839\u7684 skills/ \u76EE\u5F55\uFF0C\u4E0D\u8986\u76D6\u522B\u4EBA\u7684 Skill\u3002"), /* @__PURE__ */ import_react7.default.createElement(Button, { primary: true, disabled: busy || !active.length, onClick: exportSkill }, "\u5BFC\u51FA\u5199\u4F5C\u89C4\u5219 Skill"), exported && /* @__PURE__ */ import_react7.default.createElement("div", { className: "mw-notice", role: "status" }, "\u5DF2\u5199\u5165 ", exported.path, "\uFF08", exported.rules, " \u6761\u89C4\u5219", exported.style ? ` \xB7 \u98CE\u683C\uFF1A${exported.style}` : "", "\uFF09\u3002")));
}

// src/overview.jsx
var import_react8 = __toESM(require("react"), 1);
var shortTime = (value) => formatShortTime(value);
function Overview({ listing, client, storage, query, setQuery, group, setGroup, status, setStatus, offset, setOffset, onOpen, onCreate, onSettings, onArchive, busy, companion }) {
  const summary = listing.summary || {}, groups = [["", "\u5168\u90E8\u4EFB\u52A1", summary.all], ["attention", "\u5F85\u6211\u5904\u7406", summary.attention], ["active", "\u5236\u4F5C\u4E2D", summary.active], ["done", "\u5DF2\u5B8C\u6210", summary.done], ["draft", "\u8349\u7A3F", summary.draft], ["archived", "\u5DF2\u5F52\u6863", summary.archived]];
  const empty = query || status || group;
  return /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-overview" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-page-title" }, /* @__PURE__ */ import_react8.default.createElement("div", null, /* @__PURE__ */ import_react8.default.createElement("span", { className: "mw-eyebrow" }, companion ? "\u5F53\u524D\u4F1A\u8BDD" : "\u5236\u4F5C\u7A7A\u95F4"), /* @__PURE__ */ import_react8.default.createElement("h2", null, "\u5236\u4F5C\u4EFB\u52A1"), /* @__PURE__ */ import_react8.default.createElement("p", { className: "mw-muted" }, companion ? "\u804A\u5929\u548C\u5DE5\u4F5C\u53F0\u5171\u7528\u540C\u4E00\u4EFD\u8FDB\u5EA6\u4E0E\u4EA7\u7269\u3002" : "\u4ECE\u771F\u5B9E\u8D44\u6599\u5F00\u59CB\uFF0C\u5728\u9700\u8981\u4F60\u51B3\u5B9A\u65F6\u56DE\u6765\u3002")), /* @__PURE__ */ import_react8.default.createElement(Button, { primary: true, onClick: onCreate }, "\uFF0B \u65B0\u5EFA\u4EFB\u52A1")), /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-filter-tabs", role: "tablist", "aria-label": "\u4EFB\u52A1\u5206\u7EC4" }, groups.map(([key, label, count]) => /* @__PURE__ */ import_react8.default.createElement("button", { role: "tab", "aria-selected": group === key, key, onClick: () => {
    setGroup(key);
    setOffset(0);
  } }, label, count !== void 0 && /* @__PURE__ */ import_react8.default.createElement("span", null, count)))), /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-list-tools" }, /* @__PURE__ */ import_react8.default.createElement("input", { className: "mw-field", "aria-label": "\u641C\u7D22\u4EFB\u52A1", placeholder: "\u641C\u7D22\u4EFB\u52A1\u540D\u79F0\u2026", value: query, onChange: (e) => {
    setQuery(e.target.value);
    setOffset(0);
  } }), /* @__PURE__ */ import_react8.default.createElement("select", { className: "mw-field", "aria-label": "\u4EFB\u52A1\u72B6\u6001", value: status, onChange: (e) => {
    setStatus(e.target.value);
    setOffset(0);
  } }, /* @__PURE__ */ import_react8.default.createElement("option", { value: "" }, "\u6240\u6709\u72B6\u6001"), Object.entries(STATUS).map(([key, label]) => /* @__PURE__ */ import_react8.default.createElement("option", { key, value: key }, label)))), listing.tasks.length ? /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-task-list" }, listing.tasks.map((t2) => {
    const definitions = stepsFor(t2);
    const done = t2.steps?.filter((s) => ["complete", "skipped"].includes(s.status)).length || 0, next = nextAction(t2), archived = !!t2.archivedAt;
    const cover = t2.steps?.find((s) => s.key === "render")?.artifacts?.find((a) => a.mime?.startsWith("image/"));
    return /* @__PURE__ */ import_react8.default.createElement("article", { className: `mw-task${archived ? " mw-archived" : ""}`, key: t2.id }, /* @__PURE__ */ import_react8.default.createElement("div", { className: `mw-task-cover ${t2.style || ""}` }, cover ? /* @__PURE__ */ import_react8.default.createElement("img", { alt: "\u6210\u7247\u5C01\u9762", src: client.artifactUrl(t2.id, cover.path) }) : /* @__PURE__ */ import_react8.default.createElement(import_react8.default.Fragment, null, /* @__PURE__ */ import_react8.default.createElement("span", null, { video: "\u89C6\u9891", article: "\u6587\u7AE0", "image-post": "\u56FE\u6587" }[workType(t2)]), /* @__PURE__ */ import_react8.default.createElement("b", null, String(done).padStart(2, "0"), /* @__PURE__ */ import_react8.default.createElement("small", null, "/ ", definitions.length)))), /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-task-main" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react8.default.createElement("h3", null, t2.title), /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-row" }, archived && /* @__PURE__ */ import_react8.default.createElement(Badge, { status: "archived" }, "\u5DF2\u5F52\u6863"), /* @__PURE__ */ import_react8.default.createElement(Badge, { status: t2.status }, STATUS[t2.status]))), /* @__PURE__ */ import_react8.default.createElement("p", { className: "mw-task-meta" }, MODES[t2.review?.mode] || "\u5F85\u786E\u5B9A\u8BC4\u5BA1", " \xB7 ", definitions.find((s) => s.key === t2.activeStep)?.label || "\u5F85\u68C0\u67E5", archived ? ` \xB7 \u5F52\u6863\u4E8E ${shortTime(t2.archivedAt)}` : t2.updatedAt && ` \xB7 ${shortTime(t2.updatedAt)}`), /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-progress", "aria-label": `\u5B8C\u6210 ${done} / ${definitions.length} \u6B65` }, definitions.map((s, i) => /* @__PURE__ */ import_react8.default.createElement("span", { key: s.key, className: i < done ? "done" : "" }))), /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-row mw-between mw-task-next" }, /* @__PURE__ */ import_react8.default.createElement("span", null, next.title), /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-row" }, /* @__PURE__ */ import_react8.default.createElement(Button, { primary: !!t2.pendingReview, onClick: () => onOpen(t2.id) }, archived ? "\u67E5\u770B" : next.action, " \u2192"), /* @__PURE__ */ import_react8.default.createElement(Button, { quiet: true, disabled: !!busy || t2.status === "running" || t2.status === "publishing" || t2.status === "pausing", onClick: () => onArchive(t2, !archived) }, archived ? "\u6062\u590D" : "\u5F52\u6863")))));
  })) : /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-welcome" }, /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-welcome-symbol" }, "\u25B6"), /* @__PURE__ */ import_react8.default.createElement("h3", null, group === "archived" ? "\u8FD8\u6CA1\u6709\u5F52\u6863\u7684\u4EFB\u52A1" : empty ? "\u8FD9\u91CC\u6682\u65F6\u6CA1\u6709\u4EFB\u52A1" : companion ? "\u8FD9\u4E2A\u4F1A\u8BDD\u8FD8\u6CA1\u6709\u5A92\u4F53\u4EFB\u52A1" : "\u628A\u4E0B\u4E00\u6761\u5185\u5BB9\uFF0C\u505A\u6210\u4E00\u6761\u4F5C\u54C1"), /* @__PURE__ */ import_react8.default.createElement("p", null, group === "archived" ? "\u5F52\u6863\u7684\u4EFB\u52A1\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\uFF0C\u53EF\u4EE5\u968F\u65F6\u6062\u590D\uFF1B\u5F52\u6863\u4E0D\u5220\u9664\u4EA7\u7269\u548C\u8BC4\u5BA1\u8BB0\u5F55\u3002" : empty ? "\u6362\u4E00\u4E2A\u5206\u7EC4\u6216\u641C\u7D22\u8BCD\uFF0C\u770B\u770B\u5176\u4ED6\u4EFB\u52A1\u3002" : "\u5728\u804A\u5929\u91CC\u63D0\u51FA\u9700\u6C42\uFF0C\u6216\u4ECE\u8FD9\u91CC\u65B0\u5EFA\u3002\u4EFB\u52A1\u8FDB\u5EA6\u3001\u8BC4\u5BA1\u548C\u6210\u7247\u4F1A\u51FA\u73B0\u5728\u540C\u4E00\u4E2A\u5730\u65B9\u3002"), !empty && /* @__PURE__ */ import_react8.default.createElement(import_react8.default.Fragment, null, /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-onboarding" }, /* @__PURE__ */ import_react8.default.createElement("span", null, "01 \u63D0\u4F9B\u8D44\u6599"), /* @__PURE__ */ import_react8.default.createElement("i", null, "\u2192"), /* @__PURE__ */ import_react8.default.createElement("span", null, "02 \u786E\u8BA4\u9700\u6C42"), /* @__PURE__ */ import_react8.default.createElement("i", null, "\u2192"), /* @__PURE__ */ import_react8.default.createElement("span", null, "03 \u5236\u4F5C\u4E0E\u8BC4\u5BA1")), /* @__PURE__ */ import_react8.default.createElement(Button, { primary: true, onClick: onCreate }, "\u521B\u5EFA\u4EFB\u52A1"), /* @__PURE__ */ import_react8.default.createElement(Button, { quiet: true, onClick: onSettings }, "\u68C0\u67E5\u5DE5\u4F5C\u76EE\u5F55\u4E0E\u8BBE\u7F6E"))), listing.total > 30 && /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-row mw-between mw-pagination" }, /* @__PURE__ */ import_react8.default.createElement(Button, { disabled: !offset, onClick: () => setOffset((x) => Math.max(0, x - 30)) }, "\u4E0A\u4E00\u9875"), /* @__PURE__ */ import_react8.default.createElement("small", null, "\u5171 ", listing.total, " \u4E2A\u4EFB\u52A1"), /* @__PURE__ */ import_react8.default.createElement(Button, { disabled: offset + 30 >= listing.total, onClick: () => setOffset((x) => x + 30) }, "\u4E0B\u4E00\u9875")), storage?.root && !companion && /* @__PURE__ */ import_react8.default.createElement("div", { className: "mw-location-line" }, /* @__PURE__ */ import_react8.default.createElement("span", null, "\u5DE5\u4F5C\u76EE\u5F55 \xB7 ", storage.root), /* @__PURE__ */ import_react8.default.createElement(Button, { quiet: true, onClick: onSettings }, "\u66F4\u6539"), /* @__PURE__ */ import_react8.default.createElement("span", { className: "mw-sync-dot" }, "\u81EA\u52A8\u540C\u6B65")));
}

// src/workspace-home.jsx
var import_react9 = __toESM(require("react"), 1);
function RssIcon() {
  return /* @__PURE__ */ import_react9.default.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", "aria-hidden": "true" }, /* @__PURE__ */ import_react9.default.createElement("circle", { cx: "5.5", cy: "18.5", r: "1", fill: "currentColor", stroke: "none" }), /* @__PURE__ */ import_react9.default.createElement("path", { d: "M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" }));
}
function SourceFeed({ items }) {
  const connected = Array.isArray(items);
  const entries = (connected ? items : []).map((item) => ({ ...item, url: safeLink(item?.url) })).filter((item) => item.url && item.title);
  return /* @__PURE__ */ import_react9.default.createElement("section", { className: "mw-home-feed", "aria-label": "\u70ED\u95E8\u7D20\u6750" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "mw-home-section-head" }, /* @__PURE__ */ import_react9.default.createElement("div", null, /* @__PURE__ */ import_react9.default.createElement("h3", null, "\u70ED\u95E8\u7D20\u6750"), /* @__PURE__ */ import_react9.default.createElement("p", null, "\u770B\u770B\u5404\u4E2A\u6765\u6E90\u6700\u8FD1\u5728\u804A\u4EC0\u4E48\u3002")), /* @__PURE__ */ import_react9.default.createElement("span", { className: "mw-home-tag" }, connected ? "RSS" : "RSS \xB7 \u5F85\u63A5\u5165")), entries.length ? /* @__PURE__ */ import_react9.default.createElement("ul", { className: "mw-source-list" }, entries.map((item) => {
    const date = Number.isFinite(Date.parse(item.publishedAt)) ? formatShortTime(item.publishedAt) : "";
    return /* @__PURE__ */ import_react9.default.createElement("li", { key: item.url }, /* @__PURE__ */ import_react9.default.createElement("a", { className: "mw-source-item", href: item.url, target: "_blank", rel: "noopener noreferrer" }, /* @__PURE__ */ import_react9.default.createElement("div", null, /* @__PURE__ */ import_react9.default.createElement("small", null, item.source, date && /* @__PURE__ */ import_react9.default.createElement(import_react9.default.Fragment, null, " \xB7 ", /* @__PURE__ */ import_react9.default.createElement("time", { dateTime: item.publishedAt }, date))), /* @__PURE__ */ import_react9.default.createElement("strong", null, item.title), item.summary && /* @__PURE__ */ import_react9.default.createElement("p", null, item.summary)), /* @__PURE__ */ import_react9.default.createElement("span", { "aria-hidden": "true" }, "\u2197")));
  })) : /* @__PURE__ */ import_react9.default.createElement("div", { className: "mw-source-empty" }, /* @__PURE__ */ import_react9.default.createElement("span", { className: "mw-source-icon" }, /* @__PURE__ */ import_react9.default.createElement(RssIcon, null)), /* @__PURE__ */ import_react9.default.createElement("div", null, /* @__PURE__ */ import_react9.default.createElement("strong", null, "\u6682\u65E0\u70ED\u95E8\u7D20\u6750"), /* @__PURE__ */ import_react9.default.createElement("p", null, connected ? "\u8BA2\u9605\u6E90\u6709\u65B0\u6761\u76EE\u65F6\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002" : "\u63A5\u5165 RSS \u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u6765\u6E90\u3001\u6807\u9898\u548C\u53D1\u5E03\u65F6\u95F4\u3002"))));
}
function WorkspaceHome({ client, root, visible, generation, summary, busy, perform, onIdeas, onTasks, sourceItems }) {
  const [ideaCount, setIdeaCount] = (0, import_react9.useState)(null);
  const latestSave = (0, import_react9.useRef)(0);
  (0, import_react9.useEffect)(() => {
    if (!visible || !root) return;
    const controller = new AbortController();
    const beforeSave = latestSave.current;
    const current = () => !controller.signal.aborted && latestSave.current === beforeSave;
    client.call("ideas.list", {}, controller.signal).then((data) => {
      if (current()) setIdeaCount(data.items.length);
    }).catch(() => {
      if (current()) setIdeaCount(null);
    });
    return () => controller.abort();
  }, [client, root, visible, generation]);
  const name2 = root?.split(/[\\/]/).filter(Boolean).at(-1) || root;
  const metrics = [
    { label: "\u7075\u611F", value: ideaCount, detail: "\u67E5\u770B\u7075\u611F\u5899", onClick: onIdeas },
    { label: "\u4EFB\u52A1", value: summary?.all, detail: "\u67E5\u770B\u672A\u5F52\u6863\u4EFB\u52A1", onClick: () => onTasks("") },
    { label: "\u5F85\u5904\u7406", value: summary?.attention, detail: "\u67E5\u770B\u5F85\u5904\u7406\u4EFB\u52A1", onClick: () => onTasks("attention") }
  ];
  return /* @__PURE__ */ import_react9.default.createElement("div", { className: "mw-home" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "mw-home-heading" }, /* @__PURE__ */ import_react9.default.createElement("h2", null, "\u5DE5\u4F5C\u533A\u6982\u89C8"), name2 && /* @__PURE__ */ import_react9.default.createElement("span", { className: "mw-home-tag", title: root }, name2)), /* @__PURE__ */ import_react9.default.createElement("nav", { className: "mw-home-metrics", "aria-label": "\u5DE5\u4F5C\u533A\u5FEB\u6377\u5165\u53E3" }, metrics.map(({ label, value, detail, onClick }) => /* @__PURE__ */ import_react9.default.createElement("button", { key: label, type: "button", onClick, className: "mw-home-metric" }, /* @__PURE__ */ import_react9.default.createElement("span", null, label), /* @__PURE__ */ import_react9.default.createElement("strong", null, value ?? "\u2014"), /* @__PURE__ */ import_react9.default.createElement("small", null, detail, " ", /* @__PURE__ */ import_react9.default.createElement("span", { "aria-hidden": "true" }, "\u2192"))))), /* @__PURE__ */ import_react9.default.createElement("section", { className: "mw-home-capture", "aria-label": "\u968F\u624B\u8BB0\u7075\u611F" }, /* @__PURE__ */ import_react9.default.createElement("div", { className: "mw-home-section-head" }, /* @__PURE__ */ import_react9.default.createElement("h3", null, "\u968F\u624B\u8BB0\u7075\u611F")), /* @__PURE__ */ import_react9.default.createElement(IdeaCapture, { client, busy: busy || !root, perform, onSaved: (items) => {
    latestSave.current++;
    setIdeaCount(items.length);
  } })), /* @__PURE__ */ import_react9.default.createElement(SourceFeed, { items: sourceItems }));
}

// embedded-skill/lib/templates.mjs
var TEMPLATE_SHAPES = {
  segments: "segments",
  // 一拍一页 / 逐条要点：直接沿用 script 的 sections
  dataset: "dataset",
  // 单一图表或数据序列：需要一份数据系列
  hero: "hero",
  // 单一连续镜头：整体一支，不分镜
  talking: "talking"
  // 口播包装：需要人像素材
};
var HUASHU_TEMPLATES = [
  {
    id: "blank",
    name: "\u7A7A\u767D\u8D77\u70B9",
    shape: TEMPLATE_SHAPES.segments,
    summary: "\u6807\u9898\u3001\u4E00\u4E2A\u5927\u6570\u5B57\u3001\u5C3E\u677F\u3002\u6700\u5C0F\u53EF\u7528\u5DE5\u7A0B\u3002",
    bestFor: "\u81EA\u5B9A\u4E49\u3001\u52A8\u6001\u6807\u9898\u3001\u4F5C\u4E3A\u8D77\u70B9",
    requires: [],
    variables: ["kicker", "title", "subtitle", "stat", "statLabel", "accent", "paper", "ink", "endHold"],
    note: "\u7ED3\u6784\u6700\u7B80\u5355\uFF0C\u4EFB\u4F55\u5185\u5BB9\u90FD\u80FD\u88C5\uFF1B\u590D\u6742\u6548\u679C\u4ECE\u8FD9\u91CC\u624B\u5199\u6269\u5C55\u3002"
  },
  {
    id: "kinetic-type",
    name: "\u52A8\u6001\u6587\u5B57",
    shape: TEMPLATE_SHAPES.segments,
    summary: "\u6587\u5B57\u662F\u4E3B\u89D2\uFF1A\u4E00\u62CD\u4E00\u9875\uFF0C\u5173\u952E\u8BCD\u7838\u5165\uFF0C\u8272\u5E26\u8F6C\u573A\uFF0C\u8367\u5149\u7B14\u5237\u91CD\u70B9\u8BCD\u3002",
    bestFor: "\u5217\u8868\u4E0E\u9636\u6BB5\uFF08\u4E09\u4E2A\u7406\u7531\u3001\u4E09\u4E2A\u6B65\u9AA4\uFF09\u3001\u7AE0\u8282\u5361\u3001\u4E00\u53E5\u8BDD\u7ED3\u8BBA",
    requires: [],
    variables: ["titleWord", "titleSub", "item1", "item1Sub", "item1Key", "item1Label", "item2", "item2Sub", "item2Key", "item2Label", "item3", "item3Sub", "item3Key", "item3Label", "highlightWord", "palette", "duration", "pace"],
    note: "\u6BCF\u9879 = \u4E00\u9875\uFF0C\u6700\u591A\u4E09\u9879\uFF1Bitem \u6E05\u7A7A\u5373\u5C11\u4E00\u9875\u3002\u9002\u5408\u628A script \u5206\u6BB5\u76F4\u63A5\u5BF9\u4E0A\u9875\u9762\u3002"
  },
  {
    id: "whiteboard",
    name: "\u767D\u677F\u63A8\u5BFC",
    shape: TEMPLATE_SHAPES.segments,
    summary: "\u9A6C\u514B\u7B14\u8FB9\u8BF4\u8FB9\u5199\uFF0C\u753B\u56FE\u6807\u3001\u8FDE\u7EBF\uFF0C\u6700\u540E\u5708\u4F4F\u91CD\u70B9\u5E76\u62C9\u8FDC\u770B\u5168\u677F\u3002",
    bestFor: "\u9010\u6B65\u63A8\u7406\u3001\u4E3A\u4EC0\u4E48\u4F1A\u53D1\u751F X\u3001\u56E0\u679C\u94FE\u3001\u8BB2\u6388\u5F0F\u65C1\u767D",
    requires: [],
    variables: ["title", "point1", "draw1Text", "draw1Icon", "point2", "draw2Text", "draw2Icon", "point3", "draw3Text", "draw3Icon", "highlightIndex", "highlightStyle", "accent", "duration", "pace"],
    note: "\u8981\u70B9\u6700\u591A\u4E09\u6761\uFF0C\u6BCF\u6761\u53EF\u914D\u4E00\u4E2A\u56FE\u6807\uFF1BhighlightIndex \u51B3\u5B9A\u6700\u540E\u5708\u4F4F\u54EA\u6761\u3002"
  },
  {
    id: "kurzgesagt",
    name: "\u79D1\u666E\u661F\u7403",
    shape: TEMPLATE_SHAPES.segments,
    summary: "\u53D1\u5149\u661F\u7403\u5F53\u6982\u5FF5\uFF0C\u6BCF\u8981\u70B9\u4E00\u9897\u536B\u661F\uFF0C\u955C\u5934\u94BB\u8FDB\u5176\u4E2D\u4E00\u9897\u5C55\u5F00\u91CC\u5C42\u3002",
    bestFor: "X \u91CC\u9762\u6709\u4EC0\u4E48\u3001\u7CFB\u7EDF\u4E0E\u7EC4\u6210\u3001\u5C3A\u5EA6\u4E0E\u5C42\u7EA7\u3001\u51B7\u9759\u7684\u79D1\u666E\u65C1\u767D",
    requires: [],
    variables: ["title", "center", "point1", "point2", "point3", "diveIndex", "dive", "point4", "point5", "highlightIndex", "flow", "planetColor", "duration", "pace"],
    note: "\u5916\u5C42\u4E09\u9897\u536B\u661F + \u91CC\u5C42\u4E24\u9897\uFF1BdiveIndex \u6307\u5B9A\u94BB\u8FDB\u7B2C\u51E0\u9897\uFF0C\u8BB2\u5148\u540E\u5173\u7CFB\u65F6\u5F00 flow\u3002"
  },
  {
    id: "math-3b1b",
    name: "\u9ED1\u677F\u516C\u5F0F",
    shape: TEMPLATE_SHAPES.segments,
    summary: "\u9ED1\u677F\u4E00\u5C4F\u4E00\u4E2A\u6982\u5FF5\uFF1A\u6807\u9898\u5199\u51FA\u3001\u516C\u5F0F\u53D8\u5F62\u3001\u66F2\u7EBF\u6F14\u5316\u3001\u8981\u70B9\u6846\u4F4F\u3002",
    bestFor: "\u673A\u5236\u5982\u4F55\u63A8\u5230\u4E0B\u4E00\u6B65\u3001\u6570\u5B66\u4E0E\u7B97\u6CD5\u8BB2\u89E3\u3001\u7B26\u53F7\u4E0E\u5C4F\u5E55\u914D\u8272\u5BF9\u5E94",
    requires: [],
    variables: ["title", "eq1", "eq2", "mathColors", "point1", "point2", "highlightIndex", "curve1Label", "curve1", "curve1Color", "curve2Label", "curve2", "curve2Color", "duration", "pace"],
    note: "\u9700\u8981\u771F\u5B9E\u516C\u5F0F\u4E0E\u66F2\u7EBF\u6570\u636E\uFF1BmathColors \u8BA9\u540C\u4E00\u7B26\u53F7\u5728\u516C\u5F0F\u95F4\u4FDD\u6301\u540C\u8272\u3002"
  },
  {
    id: "finance-chart",
    name: "\u8D22\u7ECF\u56FE\u8868",
    shape: TEMPLATE_SHAPES.dataset,
    summary: "\u7ECF\u6D4E\u5B66\u4EBA\u5F0F\uFF1A\u5148\u51FA\u5750\u6807\uFF0C\u518D\u957F\u6570\u636E\uFF0C\u6700\u540E\u53EA\u6807\u4E00\u4EF6\u4E8B\u3002\u67F1\u72B6 / \u6298\u7EBF / K \u7EBF\u3002",
    bestFor: "\u8425\u6536\u3001\u589E\u957F\u3001\u5360\u6BD4\uFF0C\u4E00\u4E2A\u8F6C\u6298\u70B9\uFF0C\u89C2\u4F17\u4F1A\u622A\u56FE\u6838\u5BF9\u7684\u6570\u5B57",
    requires: ["\u9700\u8981\u4E00\u4EFD\u771F\u5B9E\u6570\u636E\u5E8F\u5217\uFF08label + value\uFF09"],
    variables: ["title", "unit", "source", "badge", "series", "chart", "decimals", "prefix", "suffix", "highlightIndex", "highlightText", "highlightSub", "mainColor", "dimColor", "duration", "pace"],
    note: "series \u662F JSON \u6570\u7EC4\uFF1BK \u7EBF\u6BCF\u9879\u5199 o/h/l/c\u3002\u6574\u7247\u4E00\u652F\u56FE\u8868\uFF0C\u4E0D\u6309\u65C1\u767D\u5206\u6BB5\u3002"
  },
  {
    id: "keynote-ui",
    name: "\u53D1\u5E03\u5361\u7247",
    shape: TEMPLATE_SHAPES.hero,
    summary: "\u6DF1\u8272\u53D1\u5149\u80CC\u666F\uFF0C\u73BB\u7483\u5361\u7247\u5F39\u51FA\u3001\u622A\u56FE\u9AD8\u4EAE\u6846\u3001\u5927\u6570\u5B57\u6EDA\u52A8\u3002",
    bestFor: "\u4EA7\u54C1\u4E0E\u529F\u80FD\u53D1\u5E03\u3001\u66F4\u65B0\u8BF4\u660E\u3001\u5E26\u622A\u56FE\u7684\u4E00\u6B65\u6559\u7A0B\u3001\u4E00\u4E2A\u5934\u6761\u6570\u5B57",
    requires: ["\u9700\u8981\u771F\u5B9E\u4EA7\u54C1\u622A\u56FE\uFF08\u653E\u5728 assets/\uFF09"],
    variables: ["eyebrow", "title", "subtitle", "card1Title", "card1Sub", "card1Icon", "card2Title", "card2Sub", "card2Icon", "card2Value", "card2Suffix", "card2Label", "card3Title", "card3Sub", "card3Icon", "numberValue", "numberDecimals", "numberPrefix", "numberSuffix", "numberCaption", "shotTitle", "shotSub", "shotImage", "highlightRect", "accent", "duration", "pace"],
    note: "\u4E00\u5C4F\u4E00\u7269\uFF0C\u6700\u591A\u4E09\u5F20\u5361\u7247 + \u4E00\u4E2A\u5927\u6570\u5B57 + \u4E00\u5F20\u622A\u56FE\u5361\u3002"
  },
  {
    id: "vox-collage",
    name: "\u526A\u62A5\u62FC\u8D34",
    shape: TEMPLATE_SHAPES.hero,
    summary: "\u622A\u56FE\u4E0E\u7D22\u5F15\u5361\u8D34\u5728\u7EB8\u9762\u684C\u4E0A\uFF0C\u7EA2\u7EBF\u4E32\u8054\uFF0C\u7EA2\u5708\u4E0E\u8367\u5149\u7B14\u6807\u51FA\u90A3\u4E00\u884C\u3002",
    bestFor: "\u7528\u771F\u5B9E\u622A\u56FE\u8BBA\u8BC1\u3001\u6587\u6863\u4E0E\u526A\u62A5\u3001\u65B0\u95FB\u4E0E\u5386\u53F2\u89E3\u8BF4\u3001\u8BF7\u770B\u8FD9\u4E00\u884C",
    requires: ["\u9700\u8981\u81F3\u5C11\u4E00\u5F20\u771F\u5B9E\u622A\u56FE\u6216\u526A\u62A5"],
    variables: ["title", "image1", "image1Label", "highlightRect", "note", "image2", "image2Label", "halftone", "accent", "duration", "pace"],
    note: "\u56FE\u7247\u8DEF\u5F84\u76F8\u5BF9 index.html\uFF0C\u653E\u8FDB assets/\uFF1BhighlightRect \u7528 0\u20131 \u76F8\u5BF9\u5750\u6807\u3002"
  },
  {
    id: "ui-space",
    name: "\u754C\u9762\u7A7A\u95F4",
    shape: TEMPLATE_SHAPES.hero,
    summary: "\u771F\u5B9E\u622A\u56FE\u5206\u5C42\u98DE\u6563\uFF0C3D \u955C\u5934\u5DE1\u6E38\u3001\u63A8\u8FDB\u5230\u4E00\u5904\u7559\u8A00\u518D\u62C9\u56DE\u6807\u9898\u3002",
    bestFor: "\u8F6F\u4EF6\u4E0E App \u53D1\u5E03\u3001\u5C55\u793A\u754C\u9762\u5982\u4F55\u6784\u6210\u3001\u5F00\u573A\u7B2C\u4E00\u79D2\u5C31\u5728\u52A8",
    requires: ["\u9700\u8981\u771F\u5B9E\u754C\u9762\u622A\u56FE\uFF081600\xD71000 \u7684 2 \u500D\u56FE\uFF09"],
    variables: ["screen", "comment", "reply", "title", "subtitle", "paper", "ink", "accent", "green", "endHold"],
    note: "\u4E00\u652F\u8FDE\u7EED\u955C\u5934\uFF0C\u4E0D\u5206\u955C\uFF1B\u6587\u5B57\u4FDD\u6301\u6E05\u6670\u53EF\u70B9\u9009\u3002"
  },
  {
    id: "object-3d",
    name: "\u5B9E\u7269\u5F71\u68DA",
    shape: TEMPLATE_SHAPES.hero,
    summary: "\u4EA7\u54C1\u5B9E\u7269\u6253\u5149\uFF0C\u622A\u56FE\u60AC\u5728\u8BBE\u5907\u4E0A\uFF0C\u4E00\u6761\u8FDE\u7EED\u955C\u5934\u505A\u63ED\u793A\u4E0E\u63A8\u8FDB\u3002",
    bestFor: "\u9AD8\u7AEF\u53D1\u5E03\u4E0E\u4E3B\u89C6\u89C9\u3001Logo \u6216\u56FE\u6807\u505A\u6210\u5B9E\u4F53\u3001\u5F3A\u955C\u5934\u8FD0\u52A8",
    requires: ["\u9700\u8981\u4EA7\u54C1\u622A\u56FE\u4E0E\u53EF\u6324\u51FA\u7684 Logo / \u56FE\u6807 SVG"],
    variables: ["screen", "cursorSvg", "bubbleSvg", "comment", "title", "subtitle", "paper", "ink", "accent", "body", "endHold"],
    note: "\u4F9D\u8D56 Three.js\uFF1B\u7D20\u6750\u7F3A\u5931\u4F1A\u9000\u5316\u6210\u5360\u4F4D\uFF0C\u5148\u5907\u597D\u622A\u56FE\u4E0E SVG\u3002"
  },
  {
    id: "storytime",
    name: "\u5C0F\u4EBA\u6545\u4E8B",
    shape: TEMPLATE_SHAPES.segments,
    summary: "\u5C0F\u4EBA\u89D2\u8272\u5728\u623F\u95F4\u91CC\u8BF4\u8BDD\uFF0C\u5207\u5230\u7535\u8111\u5C4F\u5E55\u7ED9\u51FA\u6570\u5B57\u5305\u88B1\uFF0C\u6700\u540E\u53CD\u5E94\u7279\u5199\u3002",
    bestFor: "\u7B2C\u4E00\u4EBA\u79F0\u7ECF\u5386\u4E0E\u7FFB\u8F66\u3001\u9700\u8981\u505C\u987F\u7684\u7B11\u70B9\u3001\u6211\u95EE\u4E86 AI \u7136\u540E\u2026\u2026",
    requires: [],
    variables: ["line1", "bubble1", "line1Pose", "typed", "bigText", "count", "unit", "app", "hit", "line2", "line2Pose", "mark", "duration", "pace"],
    note: "\u4E24\u53E5\u53E3\u64AD\u5B9A\u5F20\u5634\u65F6\u957F\uFF08\u7EA6 6.5 \u5B57/\u79D2\uFF09\uFF0C\u5305\u88B1\u540E\u81F3\u5C11\u7559 0.9 \u79D2\u3002"
  },
  {
    id: "talking-head",
    name: "\u53E3\u64AD\u5305\u88C5",
    shape: TEMPLATE_SHAPES.talking,
    summary: "\u4EBA\u50CF\u89C6\u9891\u914D\u540D\u724C\u3001\u6570\u5B57\u5361\u3001\u5173\u952E\u8BCD\u82B1\u5B57\u3001\u7AE0\u8282\u5361\u4E0E\u89D2\u6807\uFF0C\u6309\u8BF4\u8BDD\u7684\u8BCD\u843D\u5B9A\u3002",
    bestFor: "\u53E3\u64AD\u4E0E\u8BBF\u8C08\u5305\u88C5\u3001\u4EBA\u540D\u6761\u3001\u7ED9\u526A\u6620 / Premiere \u7684\u900F\u660E\u53E0\u52A0\u5C42\u3001\u7AD6\u7248",
    requires: ["\u9700\u8981\u4EBA\u50CF\u89C6\u9891 assets/talk.mp4"],
    variables: ["talk", "transparent", "videoFit", "focusX", "focusY", "backdrop", "length", "subjectX", "subjectW", "subjectTop", "subjectBottom", "cardBottom", "side", "name", "role", "nameTag", "nameCue", "nameAt", "nameHold", "stats", "statTint", "keywords", "highlight", "chapter", "chapterNo", "chapterCue", "chapterAt", "chapterHold", "corner", "cornerPos", "cornerAt", "accent", "ink", "card", "lead", "hold"],
    note: "stats \u4E0E keywords \u662F JSON \u6570\u7EC4\uFF0C\u9760 cue \u951A\u5B9A\u5230\u8BF4\u51FA\u7684\u8BCD\uFF1B\u7F3A\u4EBA\u50CF\u7D20\u6750\u53EA\u51FA\u5360\u4F4D\u3002"
  }
];
var TEMPLATE_IDS = HUASHU_TEMPLATES.map((t2) => t2.id);
var DEFAULT_TEMPLATE = "blank";
function huashuTemplate(id) {
  return HUASHU_TEMPLATES.find((t2) => t2.id === id) ?? HUASHU_TEMPLATES.find((t2) => t2.id === DEFAULT_TEMPLATE);
}

// embedded-skill/lib/guidance.mjs
var RENDERERS = {
  ffmpeg: {
    label: "FFmpeg \xB7 \u57FA\u7840\u7D20\u6750\u5408\u6210",
    summary: "\u9002\u5408\u5355\u7D20\u6750\u3001\u6807\u9898\u4E0E\u540C\u6B65\u5B57\u5E55\u7684\u57FA\u7840\u89C6\u9891\uFF1B\u753B\u9762\u91C7\u7528\u56FA\u5B9A\u7248\u5F0F\u3002",
    maxVisualsPerScene: 1,
    arbitraryLayout: false,
    motion: ["push", "hold", "pan"],
    captions: "\u6309\u5B9E\u9645\u65F6\u95F4\u8F74\u70E7\u5F55\u5B57\u5E55"
  },
  huashu: {
    label: "huashu-motion \xB7 \u6A21\u677F\u52A8\u6001\u5DE5\u7A0B",
    summary: "\u751F\u6210\u53EF\u7F16\u8F91\u7684\u56FA\u5B9A\u6A21\u677F\u5DE5\u7A0B\uFF1B\u5B9A\u5236\u5361\u7247\u3001\u5206\u5C4F\u548C\u590D\u6742\u52A8\u753B\u9700\u8981\u53E6\u884C\u8BBE\u8BA1\u5DE5\u7A0B\u3002",
    maxVisualsPerScene: 1,
    arbitraryLayout: false,
    motion: ["push", "hold", "pan"],
    captions: "\u6A21\u677F\u9010\u573A\u666F\u663E\u793A\u6574\u6BB5\u6587\u7A3F\uFF0C\u4E0D\u6309\u8BCD\u8FB9\u754C\u9010\u6761\u5207\u6362"
  }
};
var rendererCapabilities = (backend) => structuredClone(RENDERERS[backend] ?? RENDERERS.ffmpeg);

// src/app.jsx
var LABELS = { draft: "\u8349\u7A3F", ready: "\u5F85\u6267\u884C", running: "\u5236\u4F5C\u4E2D", publishing: "\u53D1\u5E03\u4E2D", needs_review: "\u5F85\u8BC4\u5BA1", blocked: "\u9700\u8981\u5904\u7406", failed: "\u5931\u8D25\u5F85\u6062\u590D", pausing: "\u6682\u505C\u4E2D", paused: "\u5DF2\u6682\u505C", complete: "\u5DF2\u5B8C\u6210", needs_check: "\u53D1\u5E03\u5F85\u6838\u9A8C", corrupt: "\u6587\u4EF6\u9700\u68C0\u67E5", pending: "\u672A\u5F00\u59CB", prepared: "\u53D1\u5E03\u5DF2\u51C6\u5907", skipped: "\u4E0D\u9002\u7528", submitted: "\u5DF2\u63D0\u4EA4", verified: "\u5DF2\u6838\u9A8C\u53D1\u5E03", verified_manual: "\u4EBA\u5DE5\u786E\u8BA4\u5DF2\u53D1\u5E03", not_published_manual: "\u4EBA\u5DE5\u786E\u8BA4\u672A\u53D1\u5E03", filled: "\u5DF2\u586B\u5165", waiting_for_login: "\u7B49\u5F85 PostFaro \u767B\u5F55", cancelled: "\u5DF2\u505C\u6B62", archived: "\u5DF2\u5F52\u6863" };
var MODES2 = { none: "\u4E0D\u505A\u9636\u6BB5\u8BC4\u5BA1", gates: "\u6807\u51C6\u8BC4\u5BA1", steps: "\u9010\u6B65\u8BC4\u5BA1" };
var ROLES = { source: "\u539F\u59CB\u8D44\u6599", screenshot: "\u771F\u5B9E\u754C\u9762", logo: "Logo", image: "\u56FE\u7247", video: "\u5F55\u5C4F/\u89C6\u9891", audio: "\u65C1\u767D\u5F55\u97F3", music: "\u80CC\u666F\u97F3\u4E50" };
var bytes = (value) => value > 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`;
var shortTime2 = (value) => formatShortTime(value, { month: "2-digit", empty: "\u672A\u77E5" });
function Button2({ primary, quiet, danger, className = "", children, ...props }) {
  return /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", className: `mw-button ${primary ? "mw-primary" : ""} ${quiet ? "mw-quiet" : ""} ${danger ? "mw-danger" : ""} ${className}`, ...props }, children);
}
function Badge2({ status, children }) {
  return /* @__PURE__ */ import_react10.default.createElement("span", { className: `mw-badge ${["complete", "verified", "pass", "available"].includes(status) ? "good" : ["failed", "fail", "corrupt"].includes(status) ? "bad" : ["needs_review", "needs_check", "blocked", "waiting_for_login", "unknown", "unavailable"].includes(status) ? "warn" : ""}` }, children ?? LABELS[status] ?? status);
}
function Field2({ label, children, full = false }) {
  const generatedId = (0, import_react10.useId)(), items = import_react10.default.Children.toArray(children), control = items.find((item) => import_react10.default.isValidElement(item) && ["input", "select", "textarea"].includes(item.type)), id = control?.props.id || generatedId;
  return /* @__PURE__ */ import_react10.default.createElement("div", { className: full ? "mw-full" : "" }, /* @__PURE__ */ import_react10.default.createElement("label", { className: "mw-label", htmlFor: id }, label), items.map((item) => item === control ? import_react10.default.cloneElement(item, { id }) : item));
}
function ErrorText({ error }) {
  return error ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-error", role: "alert" }, error.message || String(error)) : null;
}
function CheckList({ checks = [] }) {
  return checks.length ? /* @__PURE__ */ import_react10.default.createElement("div", null, checks.map((c, i) => /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-check-row", key: `${c.id}-${i}` }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react10.default.createElement("strong", null, c.label), /* @__PURE__ */ import_react10.default.createElement(Badge2, { status: c.status }, { pass: "\u901A\u8FC7", fail: "\u672A\u901A\u8FC7", unknown: "\u5F85\u5224\u65AD" }[c.status] || c.status)), c.detail && /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, c.detail)))) : /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u672C\u9636\u6BB5\u6CA1\u6709\u989D\u5916\u7684\u81EA\u52A8\u68C0\u67E5\u9879\u3002");
}
function Empty({ title, children, action }) {
  return /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-empty" }, /* @__PURE__ */ import_react10.default.createElement("h3", null, title), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, children), action);
}
var Boundary = class extends import_react10.default.Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch() {
  }
  render() {
    return this.state.error ? /* @__PURE__ */ import_react10.default.createElement("section", { className: "mw" }, /* @__PURE__ */ import_react10.default.createElement("style", null, CSS), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-content" }, /* @__PURE__ */ import_react10.default.createElement(ErrorText, { error: new Error("\u5A92\u4F53\u5DE5\u4F5C\u53F0\u754C\u9762\u52A0\u8F7D\u5931\u8D25\uFF0C\u5BBF\u4E3B\u4ECD\u53EF\u4F7F\u7528\u3002") }), /* @__PURE__ */ import_react10.default.createElement(Button2, { onClick: () => this.setState({ error: null }) }, "\u91CD\u65B0\u6253\u5F00\u5DE5\u4F5C\u53F0"))) : this.props.children;
  }
};
function StoryboardView({ client, taskId, parsed }) {
  const [uploads, setUploads] = (0, import_react10.useState)(null), [zoom, setZoom] = (0, import_react10.useState)(null);
  (0, import_react10.useEffect)(() => {
    const controller = new AbortController();
    client.uploads(taskId, controller.signal).then((u) => {
      if (!controller.signal.aborted) setUploads(u);
    }).catch(() => {
      if (!controller.signal.aborted) setUploads([]);
    });
    return () => controller.abort();
  }, [client, taskId]);
  const byId = new Map((uploads ?? []).map((u) => [u.id, u]));
  const mediaUrl = (m, time) => client.artifactUrl(taskId, m.path) + (time ? "#t=0.5" : "");
  return /* @__PURE__ */ import_react10.default.createElement("div", null, parsed.treatment && /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, parsed.treatment), (parsed.scenes ?? []).map((s, i) => {
    const ids = s.materialIds || s.materials?.map((m) => m.id) || [], mats = ids.map((id) => byId.get(id)).filter(Boolean), missing = mats.length ? [] : ids;
    return /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-scene", key: s.id || i }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-shot" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-shot-text" }, /* @__PURE__ */ import_react10.default.createElement("h4", null, i + 1, ". ", s.title || "\u672A\u547D\u540D\u955C\u5934"), s.visual && /* @__PURE__ */ import_react10.default.createElement("p", null, /* @__PURE__ */ import_react10.default.createElement("strong", null, "\u753B\u9762\uFF1A"), s.visual), s.motion && /* @__PURE__ */ import_react10.default.createElement("p", null, /* @__PURE__ */ import_react10.default.createElement("strong", null, "\u8FD0\u955C\uFF1A"), s.motion), /* @__PURE__ */ import_react10.default.createElement("small", null, mats.length ? `\u7D20\u6750\uFF1A${mats.map((m) => m.name).join("\u3001")}` : missing.length ? `\u7D20\u6750\uFF1A${missing.join("\u3001")}\uFF08\u6587\u4EF6\u5F85\u4E0A\u4F20\uFF09` : "\u7D20\u6750\uFF1A\u4F9D\u636E\u6587\u7A3F\u8BBE\u8BA1", " \xB7 ", s.durationSeconds ? `\u9884\u8BA1 ${s.durationSeconds} \u79D2` : s.start != null ? `${s.start.toFixed(2)}\u2013${Number(s.end).toFixed(2)} \u79D2` : "\u65F6\u957F\u4EE5\u5B9E\u9645\u5408\u6210\u4E3A\u51C6")), mats.length > 0 && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-shot-media" }, mats.map((m) => /^image\//.test(m.mime) ? /* @__PURE__ */ import_react10.default.createElement("a", { key: m.path, href: mediaUrl(m), title: `${m.name} \xB7 \u70B9\u51FB\u770B\u5927\u56FE`, onClick: (e) => {
      e.preventDefault();
      setZoom(mediaUrl(m));
    } }, /* @__PURE__ */ import_react10.default.createElement("img", { src: mediaUrl(m), alt: m.name, loading: "lazy" })) : /^video\//.test(m.mime) ? /* @__PURE__ */ import_react10.default.createElement("video", { key: m.path, src: mediaUrl(m, true), muted: true, preload: "metadata", title: m.name }) : /* @__PURE__ */ import_react10.default.createElement("a", { key: m.path, className: "mw-shot-file", href: mediaUrl(m), target: "_blank", rel: "noreferrer" }, m.name)))));
  }), zoom && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-lightbox", role: "dialog", "aria-label": "\u7D20\u6750\u5927\u56FE", onClick: () => setZoom(null) }, /* @__PURE__ */ import_react10.default.createElement("img", { src: zoom, alt: "\u7D20\u6750\u5927\u56FE" })));
}
function TextPreview({ client, taskId, artifact, showTitle }) {
  const [content, setContent] = (0, import_react10.useState)(null), [error, setError] = (0, import_react10.useState)(null);
  (0, import_react10.useEffect)(() => {
    const controller = new AbortController();
    setContent(null);
    setError(null);
    client.call("artifacts.text", { id: taskId, path: artifact.path }, controller.signal).then((data) => {
      if (!controller.signal.aborted) setContent(data.text);
    }).catch((e) => {
      if (!controller.signal.aborted) setError(e);
    });
    return () => controller.abort();
  }, [client, taskId, artifact.path, artifact.sha256]);
  if (error) return /* @__PURE__ */ import_react10.default.createElement(ErrorText, { error });
  if (content === null) return /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u6B63\u5728\u8BFB\u53D6\u4EA7\u7269\u2026");
  let parsed;
  if (artifact.mime === "application/json") {
    try {
      parsed = JSON.parse(content);
    } catch {
    }
  }
  if (parsed?.step && parsed?.note) return /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("h4", null, "\u672C\u7248\u4FEE\u6539"), /* @__PURE__ */ import_react10.default.createElement("p", null, parsed.note), parsed.voice && /* @__PURE__ */ import_react10.default.createElement("p", null, "\u97F3\u8272\uFF1A", parsed.voice.voice, " \xB7 \u8BED\u901F\uFF1A", parsed.voice.rate), parsed.scenes?.map((s) => /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-scene", key: s.id }, /* @__PURE__ */ import_react10.default.createElement("strong", null, s.id, s.title ? ` \xB7 ${s.title}` : ""), s.motion && /* @__PURE__ */ import_react10.default.createElement("p", null, "\u955C\u5934\u8FD0\u52A8\uFF1A", s.motion), s.materialIds && /* @__PURE__ */ import_react10.default.createElement("p", null, "\u4F7F\u7528\u7D20\u6750\uFF1A", s.materialIds.join("\u3001")))), parsed.presentation && /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u5B57\u5E55\u5B57\u53F7\uFF1A", parsed.presentation.captionFontSize ?? "\u6CBF\u7528", " \xB7 \u5B57\u5E55\u8FB9\u8DDD\uFF1A", parsed.presentation.captionMarginV ?? "\u6CBF\u7528", " \xB7 \u6807\u9898\u6BD4\u4F8B\uFF1A", parsed.presentation.titleScale ?? "\u6CBF\u7528"));
  if (parsed?.pages) return /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("p", null, parsed.treatment), parsed.pages.map((p) => /* @__PURE__ */ import_react10.default.createElement("div", { key: p.id, className: "mw-scene" }, /* @__PURE__ */ import_react10.default.createElement("h4", null, p.title), /* @__PURE__ */ import_react10.default.createElement("p", null, "\u7248\u5F0F\uFF1A", p.layout, " \xB7 \u6BB5\u843D\uFF1A", p.sectionIds.join("\u3001"), " \xB7 \u914D\u56FE\uFF1A", p.materialIds.join("\u3001") || "\u7EAF\u6587\u5B57"))));
  if (parsed?.scenes) return /* @__PURE__ */ import_react10.default.createElement(StoryboardView, { client, taskId, parsed });
  if (parsed?.sections) return /* @__PURE__ */ import_react10.default.createElement("div", null, showTitle && /* @__PURE__ */ import_react10.default.createElement("h4", null, parsed.title), parsed.sections.map((s) => /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-script-section", key: s.id }, /* @__PURE__ */ import_react10.default.createElement("p", null, s.text), /* @__PURE__ */ import_react10.default.createElement("small", null, "\u6765\u6E90\uFF1A", s.sourceIds?.join("\u3001") || "\u4EA7\u54C1\u7D20\u6750", " \xB7 \u4E8B\u5B9E\uFF1A", s.factIds?.join("\u3001") || "\u89C1\u7D20\u6750\u8BF4\u660E"))));
  if (parsed?.facts) return /* @__PURE__ */ import_react10.default.createElement("div", null, parsed.facts.map((f) => /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-fact", key: f.id }, /* @__PURE__ */ import_react10.default.createElement("h4", null, f.claim), /* @__PURE__ */ import_react10.default.createElement("p", null, "\u201C", f.quote, "\u201D"), /* @__PURE__ */ import_react10.default.createElement("small", null, "\u6765\u6E90\uFF1A", f.sourceId, " \xB7 ", f.eventTime || "\u4E8B\u4EF6\u65F6\u95F4\u672A\u660E\u786E", " \xB7 ", f.unit || "\u65E0\u53E6\u5217\u6570\u5B57\u5355\u4F4D"))), parsed.unknowns?.length > 0 && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-help" }, "\u5F85\u6838\u5B9E\uFF1A", parsed.unknowns.join("\uFF1B")), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, parsed.verification));
  if (parsed?.segments && parsed.alignmentMethod) return /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement(Badge2, null, parsed.alignmentMethod), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted", style: { marginTop: 10 } }, "\u65F6\u95F4\u8F74\u6765\u6E90\u4FDD\u7559\u5728\u6587\u4EF6\u4E2D\uFF1B\u8BCD\u7EA7\u4E0E\u53E5\u7EA7\u4E0D\u4F1A\u6DF7\u79F0\u3002"), parsed.segments.map((s, i) => /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-script-section", key: i }, /* @__PURE__ */ import_react10.default.createElement("small", null, s.start.toFixed(3), "\u2013", s.end.toFixed(3), " \u79D2"), /* @__PURE__ */ import_react10.default.createElement("p", null, s.text))), /* @__PURE__ */ import_react10.default.createElement("details", null, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u8BCD\u8FB9\u754C\uFF08", parsed.words?.length || 0, "\uFF09"), parsed.words?.map((w, i) => /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-timeline-word", key: i }, w.text, " \xB7 ", w.start.toFixed(2)))));
  if (parsed?.checks) return /* @__PURE__ */ import_react10.default.createElement(CheckList, { checks: parsed.checks });
  if (Array.isArray(parsed) && parsed[0]?.file) return /* @__PURE__ */ import_react10.default.createElement(MaterialList, { materials: parsed, artifact, client, taskId });
  return /* @__PURE__ */ import_react10.default.createElement("pre", null, content);
}
function Preview({ client, task, artifact, onClose, onTime, label }) {
  const [mediaError, setMediaError] = (0, import_react10.useState)(false);
  (0, import_react10.useEffect)(() => setMediaError(false), [artifact?.path]);
  if (!artifact) return null;
  const url = client.artifactUrl(task.state.id, artifact.path), image = artifact.mime.startsWith("image/"), video = artifact.mime.startsWith("video/"), audio = artifact.mime.startsWith("audio/");
  return /* @__PURE__ */ import_react10.default.createElement("aside", { className: "mw-preview", "aria-label": label || "\u4EA7\u7269\u9884\u89C8" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react10.default.createElement("h3", { className: "mw-grow" }, label || artifact.name), onClose && /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: onClose }, "\u6536\u8D77")), mediaError && /* @__PURE__ */ import_react10.default.createElement(ErrorText, { error: new Error("\u5A92\u4F53\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u8BF7\u68C0\u67E5\u6587\u4EF6\u662F\u5426\u4ECD\u5728\uFF0C\u6216\u4E0B\u8F7D\u540E\u67E5\u770B\u3002") }), image ? /* @__PURE__ */ import_react10.default.createElement("img", { src: url, alt: artifact.name, onError: () => setMediaError(true) }) : video ? /* @__PURE__ */ import_react10.default.createElement("video", { key: url, controls: true, preload: "metadata", src: url, onError: () => setMediaError(true), onTimeUpdate: (e) => onTime?.(e.currentTarget.currentTime) }) : audio ? /* @__PURE__ */ import_react10.default.createElement("audio", { key: url, controls: true, preload: "metadata", src: url, onError: () => setMediaError(true) }) : artifact.mime === "text/html" ? /* @__PURE__ */ import_react10.default.createElement("iframe", { title: artifact.name, sandbox: "allow-same-origin", src: url, style: { width: "100%", height: 680, border: 0, background: "#fff" } }) : /^(text\/|application\/json)/.test(artifact.mime) ? /* @__PURE__ */ import_react10.default.createElement(TextPreview, { client, taskId: task.state.id, artifact, showTitle: !!label }) : /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u6B64\u683C\u5F0F\u53EF\u4E0B\u8F7D\u67E5\u770B\u3002"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row", style: { marginTop: 12 } }, /* @__PURE__ */ import_react10.default.createElement("a", { className: "mw-button", href: url, download: artifact.name }, "\u4E0B\u8F7D\u6587\u4EF6"), /* @__PURE__ */ import_react10.default.createElement(Badge2, null, bytes(artifact.size))), /* @__PURE__ */ import_react10.default.createElement("details", null, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u6587\u4EF6\u4FE1\u606F"), /* @__PURE__ */ import_react10.default.createElement("p", null, artifact.path), /* @__PURE__ */ import_react10.default.createElement("p", null, artifact.mime), /* @__PURE__ */ import_react10.default.createElement("p", null, "SHA256\uFF1A", artifact.sha256)));
}
function ArtifactList({ client, task, step, selected, onSelect, includeTechnical = false }) {
  const [showAll, setShowAll] = (0, import_react10.useState)(includeTechnical);
  const common = ["article.html", "gallery.html", "article.md", "publication.json", "layout.json", "layout.md", "sources.json", "brief.md", "materials.md", "materials.json", "facts.json", "script.md", "storyboard.json", "voiceover.wav", "timeline.json", "captions.srt", "preview.mp4", "composition.json", "qa.json", "final.mp4", "cover.png", "media-info.json", "package.json", "package.md", "publish-preview.json", "stage-edit.json", "render-project.json", "publish-package.json"];
  const display = step.artifacts.filter((a) => showAll || common.includes(a.name) || /^(image|audio|video)\//.test(a.mime));
  if (!step.artifacts.length) return /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, step.status === "pending" ? "\u672C\u9636\u6BB5\u5C1A\u672A\u6267\u884C\u3002" : step.status === "running" ? "\u6B63\u5728\u751F\u6210\u5B9E\u9645\u4EA7\u7269\u2026" : "\u5F53\u524D\u6CA1\u6709\u53EF\u9884\u89C8\u4EA7\u7269\u3002");
  return /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-artifact-grid" }, display.map((a) => /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", className: "mw-artifact", key: a.id, "aria-pressed": selected?.path === a.path, onClick: () => onSelect(a) }, a.mime.startsWith("image/") ? /* @__PURE__ */ import_react10.default.createElement("img", { src: client.artifactUrl(task.state.id, a.path), alt: "", loading: "lazy" }) : /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-file-type", "aria-hidden": "true" }, a.mime.startsWith("video/") ? "\u25B6 \u89C6\u9891" : a.mime.startsWith("audio/") ? "\u266B \u97F3\u9891" : a.mime === "application/json" ? "\u7ED3\u6784\u5316\u4EA7\u7269" : "\u6587\u6863"), /* @__PURE__ */ import_react10.default.createElement("strong", null, artifactLabel(a)), /* @__PURE__ */ import_react10.default.createElement("small", null, a.name, " \xB7 ", bytes(a.size), " \xB7 v", step.revision)))), display.length !== step.artifacts.length && /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: () => setShowAll(true) }, "\u67E5\u770B\u5168\u90E8 ", step.artifacts.length, " \u4E2A\u6587\u4EF6"));
}
function Difference({ client, task, step }) {
  const history = step.history.filter((h) => h.artifacts?.length), [version, setVersion] = (0, import_react10.useState)(""), [data, setData] = (0, import_react10.useState)(null), [error, setError] = (0, import_react10.useState)(null);
  const chosen = history.find((h) => String(h.revision) === version) || history.at(-1);
  const names = ["article.md", "layout.md", "brief.json", "materials.md", "script.md", "storyboard.md", "package.md"];
  const current = (["render", "composition"].includes(step.key) ? step.artifacts.find((a) => a.name === (step.key === "render" ? "final.mp4" : "preview.mp4")) ?? step.artifacts.find((a) => a.name === "page-01.png") : null) ?? names.map((n) => step.artifacts.find((a) => a.name === n)).find(Boolean) ?? step.artifacts.find((a) => a.mime.startsWith("text/") || a.mime === "application/json") ?? step.artifacts.find((a) => /^(image|video)\//.test(a.mime));
  const previous = chosen?.artifacts.find((a) => a.name === current?.name);
  const nowVideo = (0, import_react10.useRef)(null), oldVideo = (0, import_react10.useRef)(null);
  (0, import_react10.useEffect)(() => {
    setData(null);
    setError(null);
    if (!current || !previous || /^(image|video)\//.test(current.mime)) return;
    const controller = new AbortController();
    Promise.all([client.call("artifacts.text", { id: task.state.id, path: previous.path }, controller.signal), client.call("artifacts.text", { id: task.state.id, path: current.path }, controller.signal)]).then(([a, b]) => {
      if (!controller.signal.aborted) setData(lineDiff(a.text, b.text));
    }).catch((e) => {
      if (!controller.signal.aborted) setError(e);
    });
    return () => controller.abort();
  }, [client, task.state.id, current?.path, previous?.path]);
  if (!history.length || !current || !previous) return /* @__PURE__ */ import_react10.default.createElement(Empty, { title: "\u8FD8\u6CA1\u6709\u53EF\u6BD4\u8F83\u7684\u4E24\u4E2A\u7248\u672C" }, "\u5F53\u524D\u7248\u672C\u4FDD\u7559\u540E\uFF0C\u4FEE\u6539\u6216\u91CD\u505A\u4F1A\u5728\u8FD9\u91CC\u5C55\u793A\u5DEE\u5F02\u3002");
  return /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row mw-between mw-toolbar" }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u5BF9\u6BD4\u7248\u672C" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: version || String(chosen.revision), onChange: (e) => setVersion(e.target.value) }, history.map((h) => /* @__PURE__ */ import_react10.default.createElement("option", { key: h.revision, value: h.revision }, "v", h.revision)))), /* @__PURE__ */ import_react10.default.createElement("strong", null, "\u2192 \u5F53\u524D v", step.revision)), /* @__PURE__ */ import_react10.default.createElement(ErrorText, { error }), current.mime.startsWith("image/") || current.mime.startsWith("video/") ? /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-compare" }, [previous, current].map((a, i) => /* @__PURE__ */ import_react10.default.createElement("div", { key: a.path }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-label" }, i ? "\u5F53\u524D\u7248" : "\u4E0A\u4E00\u7248"), a.mime.startsWith("image/") ? /* @__PURE__ */ import_react10.default.createElement("img", { src: client.artifactUrl(task.state.id, a.path), alt: i ? "\u5F53\u524D\u7248\u672C" : "\u4E0A\u4E00\u7248\u672C" }) : /* @__PURE__ */ import_react10.default.createElement("video", { controls: true, ref: i ? nowVideo : oldVideo, src: client.artifactUrl(task.state.id, a.path) })))), current.mime.startsWith("video/") && /* @__PURE__ */ import_react10.default.createElement(Button2, { onClick: () => {
    if (oldVideo.current && nowVideo.current) oldVideo.current.currentTime = Math.min(nowVideo.current.currentTime, oldVideo.current.duration || Infinity);
  } }, "\u5BF9\u9F50\u5230\u5F53\u524D\u7248\u64AD\u653E\u65F6\u95F4")) : data?.truncated ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-help" }, "\u6B63\u6587\u8D85\u8FC7\u9010\u884C\u5BF9\u6BD4\u4E0A\u9650\uFF0C\u8BF7\u4E0B\u8F7D\u4E24\u7248\u6587\u4EF6\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\u3002") : data ? /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-diff" }, data.lines.map((line, i) => /* @__PURE__ */ import_react10.default.createElement("div", { className: `mw-diff-line ${line.kind}`, key: i }, /* @__PURE__ */ import_react10.default.createElement("span", null, line.kind === "add" ? "+" : line.kind === "remove" ? "\u2212" : " "), /* @__PURE__ */ import_react10.default.createElement("span", null, line.text || " ")))) : /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u6B63\u5728\u6BD4\u8F83\u2026"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted", style: { marginTop: 14 } }, "\u65E7\u4EA7\u7269\u548C\u65E7\u5BA1\u6279\u4FDD\u7559\u3002\u53D7\u672C\u6B21\u4FEE\u6539\u5F71\u54CD\u7684\u540E\u7EED\u9636\u6BB5\u4F1A\u91CD\u65B0\u751F\u6210\uFF0C\u65E0\u5173\u4EA7\u7269\u7EE7\u7EED\u6709\u6548\u3002"));
}
function ReviewCard({ task, busy, perform, client, onReviewed, mediaTime }) {
  const review = task.state.pendingReview, [open, setOpen] = (0, import_react10.useState)(false), [feedback, setFeedback] = (0, import_react10.useState)("");
  (0, import_react10.useEffect)(() => {
    setOpen(false);
    setFeedback("");
  }, [review?.id]);
  if (!review) return null;
  const step = stepsFor(task).find((s) => s.key === review.step), version = task.state.steps.find((s) => s.key === review.step).revision;
  const decide = (decision) => perform(`review-${decision}`, async () => {
    await client.call("review.decide", { id: task.state.id, reviewId: review.id, decision, feedback });
    setOpen(false);
    onReviewed();
  });
  return /* @__PURE__ */ import_react10.default.createElement("section", { className: "mw-review", "aria-label": "\u9636\u6BB5\u8BC4\u5BA1" }, /* @__PURE__ */ import_react10.default.createElement(Badge2, { status: "needs_review" }, "\u7B49\u5F85\u4F60"), /* @__PURE__ */ import_react10.default.createElement("h3", null, step.label, " v", version, " \u9700\u8981\u8BC4\u5BA1"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u8BC4\u5BA1\u9488\u5BF9\u5F53\u524D\u4EA7\u7269\u7248\u672C\u3002\u901A\u8FC7\u540E\u6309\u672C\u6B21\u9700\u6C42\u7684\u8BC4\u5BA1\u7B56\u7565\u7EE7\u7EED\u3002"), review.checks.length > 0 && /* @__PURE__ */ import_react10.default.createElement("details", { style: { marginBottom: 12 } }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u81EA\u52A8\u68C0\u67E5"), /* @__PURE__ */ import_react10.default.createElement(CheckList, { checks: review.checks })), review.step === "publish" && /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-help" }, "\u672C\u6B21\u901A\u8FC7\u540C\u65F6\u6388\u6743\u63D0\u4EA4\u5F53\u524D\u7248\u672C\u5230\u9700\u6C42\u6307\u5B9A\u7684\u5E73\u53F0\u548C\u8D26\u53F7\uFF0C\u53EA\u786E\u8BA4\u4E00\u6B21\u3002"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row" }, /* @__PURE__ */ import_react10.default.createElement(Button2, { primary: true, disabled: busy, onClick: () => decide("approve") }, "\u901A\u8FC7\u5E76\u7EE7\u7EED"), /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy, onClick: () => setOpen(true) }, "\u8981\u6C42\u4FEE\u6539")), open && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-feedback" }, /* @__PURE__ */ import_react10.default.createElement("label", null, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-label" }, "\u4FEE\u6539\u610F\u89C1"), /* @__PURE__ */ import_react10.default.createElement("textarea", { className: "mw-field", value: feedback, onChange: (e) => setFeedback(e.target.value), placeholder: "\u8BF4\u660E\u8981\u4FEE\u6539\u54EA\u4E2A\u955C\u5934\u3001\u4E8B\u5B9E\u6216\u65F6\u95F4\u70B9\u3002" })), Number.isFinite(mediaTime) && mediaTime > 0 && /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: () => setFeedback((f) => `[${mediaTime.toFixed(2)} \u79D2] ${f}`) }, "\u9644\u52A0\u5F53\u524D\u64AD\u653E\u65F6\u95F4"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row" }, /* @__PURE__ */ import_react10.default.createElement(Button2, { primary: true, disabled: busy || !feedback.trim(), onClick: () => decide("changes") }, "\u63D0\u4EA4\u4FEE\u6539\u610F\u89C1"), /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy, onClick: () => decide("redo") }, "\u91CD\u505A\u672C\u6B65"), /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, disabled: busy, onClick: () => setOpen(false) }, "\u53D6\u6D88")), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted", style: { marginTop: 10 } }, "\u91CD\u505A\u6CBF\u7528\u672C\u6B65\u6709\u6548\u8F93\u5165\u91CD\u65B0\u751F\u6210\uFF1B\u6B64\u524D\u9636\u6BB5\u548C\u5386\u53F2\u7248\u672C\u4FDD\u7559\u3002")));
}
function ManualVerification({ task, receipt, client, perform, busy, refresh }) {
  const [outcome, setOutcome] = (0, import_react10.useState)("unknown"), [note, setNote] = (0, import_react10.useState)(""), [url, setUrl] = (0, import_react10.useState)("");
  if (receipt.status === "verified" || task.state.status === "publishing") return null;
  return /* @__PURE__ */ import_react10.default.createElement("details", { style: { marginTop: 12 } }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u8BB0\u5F55\u4EBA\u5DE5\u6838\u67E5"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 10 } }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u5B9E\u9645\u6838\u67E5\u7ED3\u8BBA" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: outcome, onChange: (e) => setOutcome(e.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "unknown" }, "\u4ECD\u4E0D\u786E\u5B9A"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "published" }, "\u5DF2\u770B\u5230\u53D1\u5E03\u8BB0\u5F55"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "not_published" }, "\u5DF2\u786E\u8BA4\u672A\u53D1\u5E03"))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u53D1\u5E03\u94FE\u63A5\uFF08\u786E\u8BA4\u5DF2\u53D1\u5E03\u65F6\u5FC5\u586B\uFF09" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: url, onChange: (e) => setUrl(e.target.value) })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u6838\u67E5\u4F9D\u636E", full: true }, /* @__PURE__ */ import_react10.default.createElement("textarea", { className: "mw-field", value: note, onChange: (e) => setNote(e.target.value) }))), /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy || !note.trim(), onClick: () => perform("manual-verification", async () => {
    await client.call("publish.record", { id: task.state.id, receiptId: receipt.id, outcome, note, url });
    refresh();
  }) }, "\u4FDD\u5B58\u4EBA\u5DE5\u6838\u67E5\u8BB0\u5F55"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u4EBA\u5DE5\u7ED3\u8BBA\u5355\u72EC\u6807\u8BB0\uFF0C\u539F\u5DE5\u5177\u56DE\u6267\u59CB\u7EC8\u4FDD\u7559\u3002"));
}
function Receipts({ task, client, perform, busy, refresh }) {
  if (!task.brief.publish.enabled) return /* @__PURE__ */ import_react10.default.createElement(Empty, { title: "\u672C\u4EFB\u52A1\u4EC5\u5236\u4F5C" }, "\u6210\u7247\u4E0E\u53EF\u7F16\u8F91\u5DE5\u7A0B\u53EF\u4EE5\u4ECE\u4EA7\u7269\u533A\u4E0B\u8F7D\u3002");
  return /* @__PURE__ */ import_react10.default.createElement("div", null, task.brief.publish.targets.map((target) => {
    const receipts = task.state.receipts.filter((r) => r.targetId === target.id), latest = receipts.filter((r) => r.runRevision === task.state.runRevision).at(-1);
    return /* @__PURE__ */ import_react10.default.createElement("section", { className: "mw-receipt", key: target.id }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react10.default.createElement("h3", null, target.platform, " \xB7 ", target.account), /* @__PURE__ */ import_react10.default.createElement(Badge2, { status: latest?.status || "pending" }, latest ? LABELS[latest.status] || latest.status : "\u5F85\u53D1\u5E03")), latest ? /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, latest.detail || (latest.status === "submitted" ? "\u5DF2\u4FDD\u5B58\u63D0\u4EA4\u5C1D\u8BD5\uFF0C\u6B63\u5728\u7B49\u5F85\u539F\u8BF7\u6C42\u7ED3\u679C\u3002" : "")), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u63D0\u4EA4\uFF1A", shortTime2(latest.submittedAt), " \xB7 \u6838\u9A8C\uFF1A", shortTime2(latest.checkedAt)), latest.requiredAction && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-help" }, "\u8BF7\u5728\u9009\u5B9A Chrome \u4E2D\u767B\u5F55 ", /* @__PURE__ */ import_react10.default.createElement("strong", null, "PostFaro \u8D26\u53F7"), "\u3002\u8FD9\u4E0E\u76EE\u6807\u5E73\u53F0\u767B\u5F55\u4E0D\u540C\uFF1B\u539F\u4EFB\u52A1\u4F1A\u81EA\u52A8\u7EE7\u7EED\uFF0C\u8BF7\u4FDD\u7559\u539F\u8FDB\u7A0B\u3002"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row" }, safeLink(latest.url) && /* @__PURE__ */ import_react10.default.createElement("a", { className: "mw-button", href: safeLink(latest.url), target: "_blank", rel: "noopener noreferrer" }, "\u6253\u5F00\u53D1\u5E03\u8BB0\u5F55 \u2197"), !["verified", "verified_manual", "waiting_for_login"].includes(latest.status) && /* @__PURE__ */ import_react10.default.createElement(Button2, { primary: true, disabled: busy || task.state.status === "publishing", onClick: () => perform("verify", async () => {
      await client.call("publish.verify", { id: task.state.id, receiptId: latest.id });
      refresh();
    }) }, "\u68C0\u67E5\u53D1\u5E03\u7ED3\u679C")), ["failed", "not_published_manual"].includes(latest.status) && /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy, onClick: () => perform("retry-target", async () => {
      await client.call("publish.retry", { id: task.state.id, receiptId: latest.id });
      refresh();
    }) }, "\u91CD\u8BD5\u6B64\u5E73\u53F0"), /* @__PURE__ */ import_react10.default.createElement(ManualVerification, { task, receipt: latest, client, perform, busy, refresh }), /* @__PURE__ */ import_react10.default.createElement("details", null, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u56DE\u6267\u4E0E\u5C1D\u8BD5\u8BB0\u5F55\uFF08", receipts.length, "\uFF09"), /* @__PURE__ */ import_react10.default.createElement("pre", null, JSON.stringify(receipts, null, 2)))) : /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u5C06\u5728\u53D1\u5E03\u5173\u5C55\u793A\u6700\u7EC8\u5305\u88C5\u548C\u8D26\u53F7\u6838\u9A8C\u3002"));
  }), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u201C\u5DF2\u586B\u5165\u201D\u548C\u201C\u5DF2\u63D0\u4EA4\u201D\u5747\u4E0D\u7B49\u4E8E\u5DF2\u53D1\u5E03\u3002\u5F85\u6838\u9A8C\u7684\u8BF7\u6C42\u4E0D\u4F1A\u81EA\u52A8\u91CD\u53D1\u3002"));
}
function RequestInput({ task, client, perform, refresh, busy }) {
  const [request, setRequest] = (0, import_react10.useState)(null), [value, setValue] = (0, import_react10.useState)(""), [error, setError] = (0, import_react10.useState)(null);
  (0, import_react10.useEffect)(() => {
    const c = new AbortController();
    client.call("stage.request", { id: task.state.id }, c.signal).then((r) => {
      if (!c.signal.aborted) setRequest(r);
    }).catch((e) => {
      if (!c.signal.aborted) setError(e);
    });
    return () => c.abort();
  }, [client, task.state.id, task.state.activeStep, task.state.error?.at]);
  if (!request) return /* @__PURE__ */ import_react10.default.createElement(ErrorText, { error });
  return /* @__PURE__ */ import_react10.default.createElement("details", { style: { marginTop: 15 } }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u9AD8\u7EA7\uFF1A\u5BFC\u5165\u9636\u6BB5\u7ED3\u679C"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u8BFB\u53D6\u4E0B\u9762\u7684\u8BF7\u6C42\uFF0C\u8FD4\u56DE\u7B26\u5408\u7ED3\u6784\u7684 JSON\u3002\u5BFC\u5165\u65F6\u4F1A\u6838\u5BF9\u5F53\u524D\u8F93\u5165\u7248\u672C\u3002"), /* @__PURE__ */ import_react10.default.createElement("pre", { style: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 260, overflow: "auto", fontSize: 12 } }, JSON.stringify(request, null, 2)), /* @__PURE__ */ import_react10.default.createElement("label", null, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-label" }, "\u9636\u6BB5\u7ED3\u679C JSON"), /* @__PURE__ */ import_react10.default.createElement("textarea", { className: "mw-field", value, onChange: (e) => setValue(e.target.value) })), /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy || !value.trim(), onClick: () => perform("complete-stage", async () => {
    let response;
    try {
      response = JSON.parse(value);
    } catch {
      throw new Error("\u9636\u6BB5\u7ED3\u679C\u4E0D\u662F\u6709\u6548 JSON");
    }
    await client.call("stage.complete", { id: task.state.id, step: request.step, inputDigest: request.inputDigest, response });
    refresh();
  }) }, "\u5BFC\u5165\u7ED3\u679C\u5E76\u7EE7\u7EED"));
}
function ArtifactImport({ client, task, busy, perform, refresh }) {
  const [files, setFiles] = (0, import_react10.useState)([]), [note, setNote] = (0, import_react10.useState)(""), [request, setRequest] = (0, import_react10.useState)(null);
  const type = workType(task), required = type === "video" ? "final.mp4\u3001cover.png\u3001render-project.json" : `publication.json\u3001article.md\u3001${type === "article" ? "article.html" : "gallery.html\u3001\u4ECE page-01.png \u5F00\u59CB\u7684\u6709\u5E8F\u56FE\u7247"}`;
  return /* @__PURE__ */ import_react10.default.createElement("details", { style: { marginTop: 18 } }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u5BFC\u5165\u5916\u90E8\u5236\u4F5C\u7684\u4EA4\u4ED8\u6587\u4EF6"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u9700\u5148\u5B8C\u6210\u672C\u4EFB\u52A1\u7684\u9884\u89C8\u548C\u8D28\u68C0\u3002\u9009\u62E9\u540C\u4E00\u7248\u4F5C\u54C1\u7684\u5B8C\u6574\u6587\u4EF6\uFF1B\u5BFC\u5165\u540E\u4FDD\u7559\u65E7\u7248\uFF0C\u540E\u7EED\u5305\u88C5\u53CA\u672C\u5173\u8BC4\u5BA1\u4F1A\u66F4\u65B0\u3002"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u5FC5\u8981\u6587\u4EF6\uFF1A", required, "\u3002\u6BCF\u4E2A\u6587\u4EF6\u6700\u591A 2GB\uFF0C\u603B\u91CF\u6700\u591A 8GB\uFF0C\u5927\u6587\u4EF6\u652F\u6301\u65AD\u70B9\u7EED\u4F20\u3002"), /* @__PURE__ */ import_react10.default.createElement("label", null, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-label" }, "\u4EA4\u4ED8\u6587\u4EF6"), /* @__PURE__ */ import_react10.default.createElement("input", { type: "file", multiple: true, onChange: (e) => {
    const selected = [...e.target.files];
    perform("import-prepare", async () => {
      const r = await client.call("artifacts.import-request", { id: task.state.id });
      setFiles(selected);
      setRequest(r);
    });
  } })), /* @__PURE__ */ import_react10.default.createElement("label", null, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-label" }, "\u6216\u9009\u62E9\u5B8C\u6574\u5DE5\u7A0B\u76EE\u5F55"), /* @__PURE__ */ import_react10.default.createElement("input", { type: "file", multiple: true, webkitdirectory: "", directory: "", onChange: (e) => {
    const selected = [...e.target.files];
    perform("import-prepare-folder", async () => {
      setRequest(await client.call("artifacts.import-request", { id: task.state.id }));
      setFiles(selected);
    });
  } })), files.length > 0 && /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, files.map((f) => f.webkitRelativePath || f.name).join("\u3001")), /* @__PURE__ */ import_react10.default.createElement("label", null, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-label" }, "\u672C\u7248\u4FEE\u6539\u8BF4\u660E"), /* @__PURE__ */ import_react10.default.createElement("textarea", { className: "mw-field", value: note, onChange: (e) => setNote(e.target.value), placeholder: "\u8BF4\u660E\u5B9E\u9645\u5236\u4F5C\u5DE5\u5177\u3001\u6539\u52A8\uFF0C\u4EE5\u53CA\u4ECD\u9700\u6838\u5B9E\u7684\u5185\u5BB9\u3002" })), /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy || !request || !files.length || !note.trim(), onClick: () => perform("import-artifacts", async () => {
    const imported = [];
    for (const file of files) {
      const result = await client.upload(task.state.id, { file, role: "source" }, void 0, true);
      imported.push({ name: file.webkitRelativePath ? file.webkitRelativePath.split("/").slice(1).join("/") : file.name, path: result.path });
    }
    await client.call("artifacts.import", { id: task.state.id, inputDigest: request.inputDigest, bundle: { note, files: imported } });
    setFiles([]);
    setRequest(null);
    setNote("");
    refresh();
  }) }, "\u5BFC\u5165\u4E3A\u4EA4\u4ED8\u65B0\u7248\u672C"));
}
var WORK_PREVIEWS = {
  article: { label: "\u6587\u7AE0", delivery: "article.html", preview: "article.html", plan: "layout.json" },
  "image-post": { label: "\u56FE\u6587", delivery: "gallery.html", preview: "gallery.html", plan: "layout.json" },
  video: { label: "\u89C6\u9891", delivery: "final.mp4", preview: "preview.mp4", plan: "storyboard.json" }
};
function WorkPreview({ client, task, canEdit, busy, perform, refresh, onTime }) {
  const type = workType(task), view = WORK_PREVIEWS[type];
  const find = (key, name2) => task.state.steps.find((step) => step.key === key)?.artifacts.find((artifact2) => artifact2.name === name2);
  const delivery = find("render", view.delivery);
  const layout = find("composition", view.preview);
  const script = find("script", "script.json");
  const plan = find("storyboard", view.plan);
  const artifact = delivery || layout || script;
  const project = type !== "video" && find("render", "publication.json");
  const label = delivery ? type === "video" ? "\u6210\u7247\u9884\u89C8" : `${view.label}\u4EA4\u4ED8\u9884\u89C8` : layout ? type === "video" ? "\u89C6\u9891\u5236\u4F5C\u9884\u89C8" : `${view.label}\u6392\u7248\u9884\u89C8` : type === "video" ? "\u89C6\u9891\u811A\u672C" : `${view.label}\u6B63\u6587`;
  return /* @__PURE__ */ import_react10.default.createElement("section", { className: "mw-work-preview", "aria-label": `${view.label}\u4F5C\u54C1` }, artifact ? /* @__PURE__ */ import_react10.default.createElement(Preview, { key: artifact.path, client, task, artifact, label, onTime }) : /* @__PURE__ */ import_react10.default.createElement(Empty, { title: "\u7B49\u5F85\u6B63\u5F0F\u6587\u7A3F" }, "\u6587\u7A3F\u4FDD\u5B58\u540E\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002"), plan && !layout && !delivery && /* @__PURE__ */ import_react10.default.createElement("details", { open: task.state.pendingReview?.step === "storyboard" }, /* @__PURE__ */ import_react10.default.createElement("summary", null, type === "video" ? "\u5206\u955C\u65B9\u6848" : `${view.label}\u7F16\u6392\u65B9\u6848`), /* @__PURE__ */ import_react10.default.createElement(TextPreview, { client, taskId: task.state.id, artifact: plan })), project && canEdit && /* @__PURE__ */ import_react10.default.createElement(CanvasEditor, { client, task, busy, perform, refresh }));
}
function Workbench({ client, task, busy, perform, refresh, onEdit, onExpand, onCompanion, onArchive }) {
  const [selectedStep, setSelectedStep] = (0, import_react10.useState)(task.state.status === "complete" ? "render" : task.state.activeStep), [tab, setTab] = (0, import_react10.useState)("artifacts"), [artifact, setArtifact] = (0, import_react10.useState)(null), [mediaTime, setMediaTime] = (0, import_react10.useState)(0), [exported, setExported] = (0, import_react10.useState)(null);
  const [detailsOpen, setDetailsOpen] = (0, import_react10.useState)(false);
  const previousActive = (0, import_react10.useRef)(task.state.activeStep), tabId = (0, import_react10.useId)(), details = (0, import_react10.useRef)(null);
  const { pendingReview, status } = task.state;
  const next = nextAction(task.state);
  (0, import_react10.useEffect)(() => {
    if (previousActive.current !== task.state.activeStep) {
      setSelectedStep(task.state.activeStep);
      setArtifact(null);
      previousActive.current = task.state.activeStep;
    }
  }, [task.state.activeStep]);
  const STEPS = stepsFor(task);
  const step = task.state.steps.find((s) => s.key === selectedStep) || task.state.steps[0], definition = STEPS.find((s) => s.key === step.key), running = ["running", "publishing", "pausing"].includes(task.state.status), archived = !!task.state.archivedAt;
  (0, import_react10.useEffect)(() => {
    if (artifact && ![...step.artifacts, ...step.history.flatMap((h) => h.artifacts || [])].some((a) => a.path === artifact.path)) setArtifact(null);
  }, [step.artifactDigest]);
  const selectStep = (key) => {
    setSelectedStep(key);
    setArtifact(null);
    setTab("artifacts");
  };
  const showDetails = (key, tab2 = "artifacts") => {
    selectStep(key);
    setTab(tab2);
    setDetailsOpen(true);
    requestAnimationFrame(() => details.current?.scrollIntoView({ block: "start" }));
  };
  const action = (method, payload) => perform(method, async () => {
    await client.call(method, { id: task.state.id, ...payload });
    refresh();
  });
  const stepDetails = /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-work-grid" }, /* @__PURE__ */ import_react10.default.createElement("aside", { className: "mw-steps", "aria-label": "\u5236\u4F5C\u6D41\u7A0B" }, STEPS.map((s, i) => {
    const actual = task.state.steps[i];
    return /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", className: "mw-step", key: s.key, "aria-current": step.key === s.key ? "step" : void 0, onClick: () => selectStep(s.key) }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-step-number" }, actual.status === "complete" ? "\u2713" : String(i + 1).padStart(2, "0")), /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-step-name" }, s.label), /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-step-mark" }, actual.status === "needs_review" ? "\u5F85\u5BA1" : s.gate ? "\u5173" : ""));
  }), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted", style: { marginTop: 14 } }, "\u8BC4\u5BA1\u7B56\u7565\u5728\u9700\u6C42\u65F6\u786E\u5B9A\uFF0C\u8FD0\u884C\u4E2D\u4FDD\u6301\u53EA\u8BFB\u3002"), !archived && /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, disabled: running || busy, onClick: () => onEdit(task) }, "\u91CD\u65B0\u63D0\u4EA4\u9700\u6C42")), /* @__PURE__ */ import_react10.default.createElement("section", { className: "mw-stage" }, /* @__PURE__ */ import_react10.default.createElement("label", { className: "mw-step-select" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-label" }, "\u67E5\u770B\u6B65\u9AA4"), /* @__PURE__ */ import_react10.default.createElement("select", { "aria-label": "\u67E5\u770B\u6B65\u9AA4", className: "mw-field", value: step.key, onChange: (e) => selectStep(e.target.value) }, STEPS.map((s, i) => /* @__PURE__ */ import_react10.default.createElement("option", { value: s.key, key: s.key }, i + 1, ". ", s.label)))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row mw-between mw-stage-header" }, /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("h3", null, definition.label), /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-muted" }, definition.output, step.revision ? ` \xB7 v${step.revision}` : "")), /* @__PURE__ */ import_react10.default.createElement(Badge2, { status: step.status })), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-tabs", role: "tablist", "aria-label": "\u9636\u6BB5\u5185\u5BB9" }, [["artifacts", "\u4EA7\u7269"], ["checks", "\u68C0\u67E5"], ["diff", "\u7248\u672C\u5DEE\u5F02"], ["receipts", "\u53D1\u5E03\u8BB0\u5F55"]].map(([key, label]) => /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", role: "tab", id: `${tabId}-${key}`, "aria-controls": `${tabId}-panel`, "aria-selected": tab === key, tabIndex: tab === key ? 0 : -1, key, onKeyDown: (e) => {
    const keys = ["artifacts", "checks", "diff", "receipts"];
    let index = keys.indexOf(tab);
    if (e.key === "ArrowRight") index = (index + 1) % keys.length;
    else if (e.key === "ArrowLeft") index = (index + keys.length - 1) % keys.length;
    else if (e.key === "Home") index = 0;
    else if (e.key === "End") index = keys.length - 1;
    else return;
    e.preventDefault();
    setTab(keys[index]);
    document.getElementById(`${tabId}-${keys[index]}`)?.focus();
  }, onClick: () => setTab(key) }, label))), /* @__PURE__ */ import_react10.default.createElement("div", { id: `${tabId}-panel`, role: "tabpanel", "aria-labelledby": `${tabId}-${tab}` }, tab === "artifacts" && /* @__PURE__ */ import_react10.default.createElement("div", { className: artifact ? "mw-split" : "" }, /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement(ArtifactList, { client, task, step, selected: artifact, onSelect: setArtifact }), step.history.length > 0 && /* @__PURE__ */ import_react10.default.createElement("details", { style: { marginTop: 15 } }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u5386\u53F2\u4EA7\u7269\uFF08", step.history.length, " \u7248\uFF09"), step.history.map((h, i) => /* @__PURE__ */ import_react10.default.createElement("div", { key: i, style: { marginTop: 12 } }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-label" }, "v", h.revision, " \xB7 ", LABELS[h.status] || h.status), /* @__PURE__ */ import_react10.default.createElement(ArtifactList, { client, task, step: h, selected: artifact, onSelect: setArtifact }))))), artifact && /* @__PURE__ */ import_react10.default.createElement(Preview, { client, task, artifact, onClose: () => setArtifact(null), onTime: setMediaTime })), tab === "checks" && /* @__PURE__ */ import_react10.default.createElement(CheckList, { checks: step.checks }), tab === "diff" && /* @__PURE__ */ import_react10.default.createElement(Difference, { client, task, step }), tab === "receipts" && /* @__PURE__ */ import_react10.default.createElement(Receipts, { task, client, busy, perform, refresh })), step.artifacts.length > 0 && !archived && !task.state.pendingReview && !running && step.key !== "publish" && /* @__PURE__ */ import_react10.default.createElement("details", { style: { marginTop: 18 } }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u91CD\u505A\u5F53\u524D\u9636\u6BB5"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u4FDD\u7559\u5F53\u524D\u7248\u672C\uFF1B\u53D7\u5F71\u54CD\u7684\u540E\u7EED\u9636\u6BB5\u5C06\u66F4\u65B0\u3002"), /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy, onClick: () => action("tasks.redo", { step: step.key }) }, "\u4F7F\u7528\u5F53\u524D\u8F93\u5165\u91CD\u505A\u672C\u6B65")), step.key === "render" && !running && !archived && /* @__PURE__ */ import_react10.default.createElement(ArtifactImport, { key: task.state.id, client, task, busy, perform, refresh })));
  return /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row mw-between mw-work-top" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-grow" }, /* @__PURE__ */ import_react10.default.createElement("h2", null, task.state.title), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row" }, /* @__PURE__ */ import_react10.default.createElement(Badge2, null, CONTENT_TYPES.find((t2) => t2.id === workType(task)).label), /* @__PURE__ */ import_react10.default.createElement(Badge2, { status }), archived && /* @__PURE__ */ import_react10.default.createElement(Badge2, { status: "archived" }, "\u5DF2\u5F52\u6863"))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row" }, !running && /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy, onClick: () => perform("export", async () => setExported(await client.call("tasks.export", { id: task.state.id }))) }, "\u5BFC\u51FA\u4EFB\u52A1\u4E0E\u5DE5\u7A0B"), onExpand && /* @__PURE__ */ import_react10.default.createElement(Button2, { onClick: onExpand }, "\u5C55\u5F00\u5DE5\u4F5C\u53F0"), onCompanion && /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy, onClick: () => perform("companion", () => onCompanion(task.state.id)) }, "\u968F\u804A\u9762\u677F"), archived ? /* @__PURE__ */ import_react10.default.createElement(Button2, { primary: true, disabled: busy, onClick: () => onArchive(task, false) }, "\u6062\u590D\u4EFB\u52A1") : status === "draft" ? /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement(Button2, { onClick: () => onEdit(task) }, "\u7F16\u8F91\u9700\u6C42"), /* @__PURE__ */ import_react10.default.createElement(Button2, { primary: true, disabled: busy, onClick: () => action("tasks.start", { approveBrief: true }) }, "\u786E\u8BA4\u9700\u6C42\u5E76\u5F00\u59CB")) : running ? /* @__PURE__ */ import_react10.default.createElement(Button2, { disabled: busy || status === "pausing", onClick: () => action("tasks.pause") }, status === "pausing" ? "\u6682\u505C\u4E2D\u2026" : "\u6682\u505C\u4EFB\u52A1") : status !== "complete" && !pendingReview && status !== "needs_check" ? /* @__PURE__ */ import_react10.default.createElement(Button2, { primary: true, disabled: busy, onClick: () => action("tasks.resume") }, status === "paused" ? "\u6062\u590D\u4EFB\u52A1" : "\u91CD\u8BD5\u5F53\u524D\u9636\u6BB5") : null, !archived && !running && /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, disabled: busy, onClick: () => onArchive(task, true) }, "\u5F52\u6863"))), archived && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-notice", role: "status" }, "\u4EFB\u52A1\u5DF2\u5F52\u6863\uFF08", shortTime2(task.state.archivedAt), "\uFF09\u3002\u6062\u590D\u540E\u53EF\u4EE5\u7EE7\u7EED\u5236\u4F5C\u3002"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-next-action" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-eyebrow" }, running ? "\u5F53\u524D\u8FDB\u5C55" : "\u4E0B\u4E00\u6B65"), /* @__PURE__ */ import_react10.default.createElement("h3", null, next.title), /* @__PURE__ */ import_react10.default.createElement("p", null, next.detail), pendingReview && /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: () => showDetails(pendingReview.step) }, "\u67E5\u770B\u8BC4\u5BA1\u4EA7\u7269"), status === "needs_check" && /* @__PURE__ */ import_react10.default.createElement(Button2, { primary: true, onClick: () => showDetails("publish", "receipts") }, "\u6838\u9A8C\u53D1\u5E03\u7ED3\u679C")), task.state.delivery && /* @__PURE__ */ import_react10.default.createElement("div", { className: task.state.delivery.status === "failed" ? "mw-error" : "mw-notice" }, task.state.delivery.status === "saved" ? "\u4F5C\u54C1\u5DF2\u53E6\u5B58\u5230\u4EA4\u4ED8\u76EE\u5F55\uFF1A" : "\u989D\u5916\u4EA4\u4ED8\u526F\u672C\u4FDD\u5B58\u5931\u8D25\uFF0C\u4EFB\u52A1\u539F\u4EA7\u7269\u4ECD\u53EF\u4E0B\u8F7D\uFF1A", task.state.delivery.directory, task.state.delivery.message && /* @__PURE__ */ import_react10.default.createElement("p", null, task.state.delivery.message)), exported && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-notice" }, /* @__PURE__ */ import_react10.default.createElement("a", { href: client.exportUrl(exported.id), download: exported.name }, "\u4E0B\u8F7D\u5B8C\u6574\u4EFB\u52A1\u4E0E\u5DE5\u7A0B \xB7 ", bytes(exported.size))), task.state.error && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-help" }, /* @__PURE__ */ import_react10.default.createElement("strong", null, task.state.error.message), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row", style: { marginTop: 8 } }, /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, disabled: busy || running, onClick: () => onEdit(task) }, "\u8865\u5145\u8D44\u6599\u6216\u91CD\u65B0\u63D0\u4EA4\u9700\u6C42")), /* @__PURE__ */ import_react10.default.createElement(RequestInput, { task, client, busy, perform, refresh })), /* @__PURE__ */ import_react10.default.createElement(ReviewCard, { task, client, busy, perform, onReviewed: refresh, mediaTime }), /* @__PURE__ */ import_react10.default.createElement(WorkPreview, { client, task, canEdit: !running && !archived && status !== "needs_check", busy, perform, refresh, onTime: setMediaTime }), /* @__PURE__ */ import_react10.default.createElement("details", { ref: details, className: "mw-work-details", open: detailsOpen, onToggle: (event) => setDetailsOpen(event.currentTarget.open) }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u5236\u4F5C\u8BE6\u60C5"), detailsOpen && /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, MODES2[task.state.review.mode], " \xB7 \u5B8C\u6210 ", task.state.steps.filter((s) => ["complete", "skipped"].includes(s.status)).length, " / ", task.state.steps.length, " \u6B65"), task.brief.writing && /* @__PURE__ */ import_react10.default.createElement("details", null, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u672C\u6B21\u5199\u4F5C\u914D\u7F6E"), task.brief.writing.style && /* @__PURE__ */ import_react10.default.createElement("p", null, task.brief.writing.style.guidance), /* @__PURE__ */ import_react10.default.createElement("ul", null, task.brief.writing.rules.map((rule) => /* @__PURE__ */ import_react10.default.createElement("li", { key: rule.id }, /* @__PURE__ */ import_react10.default.createElement("strong", null, rule.name), " \xB7 ", rule.rule)))), stepDetails)));
}
function initialBrief(settings = {}) {
  return { title: "", description: "", work: { type: "article" }, style: "original", audience: "", requirements: "", timezone: "Asia/Shanghai", asOf: "", review: { mode: settings.defaultReview || "gates" }, sources: [], brand: { primary: "#315abb", attribution: "" }, output: { width: 780, height: 1080, durationSeconds: 75, fps: 30 }, voice: { mode: "none", voice: settings.defaultVoice || "zh-CN-XiaoxiaoNeural", rate: "+0%", requiredAlignment: "word" }, render: { backend: "ffmpeg", codec: "libx264", template: "blank" }, publish: { enabled: false, confirm: true, targets: [], bridgeId: settings.bridgeId || "", browserContext: settings.browserContext || "regular", authorization: null } };
}
function CreateTask({ client, settings, storageRoot, seed, sessionId, onCreated, perform, busy, visible }) {
  const [refreshWriting, setRefreshWriting] = (0, import_react10.useState)(false);
  const draftKey = `new-${storageRoot}:${sessionId || "global"}`;
  const [brief, setBrief] = (0, import_react10.useState)(() => seed?.brief || initialBrief(settings)), [files, setFiles] = (0, import_react10.useState)([]), [sourceText, setSourceText] = (0, import_react10.useState)(() => (seed?.brief.sources || []).find((s) => s.id === "draft-text")?.text || ""), [sourceUrl, setSourceUrl] = (0, import_react10.useState)(() => (seed?.brief.sources || []).filter((s) => s.id.startsWith("draft-url-")).map((s) => s.url).join("\n")), [restored, setRestored] = (0, import_react10.useState)(false), draftId = (0, import_react10.useRef)(seed?.state?.status === "draft" ? seed.state.id : null), uploaded = (0, import_react10.useRef)(/* @__PURE__ */ new Set());
  (0, import_react10.useEffect)(() => {
    if (seed) {
      setBrief(seed.brief);
      setSourceText(seed.brief.sources.find((s) => s.id === "draft-text")?.text || "");
      setSourceUrl(seed.brief.sources.filter((s) => s.id.startsWith("draft-url-")).map((s) => s.url).join("\n"));
      setFiles([]);
      draftId.current = seed.state.status === "draft" ? seed.state.id : null;
      setRestored(true);
      return;
    }
    let alive = true;
    draftStore(draftKey).then((d) => {
      if (alive && d) {
        setBrief(d.brief);
        setFiles(d.files || []);
        draftId.current = d.taskId || null;
        setSourceText(d.sourceText || "");
        setSourceUrl(d.sourceUrl || "");
      }
    }).catch(() => {
    }).finally(() => {
      if (alive) setRestored(true);
    });
    return () => {
      alive = false;
    };
  }, [seed, sessionId, draftKey]);
  (0, import_react10.useEffect)(() => {
    if (!restored || seed) return;
    const timer = setTimeout(() => draftStore(draftKey, { brief, files, sourceText, sourceUrl, taskId: draftId.current }).catch(() => {
    }), 350);
    return () => clearTimeout(timer);
  }, [brief, files, sourceText, sourceUrl, restored, seed, draftKey]);
  const set = (key, value) => setBrief((b) => ({ ...b, [key]: value }));
  const group = (name2, key, value) => setBrief((b) => ({ ...b, [name2]: { ...b[name2], [key]: value } }));
  const mimo = (brief.voice.provider || settings.ttsProvider) === "mimo";
  const addFiles = (list, role) => {
    const next = Array.from(list || []).map((file) => ({ file, role }));
    if (next.some((x) => x.file.size > 2 * 1024 * 1024 * 1024)) throw new Error("\u5355\u4E2A\u9644\u4EF6\u6700\u591A 2GB\u3002");
    setFiles((items) => [...items, ...next]);
  };
  const changeType = (type) => setBrief((b) => ({
    ...b,
    work: { type },
    review: { mode: b.review.mode },
    output: { ...b.output, width: type === "article" ? 780 : 1080, height: type === "image-post" ? 1440 : type === "video" ? 1920 : 1080 },
    voice: { ...b.voice, mode: type === "video" ? "tts" : "none" },
    publish: { ...b.publish, enabled: false }
  }));
  const submit = (start) => perform(start ? "create-start" : "create-draft", async () => {
    const request = brief.description.trim();
    if (start && !request && !files.length && !sourceText.trim() && !sourceUrl.trim() && !brief.sources.length) throw new Error("\u5199\u4E00\u53E5\u5236\u4F5C\u8BF4\u660E\uFF0C\u6216\u6DFB\u52A0\u7D20\u6750\u3002");
    const autoTitle = !brief.title.trim();
    const title = brief.title.trim() || request.split(/\r?\n/, 1)[0].slice(0, 60) || files[0]?.file.name.slice(0, 60) || "\u672A\u547D\u540D\u4F5C\u54C1";
    const description = request || `\u6839\u636E\u63D0\u4F9B\u7684\u7D20\u6750\u5236\u4F5C${CONTENT_TYPES.find((row) => row.id === workType(brief)).label}\u3002`;
    let next = { ...brief, title, description, sources: brief.sources.filter((s) => s.id !== "draft-text" && s.id !== "draft-description" && !s.id.startsWith("draft-url-")) };
    if (sourceText.trim()) next.sources.push({ id: "draft-text", name: "\u7528\u6237\u63D0\u4F9B\u7684\u539F\u59CB\u8D44\u6599", text: sourceText, role: "source" });
    const urls = new Set(next.sources.map((s) => s.url).filter(Boolean));
    for (const url of [...sourceUrl.split(/\n+/).map((line) => line.trim()).filter(Boolean), ...linksInText(request)]) {
      if (urls.has(url)) continue;
      urls.add(url);
      next.sources.push({ id: `draft-url-${next.sources.length}`, name: "\u8BF4\u660E\u4E2D\u7684\u6765\u6E90\u94FE\u63A5", url, role: "source" });
    }
    if (!next.sources.length && request && !files.length) next.sources.push({ id: "draft-description", name: "\u7528\u6237\u7684\u5236\u4F5C\u8BF4\u660E", text: request, role: "source" });
    if (start && request && settings.provider && settings.model) {
      const defaultSize = brief.output.width === 1080 && brief.output.height === 1920;
      next = await client.call("brief.parse", { text: request, current: next, quick: true, autoTitle, autoOutput: !seed && defaultSize && brief.output.durationSeconds === 75 });
    }
    if (!next.publish.confirm && next.publish.enabled && !next.publish.authorization?.statement?.trim()) throw new Error("\u514D\u53D1\u5E03\u786E\u8BA4\u9700\u8981\u586B\u5199\u672C\u6B21\u6388\u6743\u539F\u6587\u548C\u660E\u786E\u7684\u5E73\u53F0\u3001\u8D26\u53F7\u3002");
    if (seed && seed.state.status !== "draft") {
      for (const entry of files) {
        const result = await client.upload(seed.state.id, entry, void 0, true);
        next.sources.push(result.descriptor);
      }
      await client.call("tasks.revise", {
        id: seed.state.id,
        brief: { ...next, writingStyleId: brief.writingStyleId || "" },
        newRequirement: true,
        refreshWriting
      });
      onCreated(seed.state.id);
      return;
    }
    let id = draftId.current;
    if (!id) {
      const task = await client.call("tasks.create", { brief: next, draft: !start, sessionId });
      id = task.state.id;
      draftId.current = id;
    } else await client.call("tasks.draft", { id, brief: next });
    for (let i = 0; i < files.length; i++) {
      const entry = files[i], key = `${entry.file.name}:${entry.file.lastModified}:${entry.file.size}:${i}`;
      if (uploaded.current.has(key)) continue;
      const imported = await client.upload(id, { ...entry, onProgress: (progress) => setFiles((items) => items.map((item) => item.file === entry.file ? { ...item, progress } : item)) });
      next.sources.push(imported.descriptor);
      setBrief((b) => ({ ...b, sources: [...new Map([...b.sources, imported.descriptor].map((x) => [x.id, x])).values()] }));
      uploaded.current.add(key);
    }
    if (start) await client.call("tasks.start", { id, approveBrief: true });
    await draftStore(draftKey, null);
    onCreated(id);
  });
  const revising = seed && seed.state.status !== "draft";
  return /* @__PURE__ */ import_react10.default.createElement("form", { className: "mw-create mw-compose", noValidate: true, onSubmit: (e) => {
    e.preventDefault();
    submit(true);
  } }, /* @__PURE__ */ import_react10.default.createElement("fieldset", { disabled: !!busy || !restored }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-page-title" }, /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-eyebrow" }, revising ? "\u4FEE\u6539\u4F5C\u54C1" : "\u65B0\u4F5C\u54C1"), /* @__PURE__ */ import_react10.default.createElement("h2", null, revising ? "\u4FEE\u6539\u5236\u4F5C\u8BF4\u660E" : "\u60F3\u505A\u4EC0\u4E48\uFF1F"))), /* @__PURE__ */ import_react10.default.createElement("section", { className: "mw-panel mw-brief-composer", "aria-label": "\u5FEB\u6377\u5236\u4F5C" }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u5236\u4F5C\u8BF4\u660E" }, /* @__PURE__ */ import_react10.default.createElement("textarea", { className: "mw-field mw-writing-input", rows: 4, maxLength: 3e4, value: brief.description, onChange: (e) => set("description", e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u7ED9\u521A\u5165\u95E8\u7684\u4EBA\u8BB2\u6E05\u8FD9\u4E2A\u5DE5\u5177\u600E\u4E48\u7528\uFF0C\u53E3\u543B\u8F7B\u677E\u4E00\u70B9\u3002" })), /* @__PURE__ */ import_react10.default.createElement(
    WorkChoices,
    {
      client,
      visible,
      type: workType(brief),
      styleId: brief.writingStyleId,
      savedStyle: seed?.brief.writing?.style,
      revising: !!revising,
      keepOriginal: !!revising && !seed.brief.writingStyleId && !refreshWriting,
      onType: changeType,
      onStyle: (value) => set("writingStyleId", value)
    }
  ), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row mw-compose-actions" }, /* @__PURE__ */ import_react10.default.createElement("label", { className: "mw-button mw-quiet mw-file-pick" }, /* @__PURE__ */ import_react10.default.createElement(AttachmentIcon, null), "\u6DFB\u52A0\u7D20\u6750", /* @__PURE__ */ import_react10.default.createElement("input", { type: "file", multiple: true, onChange: (e) => {
    try {
      addFiles(e.target.files, "source");
    } catch (error) {
      perform("file-error", () => Promise.reject(error));
    }
    e.target.value = "";
  } })), !(seed && seed.state.status !== "draft") && /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: () => submit(false) }, "\u4FDD\u5B58\u8349\u7A3F"), /* @__PURE__ */ import_react10.default.createElement("button", { className: "mw-button mw-primary", type: "submit" }, revising ? "\u4FDD\u5B58\u5E76\u7EE7\u7EED" : "\u5F00\u59CB\u5236\u4F5C")), files.map((entry, index) => /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-file-row", key: index }, /* @__PURE__ */ import_react10.default.createElement("span", null, entry.file.name, " ", /* @__PURE__ */ import_react10.default.createElement("small", null, bytes(entry.file.size), entry.progress ? ` \xB7 \u5DF2\u4E0A\u4F20 ${Math.round(entry.progress.uploaded / entry.progress.total * 100)}%` : "")), /* @__PURE__ */ import_react10.default.createElement("details", null, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u7D20\u6750\u7528\u9014"), /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", "aria-label": `${entry.file.name} \u7528\u9014`, value: entry.role, onChange: (e) => setFiles((all) => all.map((f, i) => i === index ? { ...f, role: e.target.value } : f)) }, Object.entries(ROLES).map(([key, label]) => /* @__PURE__ */ import_react10.default.createElement("option", { value: key, key }, label)))), /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, "aria-label": `\u79FB\u9664 ${entry.file.name}`, onClick: () => setFiles((items) => items.filter((_, i) => i !== index)) }, "\xD7")))), /* @__PURE__ */ import_react10.default.createElement("details", { className: "mw-create-advanced" }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u9AD8\u7EA7\u8BBE\u7F6E"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid mw-section" }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u4EFB\u52A1\u540D\u79F0" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", required: true, value: brief.title, onChange: (e) => set("title", e.target.value) })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u7D20\u6750\u6838\u5BF9\u7B56\u7565" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.style, onChange: (e) => set("style", e.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "news" }, "\u539F\u6587 \xB7 \u4E8B\u5B9E\u4E0E\u65F6\u6548"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "product" }, "\u4EA7\u54C1\u7D20\u6750 \xB7 \u771F\u5B9E\u4EA7\u54C1\u4E0E\u54C1\u724C"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "original" }, "\u539F\u521B / \u751F\u6D3B \xB7 \u7528\u6237\u63D0\u4F9B\u7684\u7ECF\u5386\u4E0E\u7D20\u6750")))), revising && /* @__PURE__ */ import_react10.default.createElement("label", { className: "mw-check" }, /* @__PURE__ */ import_react10.default.createElement("input", { type: "checkbox", checked: refreshWriting, onChange: (e) => setRefreshWriting(e.target.checked) }), /* @__PURE__ */ import_react10.default.createElement("span", null, "\u91CD\u65B0\u8BFB\u53D6\u6240\u9009\u98CE\u683C\u548C\u5DF2\u786E\u8BA4\u89C4\u5219")), /* @__PURE__ */ import_react10.default.createElement("details", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u8865\u5145\u53D7\u4F17\u3001\u65F6\u95F4\u4E0E\u9A8C\u6536\u8981\u6C42"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 15 } }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u53D7\u4F17" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: brief.audience, onChange: (e) => set("audience", e.target.value) })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u8D44\u8BAF\u622A\u6B62\u65F6\u95F4\uFF08\u6309\u6765\u6E90\u586B\u5199\uFF09" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: brief.asOf, onChange: (e) => set("asOf", e.target.value), placeholder: "\u4F8B\u5982 2026-10-23 18:00 Asia/Shanghai" })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u5FC5\u987B\u6EE1\u8DB3\u7684\u5185\u5BB9\u4E0E\u9A8C\u6536\u8981\u6C42", full: true }, /* @__PURE__ */ import_react10.default.createElement("textarea", { className: "mw-field", value: brief.requirements, onChange: (e) => set("requirements", e.target.value) })))), /* @__PURE__ */ import_react10.default.createElement("details", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u8868\u8FBE\u65B9\u5F0F\u4E0E\u753B\u9762\u53C2\u8003"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid" }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u8868\u8FBE\u65B9\u5F0F" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.creative?.expression || "auto", onChange: (e) => group("creative", "expression", e.target.value) }, EXPRESSIONS.map((row) => /* @__PURE__ */ import_react10.default.createElement("option", { key: row.id, value: row.id }, row.label)), brief.creative?.expression && !EXPRESSIONS.some((row) => row.id === brief.creative.expression) && /* @__PURE__ */ import_react10.default.createElement("option", { value: brief.creative.expression }, brief.creative.expression))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u753B\u9762\u53C2\u8003" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.creative?.visualStyle || "auto", onChange: (e) => group("creative", "visualStyle", e.target.value) }, VISUAL_STYLES.map((row) => /* @__PURE__ */ import_react10.default.createElement("option", { key: row.id, value: row.id }, row.label)), brief.creative?.visualStyle && !VISUAL_STYLES.some((row) => row.id === brief.creative.visualStyle) && /* @__PURE__ */ import_react10.default.createElement("option", { value: brief.creative.visualStyle }, brief.creative.visualStyle))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u8BED\u6C14" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: brief.creative?.tone || "", onChange: (e) => group("creative", "tone", e.target.value), placeholder: "\u4F8B\u5982\uFF1A\u5E73\u5B9E\u3001\u6E29\u6696\u3001\u8F7B\u677E\u3001\u4E25\u8C28" })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u53C2\u8003\u65B9\u5411" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: brief.creative?.reference || "", onChange: (e) => group("creative", "reference", e.target.value), placeholder: "\u63CF\u8FF0\u559C\u6B22\u7684\u8868\u8FBE\u4E0E\u89C6\u89C9\uFF0C\u4E0D\u5FC5\u5957\u56FA\u5B9A\u6A21\u677F" })))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("h3", null, "\u8D44\u6599\u4E0E\u7D20\u6750"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid" }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u6765\u6E90\u94FE\u63A5\uFF0C\u4E00\u884C\u4E00\u4E2A" }, /* @__PURE__ */ import_react10.default.createElement("textarea", { className: "mw-field", value: sourceUrl, onChange: (e) => setSourceUrl(e.target.value), placeholder: "https://\u2026" })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u539F\u59CB\u6B63\u6587\u6216\u8F6C\u5F55" }, /* @__PURE__ */ import_react10.default.createElement("textarea", { className: "mw-field", value: sourceText, onChange: (e) => setSourceText(e.target.value), placeholder: "\u4FDD\u7559\u65E5\u671F\u3001\u6570\u5B57\u5355\u4F4D\u548C\u5F15\u8FF0\u4E0A\u4E0B\u6587\u3002" }))), brief.sources.map((s) => /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-upload mw-row mw-between", key: s.id }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-grow" }, /* @__PURE__ */ import_react10.default.createElement("strong", null, s.name || s.id), /* @__PURE__ */ import_react10.default.createElement("small", { className: "mw-label" }, ROLES[s.role], " \xB7 ", s.url || s.path || "\u539F\u59CB\u6B63\u6587")), /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: () => set("sources", brief.sources.filter((x) => x.id !== s.id)) }, "\u79FB\u9664"))), brief.style === "product" && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 15 } }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u54C1\u724C\u4E3B\u8272" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", type: "color", value: brief.brand.primary, onChange: (e) => group("brand", "primary", e.target.value) })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "Logo/\u914D\u8272\u51FA\u5904" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: brief.brand.attribution, onChange: (e) => group("brand", "attribution", e.target.value), placeholder: "\u5B98\u7F51\u3001\u4EE3\u7801\u6587\u4EF6\u6216\u54C1\u724C\u8D44\u6599" })))), /* @__PURE__ */ import_react10.default.createElement("details", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u4EA4\u4ED8\u89C4\u683C"), workType(brief) === "video" ? /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid mw-section" }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u4EA4\u4ED8\u65B9\u5411" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.output.width === 1920 && brief.output.height === 1080 ? "landscape" : brief.output.width === 1080 && brief.output.height === 1920 ? "portrait" : "custom", onChange: (e) => {
    if (e.target.value !== "custom") set("output", { ...brief.output, width: e.target.value === "landscape" ? 1920 : 1080, height: e.target.value === "landscape" ? 1080 : 1920 });
  } }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "landscape" }, "\u6A2A\u7248 \xB7 1920 \xD7 1080"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "portrait" }, "\u7AD6\u7248 \xB7 1080 \xD7 1920"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "custom" }, "\u81EA\u5B9A\u4E49\u5C3A\u5BF8 \xB7 \u89C1\u9AD8\u7EA7\u53C2\u6570"))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u76EE\u6807\u65F6\u957F\uFF08\u79D2\uFF0C\u5B9E\u9645\u65F6\u957F\u4EE5\u914D\u97F3\u4E0E\u955C\u5934\u4E3A\u51C6\uFF09" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", type: "number", min: "1", max: "3600", value: brief.output.durationSeconds, onChange: (e) => group("output", "durationSeconds", Number(e.target.value)) })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u914D\u97F3\u65B9\u5F0F" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.voice.mode, onChange: (e) => group("voice", "mode", e.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "tts" }, "\u5728\u7EBF\u8BED\u97F3\u5408\u6210"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "provided" }, "\u7528\u6237\u5F55\u97F3\u4E0E\u5B9E\u9645\u5BF9\u9F50\u65F6\u95F4\u8F74"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "none" }, "\u65E0\u65C1\u767D"))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u914D\u97F3\u670D\u52A1" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.voice.provider || "", onChange: (e) => setBrief((b) => {
    const provider = e.target.value, voice = provider === "mimo" ? settings.mimoVoice || "\u51B0\u7CD6" : provider === "edge" ? settings.defaultVoice || "zh-CN-XiaoxiaoNeural" : b.voice.voice;
    return { ...b, voice: { ...b.voice, provider, voice, requiredAlignment: provider === "mimo" ? "sentence" : b.voice.requiredAlignment } };
  }) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "" }, "\u8DDF\u968F\u8BBE\u7F6E \xB7 ", settings.ttsProvider === "mimo" ? "MiMo \u8BED\u97F3" : "edge-tts"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "edge" }, "edge-tts \xB7 \u514D\u8D39\u8BCD\u7EA7\u65F6\u95F4\u7801"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "mimo" }, "MiMo \u8BED\u97F3 \xB7 \u5C0F\u7C73"))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u97F3\u8272" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", list: "mw-voice-options", value: brief.voice.voice, onChange: (e) => group("voice", "voice", e.target.value) }), /* @__PURE__ */ import_react10.default.createElement("datalist", { id: "mw-voice-options" }, [...["zh-CN-XiaoxiaoNeural", "zh-CN-YunxiNeural", "zh-CN-YunyangNeural"], ...["\u51B0\u7CD6", "\u8309\u8389", "\u82CF\u6253", "\u767D\u6866", "Mia", "Chloe", "Milo", "Dean"]].map((v) => /* @__PURE__ */ import_react10.default.createElement("option", { key: v, value: v })))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u753B\u9762\u540E\u7AEF" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.render.backend, onChange: (e) => group("render", "backend", e.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "ffmpeg" }, rendererCapabilities("ffmpeg").label), /* @__PURE__ */ import_react10.default.createElement("option", { value: "huashu" }, rendererCapabilities("huashu").label))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u7F16\u7801\u65B9\u5F0F" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.render.codec, onChange: (e) => group("render", "codec", e.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "libx264" }, "CPU \xB7 H.264"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "h264_nvenc" }, "NVENC \xB7 \u9700\u8981\u5B9E\u9645\u8BBE\u5907\u652F\u6301")))), brief.render.backend === "huashu" && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("h3", null, "\u753B\u9762\u6A21\u677F"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u6A21\u677F\u51B3\u5B9A\u6574\u7247\u7684\u955C\u5934\u8BED\u8A00\u4E0E\u753B\u9762\u7ED3\u6784\uFF0C\u4E0D\u53EA\u662F\u914D\u8272\u3002\u9009\u597D\u540E\u5DE5\u4F5C\u53F0\u4F1A\u6309\u5B83\u7EC4\u7EC7\u5185\u5BB9\u3002"), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u6A21\u677F\u98CE\u683C" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.render.template || "blank", onChange: (e) => group("render", "template", e.target.value) }, HUASHU_TEMPLATES.map((t2) => /* @__PURE__ */ import_react10.default.createElement("option", { key: t2.id, value: t2.id }, t2.name, " \xB7 ", t2.bestFor.split("\u3001")[0])))), huashuTemplate(brief.render.template) && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-template-info" }, /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-help" }, huashuTemplate(brief.render.template).summary), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, /* @__PURE__ */ import_react10.default.createElement("strong", null, "\u9002\u5408\uFF1A"), huashuTemplate(brief.render.template).bestFor), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, /* @__PURE__ */ import_react10.default.createElement("strong", null, "\u7ED3\u6784\uFF1A"), { segments: "\u6309\u8981\u70B9\u4E00\u5C4F\u5C55\u5F00\uFF0C\u4E0E\u6587\u7A3F\u5206\u6BB5\u5BF9\u5E94", dataset: "\u6574\u7247\u4E00\u4EFD\u6570\u636E\u56FE\u8868\uFF0C\u4E0D\u5206\u955C", hero: "\u4E00\u652F\u8FDE\u7EED\u955C\u5934\uFF0C\u56F4\u7ED5\u4E00\u4E2A\u4E3B\u89C6\u89C9", talking: "\u4E3A\u4EBA\u50CF\u7D20\u6750\u505A\u5305\u88C5\u5C42\uFF0C\u5143\u7D20\u6309\u8BF4\u8BDD\u7684\u8BCD\u843D\u5B9A" }[huashuTemplate(brief.render.template).shape]), huashuTemplate(brief.render.template).requires.length > 0 && /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-template-req" }, "\u7D20\u6750\u524D\u63D0\uFF1A", huashuTemplate(brief.render.template).requires.join("\uFF1B"), "\u3002\u7F3A\u5C11\u65F6\u6210\u7247\u4F1A\u51FA\u73B0\u5360\u4F4D\uFF0C\u8BF7\u5148\u5907\u9F50\u7D20\u6750\u3002"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, huashuTemplate(brief.render.template).note))), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-help", role: "note" }, brief.render.backend === "huashu" ? "huashu \u540E\u7AEF\u6309\u6240\u9009\u6A21\u677F\u751F\u6210\u53EF\u7F16\u8F91\u5DE5\u7A0B\uFF1B\u6A21\u677F\u4E0D\u652F\u6301\u7684\u8981\u6C42\u4F1A\u5728\u5236\u4F5C\u4E2D\u5982\u5B9E\u8BF4\u660E\uFF0C\u4E0D\u4F1A\u9759\u9ED8\u964D\u7EA7\u3002" : `${rendererCapabilities(brief.render.backend).summary} \u9700\u8981\u7279\u5B9A\u7248\u5F0F\u6216\u590D\u6742\u52A8\u6548\u65F6\uFF0C\u8BF7\u5728\u5BF9\u8BDD\u4E2D\u5148\u786E\u5B9A\u5236\u4F5C\u65B9\u6848\u3002`), /* @__PURE__ */ import_react10.default.createElement("details", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u9AD8\u7EA7\u4EA4\u4ED8\u53C2\u6570"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 14 } }, [["width", "\u753B\u9762\u5BBD\u5EA6", 160, 3840], ["height", "\u753B\u9762\u9AD8\u5EA6", 160, 3840], ["fps", "\u5E27\u7387", 10, 60]].map(([key, label, min, max]) => /* @__PURE__ */ import_react10.default.createElement(Field2, { key, label }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", type: "number", min, max, step: key === "fps" ? "any" : 2, value: brief.output[key], onChange: (e) => group("output", key, Number(e.target.value)) }))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u914D\u97F3\u8BED\u901F" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: brief.voice.rate, onChange: (e) => group("voice", "rate", e.target.value), placeholder: "+0%" })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u914D\u97F3\u98CE\u683C\u6307\u4EE4" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: brief.voice.style || "", onChange: (e) => group("voice", "style", e.target.value), placeholder: "\u4F8B\u5982 \u8BED\u6C14\u4EB2\u5207\u3001\u8BED\u901F\u5E73\u7A33\uFF1BMiMo \u4F1A\u6309\u81EA\u7136\u8BED\u8A00\u7406\u89E3" })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u5B57\u5E55\u5BF9\u9F50\u7CBE\u5EA6" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.voice.requiredAlignment, onChange: (e) => group("voice", "requiredAlignment", e.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "word", disabled: mimo }, "\u5B9E\u9645\u8BCD\u8FB9\u754C", mimo ? "\uFF08MiMo \u65E0\u8BCD\u7EA7\u65F6\u95F4\u7801\uFF09" : ""), /* @__PURE__ */ import_react10.default.createElement("option", { value: "sentence" }, "\u53E5\u7EA7\u8FB9\u754C"))), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u4E1A\u52A1\u65F6\u533A" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: brief.timezone, onChange: (e) => set("timezone", e.target.value), placeholder: "Asia/Shanghai" }))))) : /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("h3", null, workType(brief) === "article" ? "\u6587\u7AE0\u4EA4\u4ED8" : "\u56FE\u6587\u8D34\u56FE\u4EA4\u4ED8"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-help" }, workType(brief) === "article" ? "\u8F93\u51FA\u53EF\u9605\u8BFB HTML\u3001\u5B8C\u6574 Markdown \u548C\u53EF\u7F16\u8F91\u6392\u7248\u5DE5\u7A0B\u3002" : "\u8F93\u51FA\u6709\u5E8F PNG\u3001\u914D\u6587\u3001HTML \u9605\u8BFB\u9884\u89C8\u548C\u53EF\u7F16\u8F91\u9875\u9762\u3002\u5BFC\u51FA\u4F7F\u7528\u672C\u673A Chrome\u3002"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid" }, [["width", "\u6392\u7248\u5BBD\u5EA6"], ...workType(brief) === "image-post" ? [["height", "\u6BCF\u5F20\u56FE\u7247\u9AD8\u5EA6"]] : []].map(([key, label]) => /* @__PURE__ */ import_react10.default.createElement(Field2, { label, key }, /* @__PURE__ */ import_react10.default.createElement("input", { type: "number", className: "mw-field", min: "160", max: "3840", step: "2", value: brief.output[key], onChange: (e) => group("output", key, Number(e.target.value)) })))))), /* @__PURE__ */ import_react10.default.createElement("details", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("summary", null, "\u8BC4\u5BA1\u4E0E\u53D1\u5E03"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("h3", null, "\u672C\u4EFB\u52A1\u7684\u8BC4\u5BA1\u65B9\u5F0F"), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-choice-grid" }, [["none", "\u4E0D\u505A\u9636\u6BB5\u8BC4\u5BA1", "\u81EA\u52A8\u5236\u4F5C\uFF1B\u53D1\u5E03\u6388\u6743\u5355\u72EC\u58F0\u660E\u3002"], ["gates", "\u6807\u51C6 \xB7 \u63A8\u8350", workType(brief) === "video" ? "\u9700\u6C42\u3001\u5206\u955C\u3001\u6210\u7247\u3001\u53D1\u5E03\u56DB\u5173\u3002" : "\u9700\u6C42\u3001\u7F16\u6392\u3001\u6B63\u5F0F\u4EA4\u4ED8\u3001\u53D1\u5E03\u56DB\u5173\u3002"], ["steps", "\u9010\u6B65", `${stepsFor(brief).length} \u4E2A\u9636\u6BB5\u5404\u8BC4\u5BA1\u4E00\u6B21\u3002`]].map(([value, name2, detail]) => /* @__PURE__ */ import_react10.default.createElement("label", { className: "mw-choice", key: value }, /* @__PURE__ */ import_react10.default.createElement("input", { name: "mw-review-mode", type: "radio", value, checked: brief.review.mode === value, onChange: () => set("review", { mode: value }) }), " ", name2, /* @__PURE__ */ import_react10.default.createElement("small", null, detail))))), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-section" }, /* @__PURE__ */ import_react10.default.createElement("h3", null, "\u53D1\u5E03\u8303\u56F4"), /* @__PURE__ */ import_react10.default.createElement("label", { className: "mw-check" }, /* @__PURE__ */ import_react10.default.createElement("input", { type: "checkbox", checked: brief.publish.enabled, onChange: (e) => group("publish", "enabled", e.target.checked) }), /* @__PURE__ */ import_react10.default.createElement("span", null, "\u5236\u4F5C\u5B8C\u6210\u540E\u53D1\u5E03\u5230\u6307\u5B9A\u5E73\u53F0")), brief.publish.enabled && /* @__PURE__ */ import_react10.default.createElement("div", { style: { marginTop: 14 } }, /* @__PURE__ */ import_react10.default.createElement("label", { className: "mw-check" }, /* @__PURE__ */ import_react10.default.createElement("input", { type: "checkbox", checked: brief.publish.confirm, onChange: (e) => group("publish", "confirm", e.target.checked) }), /* @__PURE__ */ import_react10.default.createElement("span", null, "\u53D1\u5E03\u524D\u786E\u8BA4\u6700\u7EC8\u5185\u5BB9\u548C\u8D26\u53F7")), !brief.publish.confirm && /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u672C\u6B21\u660E\u786E\u53D1\u5E03\u6388\u6743\u539F\u6587" }, /* @__PURE__ */ import_react10.default.createElement("textarea", { className: "mw-field", required: true, value: brief.publish.authorization?.statement || "", onChange: (e) => group("publish", "authorization", { explicit: true, statement: e.target.value }), placeholder: "\u660E\u786E\u5141\u8BB8\u53D1\u5E03\u54EA\u4E9B\u5185\u5BB9\uFF0C\u5230\u54EA\u4E9B\u5E73\u53F0\u548C\u8D26\u53F7\u3002" })), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid", style: { marginTop: 14 } }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u6D4F\u89C8\u5668\u6865\u63A5" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: brief.publish.bridgeId, onChange: (e) => group("publish", "bridgeId", e.target.value), placeholder: "\u5728\u8BBE\u7F6E\u4E2D\u53D1\u73B0\u5E76\u9009\u62E9 bridge-\u2026" })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u6D4F\u89C8\u5668\u4E0A\u4E0B\u6587" }, /* @__PURE__ */ import_react10.default.createElement("select", { className: "mw-field", value: brief.publish.browserContext, onChange: (e) => group("publish", "browserContext", e.target.value) }, /* @__PURE__ */ import_react10.default.createElement("option", { value: "regular" }, "\u666E\u901A\u7A97\u53E3"), /* @__PURE__ */ import_react10.default.createElement("option", { value: "incognito" }, "\u65E0\u75D5\u7A97\u53E3 \xB7 \u4EC5\u6309\u660E\u786E\u9700\u6C42")))), brief.publish.targets.map((target, i) => /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-section", style: { marginTop: 15 }, key: i }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-form-grid" }, /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u5E73\u53F0\u6807\u8BC6" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", required: true, value: target.platform, onChange: (e) => group("publish", "targets", brief.publish.targets.map((t2, k) => k === i ? { ...t2, platform: e.target.value } : t2)), placeholder: "\u4F7F\u7528\u5F53\u524D\u6269\u5C55\u8FD4\u56DE\u7684\u5E73\u53F0\u6807\u8BC6" })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u9884\u671F\u8D26\u53F7\u663E\u793A\u540D" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", required: true, value: target.account, onChange: (e) => group("publish", "targets", brief.publish.targets.map((t2, k) => k === i ? { ...t2, account: e.target.value } : t2)) })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u5708\u5B50/\u76EE\u6807\uFF08\u5E73\u53F0\u8981\u6C42\u65F6\u586B\u5199\uFF09" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: target.expectedTarget || "", onChange: (e) => group("publish", "targets", brief.publish.targets.map((t2, k) => k === i ? { ...t2, expectedTarget: e.target.value } : t2)) })), /* @__PURE__ */ import_react10.default.createElement(Field2, { label: "\u5E73\u53F0\u58F0\u660E\uFF08\u6309\u771F\u5B9E\u60C5\u51B5\u586B\u5199\uFF09" }, /* @__PURE__ */ import_react10.default.createElement("input", { className: "mw-field", value: target.extra?.creationStatement || target.extra?.videoMark || "", onChange: (e) => group("publish", "targets", brief.publish.targets.map((t2, k) => k === i ? { ...t2, extra: { [t2.platform === "zhihu" ? "videoMark" : "creationStatement"]: e.target.value } } : t2)) }))), /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: () => group("publish", "targets", brief.publish.targets.filter((_, k) => k !== i)) }, "\u79FB\u9664\u6B64\u76EE\u6807"))), /* @__PURE__ */ import_react10.default.createElement(Button2, { onClick: () => group("publish", "targets", [...brief.publish.targets, { id: `target-${Date.now()}`, platform: "", account: "", expectedTarget: "", extra: {} }]) }, "\u6DFB\u52A0\u53D1\u5E03\u76EE\u6807")))))));
}
function CompanionHome({ listing, open, onCreate }) {
  return /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-companion-home" }, /* @__PURE__ */ import_react10.default.createElement("span", { className: "mw-eyebrow" }, "\u5F53\u524D\u4F1A\u8BDD"), /* @__PURE__ */ import_react10.default.createElement("h2", null, "\u5A92\u4F53\u4EFB\u52A1"), /* @__PURE__ */ import_react10.default.createElement("p", { className: "mw-muted" }, "\u4E0E\u5BF9\u8BDD\u4E00\u8D77\u63A8\u8FDB\uFF0C\u5728\u8FD9\u91CC\u67E5\u770B\u8FDB\u5EA6\u3001\u8BC4\u5BA1\u548C\u4EA7\u7269\u3002"), listing.tasks.length ? /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement("h3", null, "\u9009\u62E9\u8981\u8DDF\u8FDB\u7684\u4EFB\u52A1"), listing.tasks.map((t2) => /* @__PURE__ */ import_react10.default.createElement("button", { className: "mw-companion-pick", key: t2.id, onClick: () => open(t2.id) }, /* @__PURE__ */ import_react10.default.createElement("strong", null, t2.title), /* @__PURE__ */ import_react10.default.createElement("span", null, t2.archivedAt ? "\u5DF2\u5F52\u6863" : LABELS[t2.status], " \xB7 ", nextAction(t2).title, " \u2192")))) : /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-welcome" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-welcome-symbol" }, "\uFF0B"), /* @__PURE__ */ import_react10.default.createElement("h3", null, "\u8FD8\u6CA1\u6709\u5173\u8054\u7684\u4EFB\u52A1"), /* @__PURE__ */ import_react10.default.createElement("p", null, "\u5728\u5BF9\u8BDD\u4E2D\u63D0\u51FA\u5236\u4F5C\u9700\u6C42\uFF0C\u6216\u5728\u8FD9\u91CC\u65B0\u5EFA\u5A92\u4F53\u4EFB\u52A1\u3002")), /* @__PURE__ */ import_react10.default.createElement(Button2, { primary: true, onClick: onCreate }, "\u65B0\u5EFA\u5A92\u4F53\u4EFB\u52A1"));
}
function App({ client, mode = "workspace", sessionId = null, onExpand, onCompanion }) {
  const defaultPage = mode === "workspace" ? "home" : mode === "settings" ? "settings" : "tasks";
  const [initialView] = (0, import_react10.useState)(() => {
    if (mode === "settings") return { page: defaultPage };
    const saved = mode === "workspace" ? client.getWorkspaceView?.() : null;
    if (saved) return saved;
    const id = client.getSelected?.(mode === "companion" ? sessionId : null);
    if (id && (mode === "companion" || client.getWorkspaceTask?.() === id)) return { page: "workbench", taskId: id };
    return { page: defaultPage };
  });
  const [page, setPage] = (0, import_react10.useState)(initialView.page), [bootstrap, setBootstrap] = (0, import_react10.useState)(null), [task, setTask] = (0, import_react10.useState)(null), [selected, setSelected] = (0, import_react10.useState)(initialView.taskId || null), [listing, setListing] = (0, import_react10.useState)({ tasks: [], total: 0 }), [offset, setOffset] = (0, import_react10.useState)(0), [query, setQuery] = (0, import_react10.useState)(""), [group, setGroup] = (0, import_react10.useState)(initialView.group || ""), [status, setStatus] = (0, import_react10.useState)(""), [busy, setBusy] = (0, import_react10.useState)(""), [error, setError] = (0, import_react10.useState)(null), [notice, setNotice] = (0, import_react10.useState)(""), [seed, setSeed] = (0, import_react10.useState)(null), [generation, setGeneration] = (0, import_react10.useState)(0), [createVisited, setCreateVisited] = (0, import_react10.useState)(false);
  const [resumeEditId, setResumeEditId] = (0, import_react10.useState)(initialView.page === "create" ? initialView.taskId : null);
  const mounted = (0, import_react10.useRef)(true), sequence = (0, import_react10.useRef)(0), runningAction = (0, import_react10.useRef)(false), restoredSelection = (0, import_react10.useRef)(initialView.taskId || null);
  (0, import_react10.useEffect)(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      sequence.current++;
    };
  }, []);
  (0, import_react10.useEffect)(() => {
    if (page === "create") setCreateVisited(true);
  }, [page]);
  const refresh = (0, import_react10.useCallback)(() => setGeneration((v) => v + 1), []);
  (0, import_react10.useEffect)(() => client.subscribe((event) => {
    if (event?.type === "storage") {
      restoredSelection.current = null;
      setResumeEditId(null);
      setTask(null);
      setSelected(null);
      setListing({ tasks: [], total: 0 });
      setBootstrap(null);
      setPage(defaultPage);
      setGroup("");
      setStatus("");
      setQuery("");
      setOffset(0);
      setSeed(null);
      setCreateVisited(false);
    }
    if (event?.type === "navigation" && mode === "workspace") {
      setResumeEditId(null);
      setSeed(null);
      setPage(event.page);
      if (event.taskId) setSelected(event.taskId);
    }
    if (event?.type === "selection" && event.scope === (mode === "companion" ? sessionId : null)) {
      setSelected(event.id);
      setPage("workbench");
    }
    refresh();
  }), [client, refresh, mode, sessionId, defaultPage]);
  (0, import_react10.useEffect)(() => {
    const c = new AbortController();
    client.call("settings.get", {}, c.signal).then((data) => {
      if (!c.signal.aborted) setBootstrap(data);
    }).catch((e) => {
      if (!c.signal.aborted) setError(e);
    });
    return () => c.abort();
  }, [client, generation]);
  (0, import_react10.useEffect)(() => {
    const home = mode === "workspace" && page === "home";
    if (!home && page !== "tasks" && mode !== "companion") return;
    const c = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending || document.visibilityState === "hidden" || c.signal.aborted) return;
      pending = true;
      try {
        const data = await client.call("tasks.list", home ? { limit: 0 } : { sessionId: mode === "companion" ? sessionId : void 0, includeUnbound: true, group: group || void 0, status: status || void 0, query, offset, limit: 30 }, c.signal);
        if (c.signal.aborted) return;
        if (bootstrap?.storage?.root && data.root !== bootstrap.storage.root) client.storageChanged?.();
        else if (home) setListing((current) => ({ ...current, summary: data.summary }));
        else setListing(data);
      } catch (e) {
        if (!c.signal.aborted) setError(e);
      } finally {
        pending = false;
      }
    };
    const initial = setTimeout(load, !home && query ? 200 : 0), timer = setInterval(load, home ? 1e4 : 1600);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
      c.abort();
    };
  }, [client, mode, sessionId, group, status, query, offset, generation, page, bootstrap?.storage?.root]);
  (0, import_react10.useEffect)(() => {
    if (mode === "companion" && !selected && sessionId) {
      const own = listing.tasks.find((t2) => t2.sessionId === sessionId && !t2.archivedAt);
      if (own) {
        client.select?.(own.id, sessionId);
        setSelected(own.id);
      }
    }
  }, [listing, mode, selected, sessionId]);
  const needsTask = mode !== "workspace" || page === "workbench" || page === "create" && !!resumeEditId;
  (0, import_react10.useEffect)(() => {
    if (!selected || !needsTask) return;
    const controller = new AbortController();
    let pending = false;
    const forgetRestoredTask = () => {
      restoredSelection.current = null;
      client.deselect?.(mode === "companion" ? sessionId : null);
      setResumeEditId(null);
      setSelected(null);
      setTask(null);
      setPage(defaultPage);
    };
    const load = async () => {
      if (pending || document.visibilityState === "hidden" || controller.signal.aborted) return;
      pending = true;
      try {
        const value = await client.call("tasks.get", { id: selected }, controller.signal);
        if (controller.signal.aborted) return;
        if (value.state.archivedAt && restoredSelection.current === selected) {
          forgetRestoredTask();
          return;
        }
        setTask((old) => old?.state.id === value.state.id && old.state.revision > value.state.revision ? old : value);
        if (resumeEditId === selected) {
          setSeed(value);
          setResumeEditId(null);
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        if (e.code === "not-found" && restoredSelection.current === selected) {
          forgetRestoredTask();
          return;
        }
        setError(e);
      } finally {
        pending = false;
      }
    };
    load();
    const timer = setInterval(load, 1600);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
      controller.abort();
    };
  }, [client, mode, sessionId, selected, generation, defaultPage, resumeEditId, needsTask]);
  (0, import_react10.useEffect)(() => {
    if (mode !== "workspace") return;
    if (page === "workbench") {
      const archived = task?.state.id === selected && task.state.archivedAt;
      client.rememberWorkspaceView?.(selected && !archived ? "workbench" : defaultPage, selected && !archived ? selected : null, "");
    } else {
      client.rememberWorkspaceView?.(page, page === "create" ? seed?.state.id || resumeEditId : null, page === "tasks" ? group : "");
    }
  }, [client, mode, page, selected, task?.state.id, task?.state.archivedAt, defaultPage, seed?.state.id, resumeEditId, group]);
  const perform = (0, import_react10.useCallback)(async (name2, fn) => {
    if (runningAction.current) return;
    runningAction.current = true;
    const current = ++sequence.current;
    setBusy(name2);
    setError(null);
    setNotice("");
    try {
      await fn();
      if (mounted.current && current === sequence.current) {
        refresh();
        setNotice(name2 === "settings-save" ? "" : "\u64CD\u4F5C\u5DF2\u8BB0\u5F55\u3002");
      }
    } catch (e) {
      if (mounted.current && current === sequence.current) setError(e);
    } finally {
      runningAction.current = false;
      if (mounted.current && current === sequence.current) setBusy("");
    }
  }, [refresh]);
  const archive = (target, archived) => {
    const id = target?.state?.id ?? target?.id;
    if (!id) return;
    const scope = mode === "companion" ? sessionId : null;
    return perform(archived ? "archive" : "unarchive", async () => {
      await client.call("tasks.archive", { id, archived });
      if (archived && client.getSelected?.(scope) === id) {
        restoredSelection.current = null;
        client.deselect?.(scope);
      }
      refresh();
    });
  };
  const open = (id) => {
    restoredSelection.current = null;
    client.select?.(id, mode === "companion" ? sessionId : null);
    if (mode === "companion" && sessionId) client.call("tasks.bind", { id, sessionId }).catch(setError);
    setTask((old) => old?.state.id === id ? old : null);
    setSelected(id);
    setPage("workbench");
    setError(null);
  };
  const startWork = (ideaId, type, options) => perform("idea-work", async () => {
    const { id } = await client.call("ideas.start-work", { id: ideaId, type, ...options });
    open(id);
  });
  const showPage = (destination) => {
    setPage(destination);
    setError(null);
  };
  const showTasks = (group2) => {
    setGroup(group2);
    setStatus("");
    setQuery("");
    setOffset(0);
    showPage("tasks");
  };
  const edit = (task2) => {
    setResumeEditId(null);
    setSeed(task2);
    setPage("create");
  };
  const create = () => {
    setResumeEditId(null);
    setSeed(null);
    setPage("create");
  };
  const finishCreate = (id) => {
    setCreateVisited(false);
    refresh();
    open(id);
  };
  const expand = (destination) => {
    if (selected) client.select?.(selected, null);
    client.navigate?.(destination || "workbench");
    onExpand?.();
  };
  if (!bootstrap) return /* @__PURE__ */ import_react10.default.createElement("section", { className: "mw", "data-mode": mode }, /* @__PURE__ */ import_react10.default.createElement("style", null, CSS), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-content" }, /* @__PURE__ */ import_react10.default.createElement(ErrorText, { error }), /* @__PURE__ */ import_react10.default.createElement("p", null, "\u6B63\u5728\u8FDE\u63A5\u5A92\u4F53\u5DE5\u4F5C\u6D41\u2026"), error && /* @__PURE__ */ import_react10.default.createElement(Button2, { onClick: refresh }, "\u91CD\u65B0\u8FDE\u63A5")));
  if (mode === "companion") return /* @__PURE__ */ import_react10.default.createElement("section", { className: "mw", "data-mode": mode, "aria-label": "\u5A92\u4F53\u4EFB\u52A1" }, /* @__PURE__ */ import_react10.default.createElement("style", null, CSS), /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-companion-header" }, /* @__PURE__ */ import_react10.default.createElement("strong", null, "\u5A92\u4F53\u4EFB\u52A1"), /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: () => expand(page === "tasks" ? "tasks" : "workbench") }, "\u5C55\u5F00 \u2197")), /* @__PURE__ */ import_react10.default.createElement("main", { className: "mw-content" }, /* @__PURE__ */ import_react10.default.createElement(ErrorText, { error }), notice && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-announcement", role: "status" }, notice), page !== "tasks" && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-breadcrumb" }, /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: () => setPage("tasks") }, "\u2190 \u8FD4\u56DE\u4EFB\u52A1"), /* @__PURE__ */ import_react10.default.createElement("span", null, "/ ", page === "create" ? "\u7F16\u8F91\u9700\u6C42" : "\u4EFB\u52A1\u8BE6\u60C5")), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "tasks" }, /* @__PURE__ */ import_react10.default.createElement(CompanionHome, { listing, open, onCreate: create })), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "workbench" }, task ? /* @__PURE__ */ import_react10.default.createElement(Workbench, { key: task.state.id, client, task, busy, perform, refresh, onEdit: edit, onArchive: archive }) : selected ? /* @__PURE__ */ import_react10.default.createElement("p", null, "\u6B63\u5728\u8BFB\u53D6\u4EFB\u52A1\u2026") : /* @__PURE__ */ import_react10.default.createElement(Empty, { title: "\u9009\u62E9\u8981\u7EE7\u7EED\u7684\u4EFB\u52A1", action: /* @__PURE__ */ import_react10.default.createElement(Button2, { onClick: () => setPage("tasks") }, "\u67E5\u770B\u4EFB\u52A1") }, "\u5728\u53F3\u4FA7\u7EE7\u7EED\u67E5\u770B\u5236\u4F5C\u8FDB\u5EA6\u4E0E\u4EA7\u7269\u3002")), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "create" }, (page === "create" || createVisited) && /* @__PURE__ */ import_react10.default.createElement(CreateTask, { key: `${bootstrap.storage?.root}:${seed?.state.id || "new-task"}`, client, settings: bootstrap.value, storageRoot: bootstrap.storage?.root, seed, sessionId, onCreated: finishCreate, busy, visible: page === "create", perform }))));
  return /* @__PURE__ */ import_react10.default.createElement("section", { className: "mw", "data-mode": mode, "aria-label": "\u5A92\u4F53\u5DE5\u4F5C\u53F0" }, /* @__PURE__ */ import_react10.default.createElement("style", null, CSS), mode !== "settings" && /* @__PURE__ */ import_react10.default.createElement("header", { className: "mw-header" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row mw-between" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-row" }, /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-brand-mark", "aria-hidden": "true" }, /* @__PURE__ */ import_react10.default.createElement("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ import_react10.default.createElement("rect", { x: "3", y: "5", width: "18", height: "14", rx: "3" }), /* @__PURE__ */ import_react10.default.createElement("path", { d: "m10 9 5 3-5 3Z" }))), /* @__PURE__ */ import_react10.default.createElement("h2", null, "\u5A92\u4F53\u5DE5\u4F5C\u53F0")), /* @__PURE__ */ import_react10.default.createElement("nav", { className: "mw-row mw-nav", "aria-label": "\u5A92\u4F53\u5DE5\u4F5C\u6D41\u5BFC\u822A" }, /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", "aria-selected": page === "home", onClick: () => showPage("home") }, "\u9996\u9875"), /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", "aria-selected": page === "tasks", onClick: () => {
    setPage("tasks");
    setError(null);
  } }, "\u4EFB\u52A1"), /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", "aria-selected": page === "create", onClick: create }, "\u65B0\u5EFA"), /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", "aria-selected": page === "ideas", onClick: () => {
    setPage("ideas");
    setError(null);
  } }, "\u7075\u611F"), /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", "aria-selected": page === "styles", onClick: () => {
    setPage("styles");
    setError(null);
  } }, "\u98CE\u683C"), /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", "aria-selected": page === "insights", onClick: () => {
    setPage("insights");
    setError(null);
  } }, "\u590D\u76D8"), /* @__PURE__ */ import_react10.default.createElement("button", { type: "button", "aria-selected": page === "settings", onClick: () => {
    setPage("settings");
    setError(null);
  } }, "\u8BBE\u7F6E")))), /* @__PURE__ */ import_react10.default.createElement("main", { className: "mw-content" }, /* @__PURE__ */ import_react10.default.createElement(ErrorText, { error }), notice && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-announcement", role: "status" }, notice), (page === "workbench" || page === "create" && (seed || resumeEditId)) && /* @__PURE__ */ import_react10.default.createElement("div", { className: "mw-breadcrumb" }, /* @__PURE__ */ import_react10.default.createElement(Button2, { quiet: true, onClick: () => setPage("tasks") }, "\u2190 \u8FD4\u56DE\u4EFB\u52A1"), /* @__PURE__ */ import_react10.default.createElement("span", null, "/ ", page === "workbench" ? "\u4EFB\u52A1\u8BE6\u60C5" : "\u7F16\u8F91\u9700\u6C42")), mode === "workspace" && /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "home" }, /* @__PURE__ */ import_react10.default.createElement(
    WorkspaceHome,
    {
      client,
      root: bootstrap.storage?.root,
      visible: page === "home",
      generation,
      summary: listing.summary,
      busy,
      perform,
      onIdeas: () => showPage("ideas"),
      onTasks: showTasks
    }
  )), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "tasks" }, /* @__PURE__ */ import_react10.default.createElement(Overview, { listing, client, storage: bootstrap.storage, query, setQuery, group, setGroup, status, setStatus, offset, setOffset, onOpen: open, onCreate: create, onSettings: () => setPage("settings"), onArchive: archive, busy })), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "workbench" }, task ? /* @__PURE__ */ import_react10.default.createElement(Workbench, { key: task.state.id, client, task, busy, perform, refresh, onEdit: edit, onCompanion, onArchive: archive }) : selected ? /* @__PURE__ */ import_react10.default.createElement("p", null, "\u6B63\u5728\u8BFB\u53D6\u4EFB\u52A1\u2026") : /* @__PURE__ */ import_react10.default.createElement(Empty, { title: "\u9009\u62E9\u8981\u7EE7\u7EED\u7684\u4EFB\u52A1", action: /* @__PURE__ */ import_react10.default.createElement(Button2, { onClick: () => setPage("tasks") }, "\u67E5\u770B\u5168\u90E8\u4EFB\u52A1") }, "\u5236\u4F5C\u8BB0\u5F55\u548C\u4EA7\u7269\u90FD\u4FDD\u5B58\u5728\u4EFB\u52A1\u4E2D\u3002")), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "create" }, resumeEditId ? /* @__PURE__ */ import_react10.default.createElement("p", null, "\u6B63\u5728\u8BFB\u53D6\u5236\u4F5C\u8BF4\u660E\u2026") : mode !== "settings" && (page === "create" || createVisited) && /* @__PURE__ */ import_react10.default.createElement(CreateTask, { key: `${bootstrap.storage?.root}:${seed?.state.id || "new-task"}`, client, settings: bootstrap.value, storageRoot: bootstrap.storage?.root, seed, sessionId, onCreated: finishCreate, busy, visible: page === "create", perform })), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "settings" }, /* @__PURE__ */ import_react10.default.createElement(Settings, { client, bootstrap, busy, perform, onSaved: (value) => setBootstrap((old) => ({ ...old, ...value })) })), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "ideas" }, /* @__PURE__ */ import_react10.default.createElement(IdeaWall, { client, busy, perform, onStartWork: startWork, visible: page === "ideas" })), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "styles" }, /* @__PURE__ */ import_react10.default.createElement(StylePanel, { client, busy, perform })), /* @__PURE__ */ import_react10.default.createElement("div", { hidden: page !== "insights" }, /* @__PURE__ */ import_react10.default.createElement(InsightsPanel, { client, busy, perform }))));
}

// src/index.jsx
var name = "dsh-media-workflow-client";
var inject = ["connection", "slots", "layout", "sidebarRight", "sidebarRightTabs"];
var PANEL_ID = "media-workflow";
var TAB_KIND = "media-workflow";
var TAB_ID = "@dsh/media-workflow";
var Icon = ({ size = 20 }) => /* @__PURE__ */ import_react11.default.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": "true" }, /* @__PURE__ */ import_react11.default.createElement("rect", { x: "3", y: "5", width: "18", height: "14", rx: "3" }), /* @__PURE__ */ import_react11.default.createElement("path", { d: "m10 9 5 3-5 3zM7 2v3m10-3v3M7 19v3m10-3v3" }));
function apply(ctx) {
  ctx.effect(() => {
    const disposers = [];
    const client = createClient(ctx.connection);
    let stopped = false;
    const cleanup = () => {
      if (stopped) return;
      stopped = true;
      for (const stop of disposers.reverse()) {
        try {
          stop?.();
        } catch {
        }
      }
      client.dispose();
    };
    const wrap = (component) => (props) => /* @__PURE__ */ import_react11.default.createElement(Boundary, null, import_react11.default.createElement(component, props));
    const expand = () => ctx.layout.selectPanel(PANEL_ID);
    const openCompanion = async (taskId) => {
      ctx.layout.selectPanel(null);
      const id = taskId || client.getSelected?.(), sessionId = ctx.sidebarRight.mounted.getSnapshot();
      if (id && sessionId) {
        await client.call("tasks.bind", { id, sessionId });
        client.select?.(id, sessionId);
      } else if (id) client.select?.(id);
      ctx.sidebarRight.openTab(TAB_KIND);
    };
    const Main = wrap(() => /* @__PURE__ */ import_react11.default.createElement(App, { client, onCompanion: openCompanion }));
    const Companion = wrap((props) => {
      const sessionId = (0, import_react11.useSyncExternalStore)((listener) => ctx.sidebarRight.mounted.subscribe(listener), () => ctx.sidebarRight.mounted.getSnapshot());
      return /* @__PURE__ */ import_react11.default.createElement(App, { key: props.sessionId ?? sessionId ?? "unbound", client, mode: "companion", sessionId: props.sessionId ?? sessionId ?? null, onExpand: expand });
    });
    const ReviewActions = ({ review }) => {
      const [error, setError] = (0, import_react11.useState)("");
      const match = /^mw-review-([a-f0-9-]{36})-[a-f0-9]{24}$/.exec(review?.id || "");
      if (!match) return null;
      return /* @__PURE__ */ import_react11.default.createElement("span", null, /* @__PURE__ */ import_react11.default.createElement("button", { type: "button", onClick: () => {
        openCompanion(match[1]).catch((e) => setError(e.message));
      } }, "\u67E5\u770B\u4EA7\u7269 / \u63D0\u51FA\u4FEE\u6539"), error && /* @__PURE__ */ import_react11.default.createElement("small", { role: "alert" }, error));
    };
    try {
      disposers.push(ctx.slots.inject("main", () => {
        const unregister = ctx.slots.register({ name: "main", key: PANEL_ID }, Main);
        let stopRemembering;
        try {
          stopRemembering = rememberPanel(ctx.layout, PANEL_ID);
        } catch (error) {
          unregister();
          throw error;
        }
        return () => {
          try {
            stopRemembering?.();
          } finally {
            unregister();
          }
        };
      }));
      disposers.push(ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: PANEL_ID, order: 25, label: () => "\u5A92\u4F53\u5DE5\u4F5C\u53F0" }, Icon)));
      disposers.push(ctx.sidebarRightTabs.register({ id: TAB_ID, kind: TAB_KIND, title: () => "\u5A92\u4F53\u4EFB\u52A1", keepMounted: false, guide: [{ id: "media-workflow", order: 30, title: () => "\u5A92\u4F53\u4EFB\u52A1", description: () => "\u5236\u4F5C\u8FDB\u5EA6\u3001\u8BC4\u5BA1\u548C\u771F\u5B9E\u4EA7\u7269", icon: Icon }] }));
      disposers.push(ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({ name: "sidebar.right.pane.tab", key: TAB_ID }, Companion)));
      disposers.push(ctx.slots.inject("conversation.plan-review.actions", () => ctx.slots.register({ name: "conversation.plan-review.actions", id: TAB_ID, order: 30 }, wrap(ReviewActions))));
      disposers.push(ctx.on("connection/reset", () => client.reset()));
    } catch (error) {
      cleanup();
      ctx.logger?.error?.(`\u5A92\u4F53\u5DE5\u4F5C\u53F0\u6CE8\u518C\u5931\u8D25\uFF1A${error.message}`);
    }
    return cleanup;
  }, "media-workflow: client");
}

return module.exports;}});
