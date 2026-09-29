# WordLink development plan

Last reviewed against local `main` at commit `360cdb0` on 2026-09-29.

## How to use this file

This is the only development checklist to follow in order. Start with the first step marked **CURRENT**, finish its checklist, run its completion check, and then change it to **DONE**. Do not create files or install systems from later steps early.

The current task is **Step 2: stabilize and test the room/game foundation**.

`docs/gamerules.md` is a rules reference. Open it when a step says a behavior must match the game rules; it is not a second implementation plan.

## Current codebase snapshot

### Implemented and verified

- The project uses ES modules through `"type": "module"`.
- `server/server.js` uses ES-module imports, serves only `public/`, and provides `/health`.
- The server was started directly with Node during this review, and `/health` returned `{"status":"ok"}`.
- Browser code no longer imports server-only classes.
- `Room` and `RoomManager` exist under `server/room/`.
- Rooms receive an ID and five-character code and track creation/closure time, host, players, linked game, and open status.
- Room joining currently handles the first player as host, a second player, duplicate joins, missing rooms, closed rooms, and a two-player capacity.
- Room leaving removes a player and reports a missing player.
- `Game` and `GameManager` exist under `server/game/`.
- Games receive an ID, room ID, copied player array, duration, timestamps, and basic pre-game/live-game/end-game transitions.
- `scripts/smoke-game.js` runs and exercises room creation, joining, duplicate joins, leaving, and game creation.
- The browser has a screen/navigation shell, mock chain-list rendering, a home-view stub, and the refined dark-violet theme.

### Partially implemented or currently incorrect

- The smoke script is exploratory output, not an automated test. It removes players and then creates a game from the emptied room, and it does not assert the created game's state.
- `npm test` is still a failing placeholder. There is no tracked `tests/` directory.
- The local `npm` launcher is broken before it reaches this project: it points to a missing global `npm-cli.js`. Direct `node` commands work. Repair/reinstall the local Node/npm tooling before a step requires package installation or npm scripts.
- When a host leaves, `RoomManager` currently promotes the remaining player. The confirmed pre-game rule says the host leaving closes the room and removes the remaining player. There is no host transfer in v1.
- `Room.close()` exists, but leaving does not use it and closed rooms remain stored indefinitely.
- `Room.linkedGame` can be set, but game creation does not currently link the room and game in either direction through one coordinated operation.
- A game can be created with zero or one player, an invalid duration, or an unknown room.
- Room codes use unbounded `Math.random()` retries and cannot be made deterministic for collision tests.
- `Game` uses `Date.now()` directly, so timer-boundary tests cannot control time.
- The current three phases do not yet represent selection, lock-in, countdown, gameplay, and results.
- No chain format validation, chain snapshot, guessing, score, winner, timeout, draw, or safe player-specific state exists.
- The home renderer is not registered in `screens.js`; practice is only a stub.
- `List` creates new IDs while hydrating data and lets the browser set `verified`; neither behavior can be trusted for multiplayer eligibility.
- A failed `loadData()` can return `undefined`, while chain-list rendering immediately calls `forEach`.
- Socket.IO and Supabase are named in the project direction but are not installed or implemented.

---

## Step 1 — DONE: establish a runnable server foundation

**Files:** `package.json`, `server/server.js`, `public/js/app.js`.

Completed:

- Set the package to ES-module mode.
- Converted the server entry from `require` to `import`.
- Replaced CommonJS path handling with `fileURLToPath(import.meta.url)`.
- Kept static serving limited to `public/`.
- Removed the browser import of `GameManager`.
- Kept the health endpoint working.

**Completion evidence:** `node server/server.js` starts successfully and `GET http://localhost:3000/health` returns `{"status":"ok"}`.

---

## Step 2 — CURRENT: stabilize and test the room/game foundation

Do not add sockets, accounts, or a database during this step. The goal is a dependable server-side model that can be tested entirely from the terminal.

**Work in:**

- Existing: `server/room/Room.js`, `server/room/RoomManager.js`, `server/game/Game.js`, `server/game/GameManager.js`, `scripts/smoke-game.js`, `package.json`.
- Create: `tests/fixtures/players.js`, `tests/unit/RoomManager.test.js`, `tests/unit/Game.test.js`, `tests/unit/GameManager.test.js`.

### 2A. Repair the local test command

- Repair the machine's Node/npm installation until `npm --version` works. This is a local tooling repair, not an application-code feature.
- Until that is repaired, individual tests can still run with `node --test <test-file>`.
- Replace the placeholder `test` script with `node --test "tests/unit/**/*.test.js"` after the first tests exist.

### 2B. Replace smoke-script experiments with assertions

- Keep `scripts/smoke-game.js` as one readable happy-path demonstration.
- Create fixed Alice and Bob fixture objects with stable IDs and separate five-word lists.
- The smoke path should create one room, join Alice and Bob, create one game from those two players, link it to the room, start it, and end it.
- Print only a compact summary. Move duplicate, invalid, and failure cases into automated tests.
- Do not remove the players before creating the game.

### 2C. Make room behavior match the documented rules

- Keep the two-player limit and duplicate-join rejection.
- Reject a missing/invalid player and missing player ID without throwing an accidental TypeError.
- When the host leaves before play, close the room and remove/release the remaining player. Do not assign a new host.
- When the non-host leaves before play, keep the host and reopen/wait as appropriate.
- Decide one return/error shape and use it consistently in both managers.
- Add manager cleanup so a permanently closed room does not stay active forever.

### 2D. Make creation deterministic and validated

- Let tests inject ID, room-code, and clock functions while production defaults use Node crypto/current time.
- Generate room codes with bounded retries. Test collision-then-success and repeated-collision failure.
- Validate that a game belongs to a real room, has exactly two distinct players, and uses an allowed duration.
- Coordinate game creation in one place: create the game, register it, and set the room's linked game. A partial failure must not leave only one side linked.
- Return copies of player arrays so callers cannot mutate private room/game membership.

### Step 2 automated checks

- Room: unique ID/code, first player becomes host, second joins, duplicate/self join rejected, third player rejected, missing/closed room rejected.
- Leaving: missing player rejected, non-host leave retains host, host leave closes room without host transfer.
- Code generation: forced collision succeeds with next code; repeated collision stops with a clear error.
- Game: two copied players, correct room ID/duration/timestamps, valid pre-game → live → end transitions, repeated/out-of-order transitions rejected.
- Manager: create/get/list/delete, invalid room/player count/duration rejected, room/game linked once.

**Completion check:**

1. `node scripts/smoke-game.js` shows one correct two-player room/game lifecycle.
2. `npm test` passes after npm is repaired.
3. Temporarily breaking one assertion makes the test command fail; restoring it makes the command pass.
4. No browser is required for any Step 2 check.

---

## Step 3 — NEXT: implement chain rules and a complete terminal game

Start only after Step 2 passes. This step turns the room/game shell into the actual WordLink rules engine.

**Work in:** `server/game/`, new `server/rules.js`, `tests/fixtures/chains.js`, and unit tests. Put only reusable non-secret formatting helpers in `public/js/shared/rules.js` if the browser also needs them.

- Read `docs/gamerules.md` before implementing this step.
- Represent a chain as an immutable five-word snapshot owned by one player.
- Normalize guesses by trimming and comparing case-insensitively. Decide and document the allowed character/length rules before coding validation.
- Distinguish Draft, Ready, and Blocked. Unknown connections remain playable; the browser cannot mark its own chain eligible.
- Let each player select their own chain while solving the opponent's chain.
- Implement selection, irreversible lock-in, 60-second auto-selection, 10-second countdown, gameplay, and results states.
- Reveal only the opponent's first word initially. Require four correct guesses in order; incorrect guesses do not advance.
- Implement timed completion/tie and unlimited agreed draw according to the rules.
- Inject a controllable clock/scheduler so tests advance deadlines without waiting.
- Produce a separate safe state for each player. Never serialize the unsolved opponent words before results.

**Completion check:** the smoke script can play an entire two-player round to a result, and unit tests cover four sequential guesses, incorrect/skip attempts, timeout/tie, draw, invalid phases, stale timers, one terminal result, and hidden-answer protection.

---

## Step 4: finish the browser UI using sample state

This remains a frontend-only step. Do not connect it to multiplayer yet.

**Work in:** existing files under `public/`; add focused view modules under `public/js/` as needed.

- Register and implement `homeView`.
- Build a clearly labeled practice game using one intentionally public sample chain.
- Build chain editor/library, waiting room, selection, countdown, game, and results views using sample state shaped like the safe server state from Step 3.
- Preserve supplied list IDs instead of generating new IDs during hydration.
- Display eligibility status but remove client authority to set `verified`/Ready.
- Make `loadData` either return validated data or throw/return a structured failure; do not call `forEach` on `undefined`.
- Give each screen render/load/dispose behavior so repeated navigation does not accumulate listeners or stale async updates.
- Cover loading, empty, error/retry, pending, success, and disabled states.

**Completion check:** practice can be completed with Enter on desktop and a narrow mobile layout; every planned screen can be navigated with sample data; failed loading is recoverable; keyboard focus and visible status text work without relying on color alone.

---

## Step 5: add local identities and in-memory player data

This makes two local browser sessions represent two different players without requiring Supabase yet.

**Create under `server/`:** `config.js`, `auth/devIdentity.js`, `repositories/memory.js`, and service modules. Add browser auth/session handling under `public/js/`.

- Add development-only Alice and Bob identities with stable IDs and separately owned Ready chains.
- Let the loopback-only development server issue an opaque random session token for a selected fixture user.
- Derive the acting user from that token. Never accept an authoritative `hostId` from browser JSON.
- Load fixtures into the same in-memory repository used by the running server.
- Require an owned Ready chain before creating or joining a room.
- Add `.env.example` and ignored local/test environment files. Production/staging configuration must reject fixture authentication and memory-only persistence.

**Completion check:** Alice and Bob see only their own lists; a forged browser user/host ID is ignored or rejected; restarting the local fixture server has a clearly documented reset behavior.

---

## Step 6: connect local browsers through HTTP and Socket.IO

**Create:** `server/app.js`, routes, socket handlers, `services/gameService.js`, `public/js/api.js`, `public/js/socket.js`, and integration tests.

- Separate Express app creation from listening so tests can start a server on a temporary port.
- Attach Socket.IO to the same HTTP server that serves Express.
- Authenticate before enabling room actions.
- Add create/join, select/lock, guess, draw, leave, and state-sync commands. Route all commands through the already-tested domain/services.
- Include command IDs, acknowledgements, room/match revisions, timeouts, and duplicate protection.
- Send each client only its player-specific safe state.

**Completion check:** real HTTP/socket test clients acting as Alice and Bob can complete a match; Eve cannot join a full room, act for another player, subscribe to another room, or obtain hidden answers.

---

## Step 7: complete local two-browser play and reliability

**Work in:** browser state/views plus server game/socket services and scheduler.

- Open two isolated browser profiles/sessions and complete create → join → select → lock → countdown → play → results.
- Implement reconnect/resync after refresh rather than assuming every socket event arrived.
- Apply the documented host/non-host pre-game departure behavior.
- Implement live disconnect grace, explicit forfeit, both-disconnected behavior, and one controlling tab per account.
- Ignore stale timers, old match commands, and duplicate requests.
- Clean up closed rooms, games, memberships, timers, listeners, and deduplication records.

**Completion check:** timed and unlimited games work in two local sessions; refresh/reconnect, invalid/full rooms, host/non-host departures, repeated clicks, old commands, and a third user all have deterministic outcomes with no answer leakage.

---

## Step 8: automate the local player journey

**Create:** `playwright.config.js`, `tests/e2e/`, test-server helpers, and `.github/workflows/ci.yml`.

- Use isolated Playwright browser contexts for Alice and Bob.
- Give tests their own port, environment, and resettable data; do not depend on a developer's running server.
- Automate the complete match plus refresh, invalid invite, failed request, disconnect, and mobile-layout cases.
- Run unit/integration tests and browser tests on Linux CI to catch case-sensitive import errors.

**Completion check:** a clean checkout can install, test, start its own test server, and complete the two-player journey without manual setup.

---

## Step 9: replace fixtures with Supabase accounts and private chain storage

**Create:** versioned Supabase migrations, server auth/repository adapters, browser account flows, and database permission tests.

- Add signup, email confirmation, login, logout, password reset, session refresh, and profile creation.
- Verify access tokens on the server. The verified user ID becomes the same actor/host ID used by the fixture implementation.
- Store profiles, chains, and immutable chain versions. Support create/edit/archive and optimistic edit conflicts.
- Enforce ownership in server services and database row-level security. Ordinary users cannot read another player's chain contents directly.
- Keep elevated database credentials server-only and disable fixture auth outside local tests.
- Lock an immutable chain version for play so later editing/archiving cannot alter a match.

**Completion check:** two real accounts have separate private chains that survive restart/login on another device; expired/forged auth fails; Alice cannot read or edit Bob's chain through either the app API or direct database access.

---

## Step 10: persist matches, results, and recovery state

**Work in:** match/result migrations, repository/service transactions, results/profile views, recovery tests.

- Persist both participants and locked chain evidence before competitive play begins.
- Finalize both player outcomes exactly once in one restricted transaction.
- Derive records from finalized results; do not let clients submit winners or update records.
- Display pending versus recorded results accurately.
- Retry uncertain writes with the same match/command identity. A lost response may still mean the database committed.
- On process restart, preserve committed results and mark unrecoverable unfinished beta matches interrupted without inventing a win/loss.

**Completion check:** duplicate/conflicting finalization cannot award twice; failed writes do not show as saved; committed results survive restart and both accounts show consistent records.

---

## Step 11: add reports, admin review, and release hardening

**Work in:** moderation migrations/services/routes/views, security/config, full test suite.

- Let a participant report the opponent's preserved chain version from a completed match. Load evidence on the server rather than trusting submitted words.
- Add protected admin roles, review queue, allow/disallow/dismiss decisions, reasons, audit history, and reversals.
- Apply a disallowed ordered pair to future chain saves/selections/starts. Reverse order remains separate. Do not change an already-playing or completed snapshot.
- Add origin and payload checks, rate limits, safe text rendering, security headers, secret/answer redaction, graceful shutdown, and account deletion/revocation behavior.
- Finish keyboard, real-phone, reduced-motion, long-content, loading, and failure-state acceptance checks.

**Completion check:** reporting and an authorized ruling change future eligibility; ordinary users cannot use admin functions or obtain hidden answers through APIs, sockets, database policies, logs, or history; all automated and manual pre-release checks pass.

---

## Step 12: deploy the private online beta

- Choose a host that supports a long-running Node process, WebSockets, HTTPS, secrets, logs, and health checks.
- Use one authoritative game-server instance for the first beta and a separate staging Supabase project.
- Configure production origins, auth redirects/email, environment secrets, runtime version, migrations, proxy behavior, and deployment health checks.
- Run the full two-device flow over different networks, including reconnect, durable results, reporting, and a controlled server restart.
- Test backup restoration and rollback before inviting more players.
- Document setup, deployment, known limitations, monitoring, support, and data/account retention procedures in `README.md` and appropriate docs.

**Completion check:** invited players can create accounts/chains, share a private invite, complete both modes remotely, reconnect, see durable records, and report a problem; the owner can diagnose, restart, roll back, and restore staging without fabricating results.

## Working rule for future implementation help

When asking for help with a step, guidance should stay inside that step and always identify:

1. Which process runs the code: browser, Node server, database, or test runner.
2. Required inputs and their source. For example, browser requests do not invent `hostId`; a verified/dev session supplies it.
3. Files to edit together and existing callers that must be updated.
4. Expected result and failure behavior.
5. A terminal/browser check that proves the task is complete.

Update the snapshot and move the **CURRENT** marker only after the relevant checks pass.
