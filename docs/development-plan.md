# Build WordLink, one step at a time

## Start here

**Your next task is [Step 1: make the server imports consistent](#step-1-make-the-server-imports-consistent).**

This is the only document to follow in order. Work on one step, pass its **Check**, then move to the next. Future steps describe work you have not done yet; their files and commands may not exist. Create only the files named by the current step.

The application is yours to implement. This guide tells you what to build and how to check it; it does not mark features complete on your behalf. Update this “next task” pointer only after checking the work.

### When to use another document

| Document | When to open it |
| --- | --- |
| **This plan** | Start every coding session here. It determines the order. |
| `architecture.md` | Only when a step links to a specific definition, such as what a Game contains. It is a reference, not another checklist to follow. |
| `testing-and-operations.md` | Only when a step links to a test setup, troubleshooting entry, or deployment checklist. |
| `gamerules.md` | When you need to confirm a player-facing rule. Read it once at Step 5. |

You do not need to read all four documents before starting. Detailed design choices are preserved in the references so this guide can stay focused.

### Where this takes you

- **Steps 1-3:** run and test your existing classes in the terminal.
- **Steps 4-6:** make a complete game work without a browser.
- **Step 7:** make the browser screens usable.
- **Steps 8-12:** play and test with two local browser sessions.
- **Steps 13-16:** add real accounts, saved data, and reporting.
- **Steps 17-18:** check the finished game and put it online.

---

## Step 1: make the server imports consistent

**Work in:** `package.json`, `server/server.js`.

Your browser-side GameManager import is already removed. The remaining setup problem is that `server.js` uses `require`, while `Game.js` and `GameManager.js` use `import`/`export`.

1. Add `"type": "module"` to `package.json`.
2. In the same change, convert the `require` statements in `server.js` to `import` statements.
3. Replace its use of CommonJS `__dirname` with a directory derived from `fileURLToPath(import.meta.url)` and `path.dirname`. Keep serving only `public/`.
4. Keep the existing `npm start` command and `/health` endpoint working.

The server imports and directory setup should use this pattern:

```js
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
```

Use `path.join(serverDirectory, '../public')` in the existing static-file setup.

**Check:** run `npm start`, then open `http://localhost:3000/health`. It should return `{ "status": "ok" }` without module errors. Stop the server with Ctrl+C.

**Then:** Step 2. Do not install Socket.IO or set up Supabase yet.

## Step 2: give yourself a terminal experiment

**Work in:** new `scripts/smoke-game.js`; `Game.js` and `GameManager.js` only to align their arguments.

1. Move class experiments into this script. Import the server manager, create a game, retrieve it, and print it. The browser is not involved.
2. Supply a fixed test `hostId`. It represents the person creating the game; it is required even before real accounts exist.
3. Make the data passed by `createGame` match what `Game` expects. Your current constructor calls its third argument `roomPlayers` and reads `roomPlayers.lists`, but the manager calls the argument `playerLists`. Agree on one shape and pass it consistently; include a `lists` field for the current constructor.
4. Keep fake players/chains inside the script or private test fixtures, not production browser files.

**Check:** run `node scripts/smoke-game.js`. Verify host ID, room code, initial phase, player/list data, and that lookup returns the game you created. This checks construction, not multiplayer yet.

**Then:** Step 3. Keep updating this script as the classes evolve.

## Step 3: turn those checks into repeatable tests

**Work in:** `GameManager.js`, `Game.js`, `package.json`; new `tests/unit/GameManager.test.js`, `.nvmrc`, and `eslint.config.js`.

1. Export the manager class and create an instance in the smoke script. Each test gets its own instance so games cannot leak between tests.
2. Use Node's built-in `node:test` and `node:assert/strict`. Test creation, required host ID, lookup, and deletion.
3. Fix code generation with a bounded loop that assigns a new candidate on each collision. Your current recursive call discards its result and can return an empty code.
4. Allow tests to supply a predictable code generator. Test collision-then-success and repeated-collision failure.
5. Initially set npm's `test` script to `node --test tests/unit/GameManager.test.js`; expand it as you add tests. Set up the supported runtime and lint configuration described in the linked tooling reference.

**Check:** `npm test` passes. Deliberately break an assertion once and verify it fails. Restore it; rerun the smoke script.

**If needed:** [test commands and runtime setup](testing-and-operations.md#2-tooling-and-commands-to-add).

## Step 4: decide what a room and a game each own

**Work in:** `Game.js`, `GameManager.js`; new `Room.js`, `tests/fixtures/players.js`.

1. Create two fixed test users, Alice and Bob, with different IDs.
2. Give Room the invite code, host ID, settings, and at most two members. Give Game the state of one round between those members.
3. Use separate room and match IDs. A rematch gets a new match ID. `hostId` is Alice's user ID, not a socket ID or room code.
4. Replace unclear positional arguments with named options. Update the smoke script and tests at the same time. Supply test data through fixtures instead of a `mockGame` rule bypass.

**Check:** the host is a member; a different second player can join; the same user cannot occupy both seats; a third player is rejected.

**Definition to look up here:** [required IDs and model fields](architecture.md#3-identity-the-prerequisite-for-creating-a-game). The following section gives constructor inputs.

## Step 5: implement chain and guess rules

**Work in:** new `public/js/shared/rules.js`, `server/rules.js`, `tests/fixtures/chains.js`, rule tests.

1. Read [the game rules](gamerules.md) now. Five words means the first is revealed and four must be guessed in order.
2. Give Alice and Bob separate test chains. Alice solves Bob's chain, and Bob solves Alice's.
3. Implement case-insensitive comparison, trimming, format checks, and draft versus Ready status. Do not treat an unknown phrase as automatically banned.
4. Use one normalization function on server and browser. Only public rules/constants go in the shared file; private answer data stays server-side.

**Check:** correct guess advances once; incorrect guess does not; skipping is rejected; four correct guesses complete the chain. Test empty and invalid input.

**Choose here:** [proposed word limits and other rule defaults](architecture.md#10-product-scope-and-proposed-defaults). They are recommendations, not previously agreed rules; settle word-format choices now and other choices when their step uses them.

## Step 6: play a complete round in the terminal

**Work in:** `Game.js`, `Room.js`, manager, smoke script; new `clock.js`, `scheduler.js`, `serializers.js`, lifecycle tests.

1. Add selection, lock-in, countdown, playing, and finished states. No selection timer before the second player joins.
2. Add the 60-second selection period, automatic eligible selection, and 10-second countdown. Locking fixes a copy of that chain version.
3. Add timed win/tie, unlimited agreed draw, and pre-game/live departure rules. One round can finish only once.
4. Pass in a controllable clock so tests advance time instantly. Cancel stale timers.
5. Build a separate safe view for each player: their solved words and opponent progress, without hidden answers.

**Check:** the smoke script completes a two-player round. Unit tests cover timeout, tie, wrong phase, simultaneous finish, and hidden-answer protection.

**Use here:** [state transitions](architecture.md#5-state-machine-and-concurrency). Implement its rows in order; use the [test matrix](testing-and-operations.md#4-required-behavior-matrix) to check boundary cases.

## Step 7: build the browser screens with sample data

**Work in:** existing `app.js`, `screens.js`, `homeDom.js`, list/DOM/CSS files; add practice, editor, lobby, game, and result views as needed.

1. Register the home renderer. Build a labeled practice game with a deliberately public sample chain.
2. Build the chain editor/library and waiting, selection, match, and results views using sample state.
3. Preserve list IDs when loading data. Replace client-controlled Verified flags with displayed server-status placeholders.
4. Handle loading, empty, error, retry, pending input, and navigation cleanup. A failed data load must not crash at `forEach`.

**Check:** complete practice with Enter; navigate repeatedly without duplicated handlers; test narrow layout and keyboard focus. These screens are not connected to multiplayer yet.

**If needed:** [screen-by-screen states](architecture.md#9-frontend-acceptance-states).

## Step 8: let the local server recognize Alice and Bob

**Work in:** new `server/auth/devIdentity.js`, `server/repositories/memory.js`, `server/config.js`, fixture factory, `public/js/auth.js`.

1. Add a development-only choice of Alice or Bob. The server issues a random session token and maps it to that test user.
2. Load their separately owned chains into the running server's memory. A seed script in another Node process cannot change these maps.
3. Require an owned Ready chain for both creating and joining a room.
4. Restrict this test login to loopback development. It must not work online. Add ignored local/test environment files and an example without secrets.

**Check:** each session sees only its own chains; a submitted fake user ID cannot change its identity.

**Use here:** [identity flow](architecture.md#3-identity-the-prerequisite-for-creating-a-game) and [environment settings](testing-and-operations.md#environment-contract).

## Step 9: connect the browser to the server

**Work in:** `server.js`; new `server/app.js`, HTTP/socket handlers, `services/gameService.js`, `public/js/api.js`, `socket.js`.

1. Separate Express app creation from listening. Attach Socket.IO to the same HTTP server and install its matching test client.
2. Authenticate the connection before enabling create/join. The server takes `hostId` from the session; the browser sends settings, not an authoritative host ID.
3. Add create/join, select/lock, and guess requests. Handlers call the game code you already tested.
4. Return only safe player views. Add request IDs, acknowledgements, and duplicate protection so retrying cannot apply an action twice.

**Check:** add `test:integration`; use real HTTP/socket clients to create/join/guess. Reject wrong-user actions and attempts to read hidden answers.

**Use here:** [HTTP and socket payloads](architecture.md#6-public-state-and-transport-contracts).

## Step 10: play from two local browser sessions

**Work in:** the browser views, store, API, and socket connection.

1. Open two separate browser profiles or normal/private sessions. Choose Alice in one and Bob in the other.
2. Create a room, share its code, join, select chains, lock, and play through results.
3. Make every screen respond to the latest server view. The browser displays clocks and results; it does not decide them.
4. Test both game modes, wrong guesses, full/invalid rooms, no Ready chain, and pre-game departure.

**Check:** both players see the same outcome; neither sees future opponent words in Network responses. This is your first complete local-play milestone.

**Follow here:** [two-player walkthrough](testing-and-operations.md#level-d-manual-two-player-local-play).

## Step 11: handle refreshes, disconnects, and retries

**Work in:** game service, scheduler, socket/session registry, store, reconnect UI.

1. Restore the current authorized state on reconnect, rather than assuming every socket message arrived.
2. Implement the chosen disconnect grace, explicit-leave, both-disconnected, and multiple-tab policies.
3. Ignore old timers, old match requests, and duplicate commands. Serialize room changes so overlapping requests cannot overfill or finish twice.
4. Clean up ended rooms, membership records, timers, and listeners.

**Check:** refresh during selection/play, lose a connection, reconnect, retry a request, and open another tab. Each must have one predictable result.

**Use here:** [state and disconnect rules](architecture.md#5-state-machine-and-concurrency); use the relevant rows in the [test matrix](testing-and-operations.md#4-required-behavior-matrix).

## Step 12: automate the local player journey

**Work in:** new `playwright.config.js`, `tests/e2e/`, test-server helper, CI workflow.

1. Add Playwright and its browsers. Give tests their own server/port and resettable data.
2. Automate two isolated browser contexts completing a match, plus refresh, invalid invite, and failed-request cases.
3. Add `test:e2e`; keep `npm test` running unit/integration tests. Run both in Linux CI to catch filename-case problems.

**Check:** tests pass from a clean checkout without a manually running server. A broken create/join/guess flow causes failure.

**Use here:** [browser-test setup](testing-and-operations.md#level-e-browser-automation).

## Step 13: replace test identities with real accounts

**Work in:** Supabase migrations/config, server auth/account service, browser auth views and SDK bundle.

1. Create local Supabase or a separate development project. Define the schema and permissions before storing real users' chains.
2. Add signup, confirmation, login, logout, password reset, and profile creation.
3. Verify tokens server-side. The verified user's ID now supplies the same `actorId`/`hostId` used by the fixture system.
4. Keep elevated database keys server-side; handle session expiry and refresh. Disable fixture authentication outside local tests.

**Check:** two real accounts have distinct identities; expired/forged sessions fail. Add `test:db` and test access as ordinary users.

**Use here:** [database and permissions](architecture.md#7-database-and-durable-outcomes), then [real-auth test setup](testing-and-operations.md#level-f-real-auth-and-database).

## Step 14: save private chains permanently

**Work in:** Supabase repository, chain service, library/editor, database tests.

1. Replace memory-only chain storage with owned database records.
2. Support create/edit/archive, incomplete drafts, and Ready status. Each edit creates an immutable version; preserve IDs and detect concurrent edits.
3. Lock an exact version for a match. Editing or archiving the library entry must not change an ongoing match or remove its evidence.

**Check:** chains survive restart/login on another device; Alice cannot read/edit Bob's through either the API or direct database access. Repeat local play with real saved chains.

**Use here:** [chain tables and transactions](architecture.md#7-database-and-durable-outcomes).

## Step 15: record results and recover from failures

**Work in:** result service, match database functions, results/profile views, recovery tests.

1. Save both participants and locked evidence before competitive play begins.
2. Record both outcomes together, once. Show pending versus recorded status accurately; derive records from finalized matches.
3. Retry uncertain writes safely. If the process restarts, preserve committed results and mark unresolved matches interrupted under the documented beta policy.

**Check:** repeated finalization does not award twice; a failed write does not claim success; restart keeps saved results. Test both a failed write and a committed write whose response was lost.

**Use here:** [durable-outcome rules](architecture.md#7-database-and-durable-outcomes) and [failure behavior](testing-and-operations.md#7-failure-handling-monitoring-and-recovery).

## Step 16: add reporting and admin review

**Work in:** report/decision migrations, moderation service/routes, results/admin views, protected admin setup.

1. Allow participants to report their completed match using the server's preserved chain evidence.
2. Give authorized admins a review queue, decisions, reasons, and audited reversals. Report counts alone do not ban anything.
3. Apply an ordered-pair ban to every future chain use. Unknown connections remain playable; a new ban must not alter a match already in play.

**Check:** report a match, issue a ban, and verify future use is blocked. Test an unauthorized admin action and a ban during countdown.

**Use here:** [moderation data and permissions](architecture.md#7-database-and-durable-outcomes) and report/moderation rows in the [test matrix](testing-and-operations.md#4-required-behavior-matrix).

## Step 17: check the whole game before deployment

**Work in:** existing code, security/config, tests, account/support documentation.

1. Finish rate limits, payload limits, safe text rendering, origin checks, and private-log protection. Ensure online startup rejects fixture login and memory-only persistence.
2. Test keyboard/mobile use, useful error states, refreshes, account deletion/revocation, and long allowed content. Finalize proposed rules with the owner and update player instructions.
3. Run unit, integration, database, and browser suites. Complete the remaining [behavior matrix](testing-and-operations.md#4-required-behavior-matrix), not just the happy path.

**Check:** both real accounts complete both modes; unauthorized access and hidden-answer tests pass; errors/reconnects have clear outcomes.

**For a physical phone:** follow [the LAN/HTTPS guidance](testing-and-operations.md#level-g-a-phone-on-the-same-network). Do not expose fixture login to the internet.

## Step 18: deploy, verify remote play, and maintain it

**Work in:** hosting/environment configuration, deployment workflow, setup README.

1. Choose budget/provider/domain and a host that supports a persistent Node process and WebSockets. Start with one game-server instance and separate staging data.
2. Configure HTTPS, auth redirects/email, secrets, migrations, health checks, and the supported runtime. Build and deploy from a clean checkout.
3. Play with someone on another network. Test both modes, reconnect, durable results, reporting, and server restart.
4. Test backup restoration and rollback; document known limitations, support, monitoring, and update procedures before inviting more players.

**Check:** complete the [online deployment checklist](testing-and-operations.md#6-online-deployment-checklist) and [final release gate](testing-and-operations.md#8-final-release-gate). Record the deployed version and results.

After launch, use the [operations reference](testing-and-operations.md#7-failure-handling-monitoring-and-recovery) when updating or recovering the service. Public matchmaking and multiple server instances are later projects, not prerequisites for private online play.

---

## How to continue a coding session

Start with the first unfinished step. You can say **“Help me with Step 1”** and the guidance should stay within that step: explain it, identify the exact edits, let you implement them, and check the result. It should not send you through the entire reference library or add unrelated architecture work.

Current progress: browser backend import removed; remaining work starts at Step 1. No later step is marked finished by this documentation rewrite.
