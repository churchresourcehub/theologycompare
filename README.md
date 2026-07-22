# Comparative Theology — site

A standalone, self-contained site that lets a person compare Christian traditions — in
what they believe and in how they branched historically. Sibling to the Theology Bot.
The anchor voice is Wesleyan/Methodist (Woods's positions); every other tradition is
drawn fairly from its own authoritative voice.

## Files
- `index.html` — the whole site. Loads `comparison.json` in the browser. No build step.
- `comparison.json` — the single source of truth (axes, families, doctrines, traditions).
- `api/chat.js` — serverless function holding the Anthropic key; powers the compare bot.
- `vercel.json` — config for the serverless function.

## The five views (all live off `comparison.json`)
1. **Two-axis map** — pick any two spectrums; scatter the traditions. Sacramental vs.
   traditional→progressive is the default.
2. **Spectrum** — one axis at a time, traditions packed along the line.
3. **Doctrine matrix** — 8 families × 9 doctrines; Methodist column highlighted; tap a
   cell to read it with sourcing and the whole row.
4. **Mind maps** — one tradition at a time, its doctrine stances spun out from the center.
5. **Genealogy** — the historical branching (Early Church → 1054 → 1517 → the fan-out).

Tapping any tradition anywhere opens a reading panel (blurb, its position on all seven
axes, its stance doctrine by doctrine, and the sourcing) plus a shortcut into the bot.

## The compare bot
The "Ask & compare" panel does client-side keyword retrieval over the comparison data
(each doctrine cell, tradition blurb, and axis becomes a source), then calls `/api/chat`
(Anthropic Haiku) with a fairness prompt: answer only from the sources, no invented
quotes, represent each tradition from its own voice, be direct where a source is direct.

This is the **starting corpus**. The next step is to draft the sourced reading essays
(denomination statement + a seminary text per tradition + Woods's material for the
Methodist column) and embed them the same way so the bot answers from real prose.

## Deploy
**Option A — its own Vercel project (simplest):** drag this `comparative/` folder into
Vercel as a new project. `/api/chat` resolves to `api/chat.js`. Add `ANTHROPIC_API_KEY`
in Settings → Environment Variables. Browsing works immediately; the bot works once the
key is set. Static hosts (GitHub Pages) work for browsing but not the bot.

**Option B — alongside the main Theology Bot:** if this folder ships inside the main
project (served at `/comparative/`), the page's `/api/chat` call reaches the main
project's `api/chat.js`, which is the same generic handler — no extra config needed.

The page never holds the key; it lives only in the serverless environment.

## Open items for Woods
- Confirm/adjust the 19 traditions and the axis numbers in `comparison.json`.
- Decide on adding Quakers / Salvation Army as a post-sacramental outlier.
- Review every doctrine cell for fairness before publish.
- Draft the sourced reading essays to deepen the bot's corpus.
