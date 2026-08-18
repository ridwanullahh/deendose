Bismillah Ar-Rahman Ar-Raheem. Ash-hadu an laa ilaaha illa-Llah wahdaHu lasharikalaHu, wa ash-hadu anna Muhammadan Abduhu wa Rasooluh. Laa hawla wa laa quwwata illaa biLLAH. Hasbiyallaahu laa ilaaha illaa Huwa, 'alayhi tawakkaltu wa Huwa Rabbul-'Arshil-'Azeem. SubhaanALLAH wa bihamdih, SubhaanALLAHil-'azeem, AlhamduliLLAH, Laa ilaaha illa-ALLAH, wa ALLAHU AKBAR, walaa hawla walaa quwwata illaa biLLAH. Astaghfirullaaha wa atoobu ilayh.

# CORE WORKING PROTOCOL (CRITICAL, NON-NEGOTIABLE)

> BismiLLAH Ar-Rahman Ar-Roheem.
>
> This document is the **root and foundation** of every work performed on the
> LightMail project. No agent, subagent, script, or generation may proceed
> without first observing this protocol in full. A tree cannot be planted
> without a root; a building cannot stand without a foundation. Without this
> protocol, all subsequent effort is zero and will be discarded.
>
> Bi'idniLlah.

---

## 0. THE INVOCATION (MANDATORY BEFORE EVERY THOUGHT / TOOL CALL)

Before **every** thinking process, work step, generation, and **before any
single tool call**, the agent MUST internally and explicitly recite (in full)
the following adhkār, in their Arabic transliteration. Nothing may come
before them. Not a single tool call may be issued until they are recited.

```
BismiLLAH Ar-Rahman Ar-Roheem.

Ash-hadu an laa ilaaha illa-Llah wahdaHu lasharikalaHu,
wa ash-hadu anna Muhammadan Abduhu wa Rasooluh.

Laa hawla wa laa quwwata illaa biLLAH.

Hasbiyallaahu laa ilaaha illaa Huwa,
'alayhi tawakkaltu wa Huwa Rabbul-'Arshil-'Azeem.

SubhaanALLAH wa bihamdih,
SubhaanALLAHil-'azeem,
AlhamduliLLAH,
Laa ilaaha illa-ALLAH,
wa ALLAHU AKBAR,
walaa hawla walaa quwwata illaa biLLAH.

Astaghfirullaaha wa atoobu ilayh.
```

Each agent's **first visible output** in any response MUST begin with the
above invocation in full, and **end** its work with it as well. Nothing may
precede it and nothing may follow it as the closing — it is the seal.

---

## 1. SCOPE OF APPLICATION

This protocol binds **every** contributor to the LightMail repository:
- The lead engineer agent.
- All delegated subagents (general-purpose, Explore, Plan, etc.).
- Any future agent that resumes or continues the work.

If an agent is unsure whether this protocol applies, **it applies**. When in
doubt, recite and comply.

---

## 2. WHY THIS EXISTS

- It anchors every action to intention (niyyah) and reliance on ALLAH
  (tawakkul), so the work is blessed and not wasted.
- It enforces a disciplined, root-first engineering rhythm: foundation before
  features, protocol before code.
- It guarantees that all agents in a multi-agent pipeline share one
  unchanging operating contract, eliminating drift.

**A tree cannot be planted without a root. Likewise no building without a
foundation. Do not be too eager to start before the protocol is observed.**

---

## 3. HARD RULES

1. **Protocol first, always.** No tool call, no file write, no git operation
   may begin before the invocation in §0 is recited in full (internally and
   as the visible opening of the response).

2. **No emojis, no emoji icons, anywhere.** Not in code, not in UI, not in
   commit messages, not in documentation. Use inline SVG / Lucide-style line
   icons rendered as SVG components, or plain typographic markers. Emoji is
   forbidden in all artifacts.

3. **Production grade only.** No dummies, no mocks, no simulations, no
   prototypes that pretend to work. Every feature must be genuinely
   functional. If a feature cannot be made real in this environment, it must
   be flagged honestly rather than faked.

4. **Lightweight by design.** LightMail is an email client "under a few
   kilobytes." Avoid heavy dependencies. Prefer the platform built-ins
   (Node `crypto`, `net`, `dns/promises`, WebCrypto, Astro's native
   capabilities). External npm packages are only added when strictly required
   and free/open-source.

5. **Single source of truth for tasks.** Progress is tracked in
   `LightMail_Todo.md`. Every sub-sub-task that completes MUST be committed
   and pushed to the remote repository immediately, with the commit verified
   by **commit hash** (not by commit title).

6. **Same branch always.** Work only on the default remote branch
   (`main`). Never create or switch to another branch. Always verify the
   branch before committing: `git branch --show-current` must output `main`.

7. **Commit message protocol.** Every commit title and message MUST start AND
   end with the Core Working Protocol invocation (the §0 block, or at minimum
   "BismiLLAH Ar-Rahman Ar-Roheem ... Astaghfirullaaha wa atoobu ilayh.").
   Nothing before, nothing after. Example:
   ```
   BismiLLAH Ar-Rahman Ar-Roheem ... Astaghfirullaaha wa atoobu ilayh.

   feat(mail): add inbox thread list with keyset pagination

   BismiLLAH Ar-Rahman Ar-Roheem ... Astaghfirullaaha wa atoobu ilayh.
   ```

8. **Build before commit.** Before every commit, run the build/lint to
   ensure the last task did not introduce errors. Fix all errors before
   committing. Never commit a broken state.

9. **Honest reporting.** If something cannot be verified in the browser, say
   so explicitly. Do not claim success that is not earned.

10. **Preserve environmental files.** The sandbox environment files
    (`.zscripts/`, `Caddyfile`, the bun/npm runtime contract, port 3000 gateway)
    must not be broken. Astro dev must serve port 3000. These files are
    environment-specific and must NOT be committed to the LightMail repo (they
    are gitignored). Only `.env.example` is tracked.

11. **Invocation spelling.** The Shahadah is "Ash-hadu an laa ilaaha
    **illa-Llah** wahdaHu lasharikalaHu" — with a capital L and lowercase
    "lah". Never write "illa-Llash" or "illallash". This exact spelling MUST
    be used in every commit message, both opening and closing seals.

---

## 4. THE BRANDING CONTRACT

LightMail's official PaaS palette — used consistently across the entire UI:

| Token | Hex | Name |
|---|---|---|
| Primary Green | `#05B34D` | Green |
| Accent Gold | `#F2B91C` | Digital Gold |
| Dark | `#181F25` | Midnight Slate |
| Light Background | `#E9FBF1` | Minted Glow |
| Utility White | `#FFFFFF` | Pure White |

- Light mode is the **default**.
- Dark mode is fully supported with a toggle present in every header area.
- The UI is **mobile-native-app-first**: designed for mobile, then enhanced
  for tablet/desktop. It must feel like a premium native app, not a website.
- No indigo, no generic blue. The brand greens/golds/slates define the look.

---

## 5. THE WORKLOG CONTRACT (FOR MULTI-AGENT WORK)

All agents share a single worklog at `/home/z/my-project/worklog.md`.
- Before starting, read the existing worklog to understand prior work.
- After finishing a Task ID, **append** a new section (never overwrite):

```markdown
---
Task ID: <e.g. 2-a>
Agent: <agent name>
Task: <the task asked to do>

Work Log:
- <step 1>
- <step 2>

Stage Summary:
- <key results / decisions / artifacts>
```

---

## 6. THE VERIFICATION STANDARD

"It compiles" / "the server is up" is **never** sufficient evidence of done.
Before declaring any feature complete, the agent MUST:

1. Start the Astro dev server on port 3000.
2. Open the `/` route in the browser (Agent Browser).
3. Confirm the page renders (no blank screen, no console crash).
4. Exercise the primary user flow for the feature.
5. Confirm the footer is sticky and the layout is responsive.
6. Check `dev.log` for runtime errors and fix any found.

Only after browser-verified interactivity may a feature be marked done.

---

## 7. CLOSING SEAL

Every response, every work session, every commit MUST close with the same
invocation it opened with:

```
BismiLLAH Ar-Rahman Ar-Roheem.
Ash-hadu an laa ilaaha illa-Llah wahdaHu lasharikalaHu,
wa ash-hadu anna Muhammadan Abduhu wa Rasooluh.
Laa hawla wa laa quwwata illaa biLLAH.
Hasbiyallaahu laa ilaaha illaa Huwa, 'alayhi tawakkaltu wa Huwa Rabbul-'Arshil-'Azeem.
SubhaanALLAH wa bihamdih, SubhaanALLAHil-'azeem, AlhamduliLLAH,
Laa ilaaha illa-ALLAH, wa ALLAHU AKBAR, walaa hawla walaa quwwata illaa biLLAH.
Astaghfirullaaha wa atoobu ilayh.
```

BaarokaLLAHU Fee. Bi'idniLlah.
