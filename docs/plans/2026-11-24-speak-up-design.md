# Speak Up — Design

Date: 2026-11-24

## Goal

A small PWA that encourages speaking up in pressured situations (meetings, talking to a boss,
introducing yourself, joining a chat, breaking a silence). It rewards **attempts to speak**, not fluency,
and uses the user's own data to show that feared outcomes rarely happen.

Companion to Speak Freely, but a separate app with separate data.

## Decisions

| Topic | Decision |
|---|---|
| Stack | Vite + React + TypeScript, Tailwind, vite-plugin-pwa, HashRouter, `idb` |
| Hosting | GitHub Pages, repo `speak-up` → https://zirui-huang73.github.io/speak-up/ |
| Language | English UI |
| Data | Local IndexedDB only, plus: request persistent storage, backup reminder after 7 days, export/import |
| Install | Recommend Safari → Add to Home Screen (iOS Chrome tabs lost Speak Freely data) |
| Notifications | Out of scope for v1 |

## Navigation

**Today · Plans · Progress · More**

## Brave moment (core concept)

Every attempt to speak is a Brave moment.

1. Before (optional): situation (Meeting, Talking to my boss, Introducing myself, Joining a chat,
   Breaking a silence, Phone call, Other); expected anxiety 0–10; "Will you get stuck?" Likely/Maybe/Unlikely.
2. 30 seconds before speaking: two physiological sighs (~15 s), release check feet → shoulders → hands →
   jaw → tongue (~10 s), then the situation's opener (from if-then plans), Speech Plan (Pressure by default),
   one encouraging line. "Go speak" saves the moment as pending.
3. After: pending "How did it go?" card persists on Today. "Did you speak?" Yes → actual anxiety 0–10,
   Pass/Fail (Fail only if a fluent listener would clearly notice), optional note. "Not this time" → logged
   kindly, counted separately.
4. Feedback: "Brave moment #N", expected vs felt comparison, weekly count and streak.
5. "Log a moment" for after-the-fact entries; no prediction (not used in prediction stats).

## Today's challenges and ladder

- Five levels built around the user's hard situations; each level has a pool of missions (editable, user can add).
- Daily: 3 missions (2 from current level, 1 from the level below). Shuffle per mission. Refresh at 04:00.
- Starting a mission opens the Brave moment flow with the situation pre-filled; completing it ticks the mission.
- After 7 attempts at the current level (attempts, not passes), suggest levelling up; user decides.
  Can step down any time.

## Plans

- If-then plans: situation → opener → optional crutch hint. Six editable defaults (silence, joining a chat,
  meeting turn, boss, self-introduction, buying time). Practice: say the opener 3×, tap to count.
- Speech Plan card: General and Pressure, editable with book examples, full-screen view. Per-situation choice
  of which plan to show (Pressure by default).

## Progress

- This week, total, streak (days with ≥1 spoken moment), speak-up rate.
- Expected vs felt (only moments with a prediction): averages, "When you expected to get stuck, X% were a Pass",
  last 20 moments chart.
- By situation: count and felt-anxiety trend.
- Weekly trend: spoken vs "not this time", last 8 weeks.
- History list with edit/delete. Milestones at 1, 10, 25, 50, 100.
- Charts in plain SVG.

## More

Settings (name, theme), Storage (persisted status, last backup, export/import), Edit ladder, How to install.

## Build order

1. Scaffold, navigation, settings, persistent storage, backup reminder, export/import, deploy
2. Plans: if-then plans and Speech Plan card
3. Brave moment flow
4. Missions and ladder
5. Progress

Each step is tried and confirmed before the next.
