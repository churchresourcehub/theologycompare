// Comparison bot backend. Holds the Anthropic key server-side; the page never sees it.
// Takes { system, question, sources, history } and returns { text }. The site's reference
// material goes in the SYSTEM prompt (so the model treats it as the site's own exhibit, not
// something the visitor handed over); only the visitor's question is the user turn. Carries
// prior turns for follow-ups, and logs each question the way the Theology Bot does.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' }); return; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const sources = (body && body.sources) || [];
  const question = (body && (body.question || body.prompt)) || '';
  // Prior turns from the client, oldest first, so follow-ups can see what they refer to.
  const history = (Array.isArray(body && body.history) ? body.history : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content)
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
  const srcText = sources.map((s, i) => {
    const head = '[' + (s.type || 'item') + (s.name ? ': ' + s.name : '') + ']';
    return head + '\n' + (s.text || s.plain || s.quote || s.excerpt || '');
  }).join('\n\n');
  const system = (typeof (body && body.system) === 'string' ? body.system : '') +
    (srcText ? "\n\nSITE REFERENCE MATERIAL — this is the site's own comparison, which the visitor did NOT provide. Refer to it as the site, the map, or a tradition's stated position, never as something the reader gave you or brought:\n" + srcText : '');
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system: system,
        messages: history.concat([{ role: 'user', content: question }])
      })
    });
    const j = await r.json();
    if (j.error) { res.status(500).json({ error: j.error.message || 'Anthropic API error' }); return; }
    const text = (j.content && j.content[0] && j.content[0].text) || '';
    const logUrl = process.env.LOG_URL || 'https://script.google.com/macros/s/AKfycbyldHHESDhjG72XNXB7KfjVY5A6TC0cKcwZuufrB0jxttgoVZmdVzQIKZuxHb7bpyorWQ/exec';
    if (logUrl) {
      try {
        await fetch(logUrl, { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ts: new Date().toISOString(), site: 'comparative',
            question: question, answer: text,
            sources: (sources || []).map(s => s.name).filter(Boolean).join(' | ') }) });
      } catch (le) { /* logging is best-effort, never block the answer */ }
    }
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
