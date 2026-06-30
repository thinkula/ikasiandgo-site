# Ikasi & Go — Launch Boardroom (shared findings doc)

**Convened:** 2026-06-28 · **Moderator:** Claude · **Format:** 4-exec debate, multi-round, direct cross-examination

## The product on the table
- Basque (Euskara) vocabulary app. iOS-first, Capacitor/Vite/React. Domain `ikasiandgo.com` live.
- **816 hand-crafted words**, 14 topics, CEFR A1–B2 (A1 248 / A2 231 / B1 174 / B2 163). Each word: pronunciation guide + rich cultural/etymological notes + example sentence.
- **Engine:** spaced repetition (SRS 1/3/7/21/60d), quiz, match, typing, listen/speak modes, streaks, gamification.
- **Monetization:** RevenueCat IAP wired. Freemium configured — FREE = A1 + 3 topics (greetings/food/numbers); A2–B2 + 11 topics paywalled. No price set. Not yet live.
- **Context:** solo dev, no existing audience, no marketing spend. Market: ~750–900k Basque speakers + global diaspora + heritage/identity learners. Duolingo has a Spanish→Basque course.

## The board
- **Growth** — acquisition & positioning
- **Pricing** — monetization model & App Store economics
- **UX** — onboarding, retention, day-2 return
- **Skeptic** — devil's advocate; sole job is to argue this won't make money

---

## Round 1 — Opening positions

**Growth** — Beachhead = 2nd/3rd-gen Basque-Americans (Idaho/Nevada), not Basque speakers. The wedge: Duolingo's Basque course requires *Spanish* as bridge language; this doesn't. Channels: NABO (37 diaspora clubs, festivals like Elko NV), UNR Basque Studies Program, Basque-culture YouTubers/Substacks. **Bet:** 37 NABO clubs × ~200 engaged = 7,400 high-intent prospects; 15% → first 1,000 users with $0 ad spend.

**Pricing** — Model = **lifetime unlock, $7.99** (NOT subscription — identity-buyers don't want to "rent their own culture"; churn/support kills a solo dev). Ladder: free A1+3 topics → $7.99 all → future $14.99 w/ audio. Keep paywall exactly at A1 (the "Basque doesn't stop at kaixo" desire moment). **Bet:** 2% paid conversion = $136 net per 1,000 downloads. Holds *only if Growth can deliver ~10k downloads yr 1*; else raise price ("$12.99 to 500 > $7.99 to 5,000 we can't reach").

**UX** — First 60s must be an emotional/cultural moment (one word + audio + photo + cultural line), not a tutorial. **Streaks will backfire** on busy adult heritage learners (shame, not motivation) → forgiveness-first + "word of the day" push written like a letter. **Biggest retention risk = the paywall placement:** heritage learners blow through A1 in 2–3 sessions (already know *etxe/ama/aita*) and hit the wall *before* the habit forms. Fix: gate by **depth** (cultural notes, etymology, B1–B2, listen/speak), not breadth — let them touch every topic at A1 free. **Bet:** this audience will pay for a slower, *richer* experience because motivation is identity, not achievement.

**Skeptic** — Addressable *learners* (not speakers) ≈ 20–40k globally, many already on free Duolingo. No-budget app reaches ~1% → ~300 downloads yr 1 → 6–15 buyers → **$180–450 yr 1.** Best case 3k downloads × 5% × $8/mo ≈ $14k ARR — below minimum wage for the dev's time. **Fatal flaw:** Duolingo gives Basque away free; this app must convince people to *pay for a subset of what's free*. Heritage motivation drives *downloads, not conversions*. **One concession:** an institutional/B2B pivot — euskaltegis, ikastola networks, or Basque Govt language-normalization budgets (Euskararen Agenda) — could change the math entirely. One contract > 10k consumer conversions.

## Round 2 — Cross-examination

**Growth → others:** Concedes NABO delivers ~**1,000 high-intent** installs, *not* 10k — "I never claimed 10k; you need 1,000 high-intent, not 10k cheap." Tells Pricing to charge more: heritage buyers are the *least* price-sensitive in the market. Concedes UX's hit ("best hit landed") → fix is gate on **mode/depth** (free listen/quiz; paid SRS + cultural notes), not raw A1. Rebuts Skeptic's "300": NABO festivals (Elko, Udaleku) move real money on identity goods every year — "people who buy a $40 Basque cookbook they'll never cook from will buy a $12 app." Still stakes everything on **15% of warm NABO outreach installs.**

**Pricing → others:** Commits on the spot: if realistic reach is ~1,000, **$7.99 is malpractice → go $12.99** (test $14.99 on the NABO list). "Smaller audience, higher willingness to pay — a correction, not a retreat." Concedes UX fully: "keep the paywall where it is was wrong" → **open every topic at A1, paywall depth** (etymology, cultural notes, B1–B2, audio) — "sell the moat, not the word count." Agrees with Skeptic on *direction* (premium not volume) but says he goes too far: Duolingo is Spanish→Basque, **useless to an English-speaking Idaho Basque — "not a better mousetrap, the ONLY mousetrap."** Net: **$12.99, depth-gated.**

**UX → others:** Sharpens the convert moment — free user opens "Food," sees *bakailao*, hits a **blurred cultural note** teasing the etymology + Bilbao fishing history → "that blur converts harder than a locked A2 topic." Reframes: "I'm not triggering on *you've run out*, I'm triggering on *you want the deeper version of what you're enjoying* — 4% on a warm wall beats 2% on a cold one." To Skeptic: concedes polish converts nobody, but **the convert moment is a cultural note tied to the user's surname or village — identity, not polish, and Duolingo structurally can't make it.**

**Skeptic → others:** Unmoved, two new strikes. (1) Growth's 15% is fiction — NABO skews 55+, English-dominant, "buys a beret not an SRS app"; realistic roster-email download rate is **3–5%.** And **"no Spanish required" is a temporary UI gap — Duolingo could localize Basque-from-English in a quarter. "Not a wedge; a countdown."** (2) Pricing's own concession is the confession: "$12.99 to 500 vs $7.99 to 5,000" = *admitting 5,000 buyers don't exist; optimizing margin on a puddle.* 2% conversion vs free Duolingo is really sub-1%. (3) UX's "depth" = a bigger giveaway → fewer people ever reach the wall. **Sharpened concession to vote on: commission ONE B2B pilot — a single ikastola network or NABO's federation — app-as-demo, licensing deal. Kill the consumer-freemium launch.**

## Round 3 — Convergence

**Vote: UNANIMOUS GO-NARROW** (consumer launch, diaspora beachhead, $12.99 lifetime, depth-gated).

- **Growth:** Fork 1 = either/or, pick consumer first — "a B2B sales cycle isn't a launch, it's a job"; ship, let the diaspora generate proof, *then* walk into NABO's federation with traction not a slide deck. Concedes moat is a **12–18 month window** → win the diaspora fast; the durable moat is the 816 curated words, not the bridge language. **Won't concede:** heritage learner is the beachhead.
- **Pricing:** Either/or, consumer-first. Honest year-one NET he'll sign his name to: **~$300–$500** (~1,000 installs, 3–4% on a heritage list). "Below minimum wage — Skeptic's right on the math, wrong that it's a reason not to ship." Time-limited moat argues to charge **more now**, harvest fast; moat migrates from "no Spanish" → "no one else curates this." **Final: $12.99 lifetime, depth-gated.**
- **UX:** Day-one non-negotiables (everything else is post-launch): **(1)** cultural-note blur + a *working* RevenueCat purchase = the entire convert loop; **(2)** forgiveness-first word-of-the-day push (no streak guilt); **(3)** first-run word screen with auto-playing audio. The one screen that must be perfect = **the first-run word screen** (word + audio + photo + one line of cultural soul) — the thing Duolingo won't fund the curation to copy. **Won't concede:** killing the consumer launch.
- **Skeptic:** **Conceded — sunk build cost flips the answer.** Shipping is a cheap experiment *if framed as data collection for a B2B pilot, not as the business.* "Ship it lean, instrument it, don't nurture it." The danger isn't ship-cost, it's founder attention bleeding into a feature/review treadmill that starves institutional sales. **Flips to full GO** only on one signed institutional letter of intent pre-launch.

## Synthesis — launch recommendation

### The call: **GO-NARROW** — ship a deliberately small, instrumented consumer launch. Unanimous.

**The product spec the board agreed on:**
1. **Price:** $12.99 one-time **lifetime unlock** (not subscription). Optionally A/B $14.99 on the NABO list. Heritage buyers are price-insensitive; identity-buyers don't want to "rent their own culture," and subscriptions create churn/support a solo dev can't absorb.
2. **Paywall = depth, not breadth.** Open *all 14 topics* at A1 for free; gate the **cultural notes / etymology / B1–B2 / listen-speak / SRS**. Convert moment = a **blurred cultural note** on an emotionally loaded word (e.g. *bakailao*, or a word tied to the user's surname/village), not a "you ran out of free topics" wall. This is the single biggest change from the currently-coded gate (which paywalls *breadth*: A1 + 3 topics).
3. **Retention:** kill streak-shame → **forgiveness-first**; daily **word-of-the-day push written like a letter**, not a nudge.
4. **First run:** one word + auto audio + photo + one line of cultural soul. Earn the emotion on swipe one, *before* asking anything.

**Channel:** NABO (37 diaspora clubs), UNR Basque Studies, Elko/Udaleku festivals, Basque-culture creators. Realistic = **~1,000 high-intent installs**, not 10k. Wedge = "Basque from English, no Spanish required" — real but **time-limited (~12–18 mo)** → move now.

**Honest economics (no one disputed):** year-one net ≈ **$300–$500.** This is not a salary. It IS a cheap, real-world experiment + a living demo.

### The ONE decision the board kicks to you (the real fork)
Everyone agrees to *ship*. They disagree on **what the launch is FOR**, and it changes how much of your time to pour in:
- **Growth / Pricing / UX:** the diaspora consumer app **is the business** — nurture it, it compounds.
- **Skeptic:** it's a **demo + data-collection layer** to land one institutional deal (ikastola network / Basque-govt language program / NABO federation) where the real money is — ship lean, instrument, *don't* get sucked into a feature treadmill.

These aren't mutually exclusive on day one (same app, same launch) — but they diverge on **where your hours go in months 2–6.**

### ✅ FOUNDER DECISION (2026-06-28): GO-NARROW approved. Launch intent = **"It's the business."**
The diaspora consumer app is the product — nurture it and let word-of-mouth compound; ~$300–500 yr1 is an accepted small base to grow, not a demo to discard. (Skeptic's "instrument it, don't nurture it" is overruled on *intent* but his anti-treadmill warning still stands: protect against drowning in feature requests. B2B remains a *later* option earned by traction, not the primary motion.)

### ⚠️ FOUNDER DECISION (2026-06-28): Native-speaker AUDIO deferred to a post-launch update.
Rationale: real audio = recording/licensing 800+ words; shipping TTS/cheap audio would undercut the "curation Duolingo won't fund" moat. Launch is **audio-free**. Implication: UX's day-one "first-run aha" and the convert moment can no longer lean on auto-playing audio — the load-bearing element shifts to the **cultural note / etymology text + visual** (see UX re-spec below).

### UX re-spec — audio-free first run (2026-06-28)
- **Screen 1 (the new "aha"):** the **cultural note moves up**, the word becomes the hook. On screen: Basque word large → English → pronunciation *text* ("EH-tcheh") → **one cultural sentence that gives chills** (e.g. *"The etxe is the oldest legal institution in Basque society; families took their surnames from it"*). The word is the hook; the story is the payload.
- **Convert moment gets STRONGER:** audio was never the trigger — the blurred cultural note was. With nothing competing, **etymology becomes THE headline feature** and the free/paid line is cleaner: *read the word free, unlock the soul paid.* Less "alive," but more focused.
- **Vote unchanged: GO-NARROW.** "Audio-free is survivable because the moat was always the writing."
- **Ship-Monday screen-1 spec:** word + English + pronunciation text + one cultural sentence. One screen, one swipe.

### Pre-committed 90-day thresholds (Skeptic's, board-endorsed)
- **Double down (it's working):** 750+ installs, 3%+ paid conversion, $400+ net.
- **Pivot to B2B/institutional:** installs come but **sub-1.5% conversion** → demand is emotional, not commercial.
- **Shelve:** under 200 installs AND under $100 net.
