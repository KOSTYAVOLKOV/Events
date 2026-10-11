// Scriptable home-screen widget. Set API_URL to your deployed Vercel URL + /api/events.
const API_URL = 'https://events-amsterdam-events-starter.vercel.app/api/events';
const req = new Request(API_URL);
req.timeoutInterval = 15;
const widget = new ListWidget();
widget.backgroundColor = new Color('#101010');
widget.setPadding(14, 14, 14, 14);
const title = widget.addText('AMSTERDAM · SOON');
title.font = Font.boldSystemFont(11); title.textColor = new Color('#d4ff59');
widget.addSpacer(8);
try {
  const data = await req.loadJSON();
  const events = (data.events || []).slice(0, 3);
  if (!events.length) { const t=widget.addText('No live events yet'); t.textColor=Color.white(); t.font=Font.systemFont(14); }
  for (let i=0;i<events.length;i++) {
    const e=events[i]; const name=widget.addText(e.title); name.font=Font.semiboldSystemFont(13); name.textColor=Color.white(); name.lineLimit=2;
    const meta=widget.addText([e.date,e.venue].filter(Boolean).join(' · ')); meta.font=Font.systemFont(10); meta.textColor=new Color('#aaaaaa');
    if(i<events.length-1) widget.addSpacer(7);
  }
} catch (_) { const t=widget.addText('Could not load events'); t.textColor=Color.white(); t.font=Font.systemFont(13); }
widget.url = 'https://events-amsterdam-events-starter.vercel.app';
widget.refreshAfterDate = new Date(Date.now()+30*60*1000);
if (config.runsInWidget) Script.setWidget(widget); else await widget.presentMedium();
Script.complete();
