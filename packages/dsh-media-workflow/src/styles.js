export const CSS = `
/* 交互风格吸收自 woniuniuniu/dsh-media-desk（MIT）。颜色优先走 DSH 语义 token，
   宿主无对应 token 时回退到 light-dark() 自带色板，保证独立渲染也不塌。 */
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
.mw [hidden]{display:none!important}.mw .mw-content{padding:28px clamp(18px,3vw,42px)}.mw .mw-eyebrow{display:block;font-size:11px;font-weight:600;letter-spacing:.08em;color:var(--mw-muted);margin-bottom:6px}.mw .mw-page-title{display:flex;justify-content:space-between;gap:20px;align-items:center;margin:0 0 24px}.mw .mw-page-title h2{font-size:27px;letter-spacing:-.03em}.mw .mw-page-title p{margin:6px 0 0}.mw .mw-overview{max-width:1120px;margin:0 auto}.mw .mw-filter-tabs{display:flex;gap:22px;border-bottom:1px solid var(--mw-line);margin-bottom:20px;overflow:auto}.mw .mw-filter-tabs button{display:flex;gap:8px;align-items:center;white-space:nowrap;border:0;border-bottom:2px solid transparent;background:none;padding:11px 0;color:var(--mw-muted);font-size:13px}.mw .mw-filter-tabs button[aria-selected=true]{color:var(--mw-accent);border-bottom-color:var(--mw-accent);font-weight:600}.mw .mw-filter-tabs button span{font-size:11px;border-radius:5px;background:var(--mw-surface);padding:0 6px}.mw .mw-list-tools{display:flex;gap:10px;margin-bottom:18px}.mw .mw-list-tools input{max-width:340px}.mw .mw-list-tools select{width:auto;margin-left:auto;max-width:150px}.mw .mw-task-list{display:grid;gap:12px}.mw .mw-task{display:flex;gap:22px;background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:13px;padding:17px;align-items:stretch}.mw .mw-task-cover{width:125px;min-height:113px;flex:none;position:relative;background:var(--mw-soft);border-radius:9px;display:flex;flex-direction:column;padding:13px 15px;justify-content:space-between;color:var(--mw-accent);overflow:hidden}.mw .mw-task-cover.product{background:var(--mw-good-bg);color:var(--mw-good)}.mw .mw-task-cover>span{font-size:11px;letter-spacing:.12em}.mw .mw-task-cover b{font-size:30px;font-weight:500;letter-spacing:-.04em}.mw .mw-task-cover b small{font-size:11px;color:inherit;margin-left:6px}.mw .mw-task-cover img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.mw .mw-task-main{flex:1;min-width:0}.mw .mw-task h3{font-size:16px;margin:0;overflow-wrap:anywhere}.mw .mw-task-meta{font-size:12px;color:var(--mw-muted);margin:6px 0 10px}.mw .mw-task .mw-progress{max-width:100%;margin:10px 0}.mw .mw-task-next{padding-top:6px;font-size:12px;color:var(--mw-muted)}.mw .mw-task-next .mw-button{padding:5px 11px}.mw .mw-progress{max-width:100%;height:4px}.mw .mw-welcome{padding:52px 20px;text-align:center;border:1px dashed var(--mw-line);border-radius:14px;background:var(--mw-surface);margin:18px 0 26px}.mw .mw-welcome h3{font-size:21px;margin:16px 0 10px}.mw .mw-welcome p{max-width:450px;margin:0 auto 24px;color:var(--mw-muted);font-size:13px}.mw .mw-welcome-symbol{display:grid;place-items:center;margin:auto;width:54px;height:54px;border-radius:16px;background:var(--mw-soft);color:var(--mw-accent);font-size:22px}.mw .mw-onboarding{display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin:25px 0;color:var(--mw-muted);font-size:12px}.mw .mw-onboarding i{font-style:normal;color:var(--mw-line)}.mw .mw-welcome>.mw-button{margin:0 6px}.mw .mw-location-line{display:flex;align-items:center;gap:12px;margin-top:26px;font-size:11px;color:var(--mw-muted);overflow-wrap:anywhere}.mw .mw-location-line>span:first-child{min-width:0}.mw .mw-location-line button{font-size:11px;flex:none}.mw .mw-sync-dot{margin-left:auto;white-space:nowrap}.mw .mw-sync-dot:before{content:'●';font-size:7px;color:var(--mw-good);margin-right:6px}.mw .mw-breadcrumb{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--mw-muted);margin:-5px 0 20px}.mw .mw-breadcrumb button{font-size:12px}.mw .mw-panel{background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:12px;padding:22px;margin-bottom:18px}.mw .mw-panel h3{font-size:15px}.mw .mw-panel summary{cursor:pointer;font-size:13px;font-weight:500}.mw .mw-panel pre{font:12px/1.6 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;max-height:340px;overflow:auto}.mw .mw-settings{max-width:1140px;margin:auto}.mw .mw-settings-layout{display:grid;grid-template-columns:180px minmax(0,1fr);gap:34px;align-items:start}.mw .mw-settings-nav{display:flex;flex-direction:column;gap:5px;position:sticky;top:0}.mw .mw-settings-nav button{background:none;border:0;color:var(--mw-muted);text-align:left;padding:12px 14px;border-radius:9px}.mw .mw-settings-nav button[aria-current=page]{background:var(--mw-soft);color:var(--mw-accent)}.mw .mw-settings-nav strong{display:block;font-size:13px;font-weight:600}.mw .mw-settings-nav small{display:block;font-size:11px;margin-top:3px;color:inherit;opacity:.8}.mw .mw-setting-heading{margin:1px 0 22px}.mw .mw-setting-heading h3{font-size:19px;margin-bottom:6px}.mw .mw-setting-heading p{color:var(--mw-muted);font-size:12px;margin:0}.mw .mw-settings-body{min-width:0}.mw .mw-folder-preview{background:var(--mw-bg);border-radius:8px;padding:15px;margin:16px 0;color:var(--mw-muted);font:12px/1.8 ui-monospace,monospace;overflow-wrap:anywhere}.mw .mw-folder-preview span{display:block}.mw .mw-settings-save{position:sticky;bottom:-28px;display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 0;margin-top:30px;border-top:1px solid var(--mw-line);background:var(--mw-bg);font-size:12px;color:var(--mw-muted);z-index:3}.mw .mw-two{grid-template-columns:1fr 1fr}.mw .mw-connection-list{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.mw .mw-create{max-width:940px;margin:0 auto}.mw .mw-wizard-nav{display:flex;gap:12px;margin:25px 0 30px}.mw .mw-wizard-nav button{display:flex;align-items:center;gap:9px;flex:1;background:none;border:0;border-bottom:2px solid var(--mw-line);color:var(--mw-muted);padding:12px 0;font-size:13px}.mw .mw-wizard-nav button[aria-current=step]{color:var(--mw-accent);border-color:var(--mw-accent)}.mw .mw-wizard-nav span{display:grid;place-items:center;border:1px solid var(--mw-line);border-radius:50%;width:25px;height:25px;flex:none;font-size:11px}.mw .mw-wizard-nav button[aria-current=step] span{background:var(--mw-soft);border-color:var(--mw-accent)}.mw .mw-wizard-footer{display:flex;justify-content:space-between;gap:18px;position:sticky;bottom:-28px;background:var(--mw-bg);padding:18px 0;border-top:1px solid var(--mw-line);margin-top:20px;z-index:2}.mw .mw-confirm-summary{background:var(--mw-soft);border-radius:12px;padding:20px;margin-bottom:25px}.mw .mw-confirm-summary p{font-size:12px;margin:0;color:var(--mw-muted)}.mw .mw-work-top{padding-bottom:22px;border-bottom:1px solid var(--mw-line);margin-bottom:22px}.mw .mw-work-top h2{font-size:25px;letter-spacing:-.02em}.mw .mw-work-grid{gap:26px;grid-template-columns:185px minmax(0,1fr)}.mw .mw-steps{position:sticky;top:0;align-self:start}.mw .mw-stage{background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:13px;padding:22px}.mw .mw-next-action{padding:18px 20px;border-left:3px solid var(--mw-accent);background:var(--mw-soft);border-radius:0 10px 10px 0;margin-bottom:24px}.mw .mw-next-action h3{margin:0 0 4px;font-size:16px}.mw .mw-next-action p{margin:0;font-size:12px;color:var(--mw-muted)}.mw .mw-review{border-color:var(--mw-accent);background:var(--mw-soft)}.mw .mw-companion-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--mw-surface);border-bottom:1px solid var(--mw-line);font-size:13px}.mw .mw-companion h2{font-size:19px;line-height:1.5;margin:12px 0;overflow-wrap:anywhere}.mw .mw-companion .mw-progress{margin:10px 0 22px}.mw .mw-companion .mw-next-action{margin-top:20px;padding:15px}.mw .mw-companion .mw-next-action button{margin-top:13px}.mw .mw-companion .mw-next-action h3{font-size:15px}.mw .mw-companion .mw-review{margin:15px 0 24px;padding:15px}.mw .mw-compact-artifacts{display:grid;gap:8px;margin:8px 0 20px}.mw .mw-compact-artifacts button{display:flex;align-items:center;gap:11px;text-align:left;border:1px solid var(--mw-line);border-radius:9px;background:var(--mw-surface);color:var(--mw-text);padding:11px;min-width:0}.mw .mw-compact-artifacts button>span:nth-child(2){flex:1;min-width:0}.mw .mw-compact-artifacts strong{display:block;font-size:12px;overflow-wrap:anywhere}.mw .mw-compact-artifacts small{display:block;font-size:11px}.mw .mw-file-icon{display:grid;place-items:center;width:30px;height:34px;flex:none;background:var(--mw-soft);border-radius:5px;color:var(--mw-accent)}.mw .mw-companion-footer{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--mw-muted);margin:20px 0}.mw .mw-companion-pick{display:block;width:100%;text-align:left;background:var(--mw-surface);border:1px solid var(--mw-line);border-radius:10px;color:var(--mw-text);padding:14px;margin:10px 0}.mw .mw-companion-pick strong,.mw .mw-companion-pick span{display:block;overflow-wrap:anywhere}.mw .mw-companion-pick span{font-size:12px;color:var(--mw-muted);margin-top:5px}.mw[data-mode=companion] .mw-content{padding:18px}.mw[data-mode=companion] .mw-welcome{padding:30px 15px}.mw[data-mode=companion] .mw-welcome h3{font-size:17px}
@container(max-width:780px){.mw .mw-settings-layout{grid-template-columns:1fr;gap:20px}.mw .mw-settings-nav{flex-direction:row;gap:5px;position:static;overflow:auto;padding-bottom:4px}.mw .mw-settings-nav button{white-space:nowrap;padding:10px 12px}.mw .mw-settings-nav small{display:none}.mw .mw-settings-save{bottom:-18px}.mw .mw-task-cover{width:98px}.mw .mw-task{gap:14px}.mw .mw-panel{padding:18px}.mw .mw-work-grid{grid-template-columns:1fr}.mw .mw-steps{display:none}.mw .mw-step-select{display:block}}
@container(max-width:520px){.mw .mw-page-title h2{font-size:23px}.mw .mw-task{padding:14px;gap:12px}.mw .mw-task-cover{width:62px;min-height:70px;padding:10px;align-self:flex-start}.mw .mw-task-cover b{font-size:23px}.mw .mw-task-cover b small{display:none}.mw .mw-task .mw-row:first-child{align-items:flex-start}.mw .mw-task h3{font-size:14px}.mw .mw-task-next{display:block}.mw .mw-task-next button{margin-top:10px;width:100%}.mw .mw-filter-tabs{gap:18px}.mw .mw-list-tools input{max-width:100%}.mw .mw-list-tools select{max-width:110px;font-size:12px}.mw .mw-location-line{flex-wrap:wrap}.mw .mw-sync-dot{margin-left:0}.mw .mw-settings-save{flex-wrap:wrap;bottom:-14px}.mw .mw-two{grid-template-columns:1fr}.mw .mw-wizard-nav{gap:7px}.mw .mw-wizard-nav button{font-size:11px;gap:6px}.mw .mw-wizard-nav span{width:21px;height:21px}.mw .mw-stage{padding:15px}.mw .mw-work-top h2{font-size:20px}.mw .mw-welcome{padding:30px 15px}.mw .mw-content{padding:18px 14px}}

.mw .mw-announcement{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%)}.mw .mw-next-action>.mw-button{margin-top:12px}
.mw .mw-task.mw-archived{background:var(--mw-bg)}.mw .mw-task.mw-archived .mw-task-cover{opacity:.6}.mw .mw-task.mw-archived h3{color:var(--mw-muted)}.mw .mw-badge.archived{background:var(--mw-bg);color:var(--mw-muted)}


/* 主题和常用控件 */
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

/* 灵感和快速制作 */
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

/* 工作区首页 */
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
