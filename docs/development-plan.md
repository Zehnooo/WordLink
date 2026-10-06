# WordLink Development Plan

Last reviewed against GitHub `main` at commit `77ce419` on 2026-10-05.

## How to use this file

This is the implementation order for WordLink. Work from the first step marked **CURRENT** and do not begin later infrastructure early just because it will eventually be needed.

For every step:

1. Read the **Goal** first so you know what the step is trying to prove.
2. Follow the numbered substeps in order unless one explicitly says it can be done in parallel.
3. Keep changes inside the files listed for that step unless a required caller/import must also be updated.
4. Run the listed tests/checks before marking the step complete.
5. Only move **CURRENT** to the next step after every completion check passes.

`docs/gamerules.md` is the source of truth for gameplay and lobby behavior. This file describes implementation order; it does not replace the game rules.

The current task is **Step 2: stabilize and test the room/game foundation**.

---

# Current codebase snapshot

## Implemented and working

- The project uses ES modules through `"type": "module"`.
- `server/server.js` starts Express, serves only `public/`, and exposes `/health`.
- Browser code no longer imports server-only game classes.
- `Room` and `RoomManager` exist under `server/room/`.
- Rooms currently track:
  - internal UUID
  - public five-character room code
  - creation/closure timestamps
  - host ID
  - player membership
  - linked game ID
  - open/closed state
- `RoomManager` stores rooms by internal room ID and maintains a separate room-code → room-ID lookup map.
- Room joining already handles:
  - first player becoming host
  - second player joining
  - duplicate join rejection
  - missing room rejection
  - closed room rejection
  - two-player capacity
- `Game` and `GameManager` exist under `server/game/`.
- `Game` currently tracks:
  - game ID
  - room ID
  - copied player array
  - duration
  - created/started/ended timestamps
  - `pre-game → live-game → end-game` transitions
  - placeholder `results`
- `tests/fixtures/players.js` now exists with stable Bob, Alice, and Carol fixtures.
- `tests/unit/GameManager.test.js` exists and currently exercises basic storage/list/delete behavior.
- `package.json` now has `node --test tests/unit/**/*.test.js` as the test script.
- The browser already has a navigation/screen shell, mock chain-list rendering, a home-view stub, and the current dark-violet visual theme.

## Current problems that must be fixed before Step 3

- `scripts/smoke-game.js` currently references `bob` and `jim` without importing/defining them, so the smoke script is broken.
- `tests/unit/Game.test.js` is empty.
- `tests/unit/RoomManager.test.js` is empty.
- `GameManager.test.js` currently tests some behavior that Step 2 is supposed to make invalid, including creating games with zero or one player.
- Host leave behavior is wrong: `RoomManager` currently transfers host to the remaining player. The game rules require the room to close when the host leaves before the match.
- `Room.close()` does not currently clear/remove players or cause manager cleanup.
- Permanently closed rooms remain in `RoomManager` indefinitely.
- `joinRoom()` and `leaveRoom()` can accidentally throw when the supplied player is missing or malformed.
- Room-code generation uses unbounded `Math.random()` retries.
- `Room` and `Game` directly call UUID/time functions, making deterministic tests harder.
- `GameManager.createGame()` accepts unknown rooms, zero/one players, duplicate players, invalid durations, and missing values.
- Game creation and `room.setLinkedGame()` are separate caller actions, so room/game state can become partially linked.
- Room list-selection/lock-in state does not exist yet. That belongs to Step 3 and should not be added during Step 2.
- Socket.IO, authentication, persistence, and Supabase are intentionally not implemented yet.

---

# Step 1 — DONE: establish a runnable server foundation

## Goal

Have one clean Node/Express entry point that can run independently of the browser and provide a stable base for later server-side game logic.

## Files involved

- `package.json`
- `server/server.js`
- `public/js/app.js`

## Completed work

- Set package mode to ES modules.
- Converted the server entry from CommonJS to `import` syntax.
- Replaced CommonJS path helpers with `fileURLToPath(import.meta.url)`.
- Limited static serving to `public/`.
- Removed server-only imports from browser code.
- Added/kept `GET /health`.

## Completion evidence

- `node server/server.js` starts successfully.
- `GET http://localhost:3000/health` returns `{"status":"ok"}`.

---

# Step 2 — CURRENT: stabilize and test the room/game foundation

## Goal

Before adding real gameplay, make the existing Room/Game model predictable, validated, and fully testable from the terminal.

At the end of this step, you should be able to trust these statements:

- a room cannot enter an impossible membership state;
- host/non-host leave behavior matches the rules;
- a game cannot be created with invalid participants or configuration;
- room codes cannot retry forever;
- tests can control IDs and time instead of depending on randomness;
- room ↔ game linking happens as one coordinated action;
- the full foundation can be verified with `npm test` and one smoke script.

Do **not** add list selection, countdown logic, guesses, sockets, users/accounts, or a database yet.

## Files involved

Existing:

- `server/room/Room.js`
- `server/room/RoomManager.js`
- `server/game/Game.js`
- `server/game/GameManager.js`
- `scripts/smoke-game.js`
- `package.json`
- `tests/fixtures/players.js`

Tests to complete:

- `tests/unit/RoomManager.test.js`
- `tests/unit/Game.test.js`
- `tests/unit/GameManager.test.js`

---

## 2A — Verify the local test runner

### Goal

Make sure test failures/successes are real and not being hidden by a broken local Node/npm setup.

### Do this

1. Run:

   ```bash
   node --version
   npm --version
   ```

2. If `node` works but `npm` is broken, repair the local Node/npm installation before relying on npm scripts.
3. Confirm `package.json` contains:

   ```json
   "test": "node --test tests/unit/**/*.test.js"
   ```

4. Run the existing tests directly once:

   ```bash
   node --test tests/unit/**/*.test.js
   ```

5. Run them through npm:

   ```bash
   npm test
   ```

### Expected result

Both commands should invoke the same unit-test files and return a non-zero exit code when a test fails.

### Done when

- `npm --version` works.
- `npm test` launches Node's test runner.
- You have manually changed one assertion to be wrong, confirmed the command fails, restored it, and confirmed it passes again.

---

## 2B — Repair and simplify `scripts/smoke-game.js`

### Goal

Keep one readable demonstration of the happy path. The smoke script is not where edge cases belong.

### Current problem

The script currently references `bob` and `jim` without defining/importing them.

### Do this

1. Import the fixture players from `tests/fixtures/players.js` or create a dedicated fixture import that the script can safely reuse.
2. Use exactly two players, preferably Bob and Alice.
3. The script should perform only this sequence:

   ```text
   create room
   → Bob joins
   → Alice joins
   → create/link one valid game
   → start game
   → end game
   → print compact final summary
   ```

4. Remove experimental duplicate joins, invalid cases, and large object dumps from the smoke script.
5. Do not remove either player before game creation.
6. Do not use long real-time waits. If Step 2's clock injection is already finished, use the controllable clock. Otherwise make transitions directly because this script is only demonstrating model behavior.
7. Print only useful values, for example:

   ```text
   Room ABC12: 2 players, linked game game-1
   Game game-1: pre-game -> live-game -> end-game
   ```

### Done when

```bash
node scripts/smoke-game.js
```

runs without error and shows one valid room/game lifecycle.

---

## 2C — Write RoomManager tests before changing RoomManager behavior

### Goal

Define the exact room rules in tests before refactoring the implementation.

### File

- `tests/unit/RoomManager.test.js`

### Build tests for these cases

#### Room creation

- `createRoom()` returns a room.
- The room has an internal ID.
- The room has a five-character public code.
- The room starts open.
- The room starts with zero players.
- The room starts with no host.
- The room starts with no linked game.

#### First join

- First valid player can join.
- First player becomes host.
- Player count becomes 1.
- `getPlayers()` returns that player.

#### Second join

- A different second player can join.
- Host remains the first player.
- Player count becomes 2.

#### Invalid joins

- Same player cannot join twice.
- Third player cannot join.
- Unknown room code is rejected.
- Closed room is rejected.
- `undefined` player is rejected cleanly.
- `null` player is rejected cleanly.
- `{}` without an ID is rejected cleanly.
- A malformed player must return the manager's chosen failure shape, not throw an accidental TypeError.

#### Non-host leave

Start with Bob as host and Alice as second player.

When Alice leaves:

- leave succeeds;
- Bob remains in the room;
- Bob remains host;
- room stays open;
- player count becomes 1;
- room returns to waiting-for-second-player state conceptually.

Do not implement selection-timer cleanup yet; that belongs in Step 3.

#### Host leave

Start with Bob as host and Alice as second player.

When Bob leaves before the game:

- the room closes;
- host is not transferred to Alice;
- Alice is removed/released from the room;
- player count becomes 0;
- host ID becomes `null` or another clearly documented closed-room value;
- a second host-leave/close attempt does not corrupt state.

#### Missing player leave

- Leaving with a player who is not in the room returns a clean failure.
- It must not change room membership.

### Important

At this point tests may fail. That is expected. The next substep changes the implementation to satisfy them.

---

## 2D — Refactor Room/RoomManager until the room tests pass

### Goal

Make room behavior match `docs/gamerules.md` exactly for pre-game membership.

### In `Room.js`

Keep Room focused on state it owns:

- room ID
- code
- timestamps
- host ID
- linked game ID
- open/closed state
- private player collection

Add/refine methods only where they make state changes safer, for example:

- `addPlayer(player)`
- `removePlayer(playerId)`
- `clearPlayers()` if needed for host-close behavior
- `close()`
- `setLinkedGame(gameId)`
- getters that return copies rather than the private array

Do not put lookup logic or room-code generation inside Room.

### In `RoomManager.js`

#### Validate player input first

Before accessing `player.id`, explicitly validate that:

- a player object exists;
- it has a non-empty stable ID;
- any other property required by Step 2 is present.

Choose one manager result shape and use it consistently. For example:

```js
{ success: true, value: room }
{ success: false, error: 'ROOM_FULL' }
```

or your existing message-based style.

The exact shape is your choice, but RoomManager and GameManager should eventually follow the same convention.

#### Fix host departure

Remove host transfer logic.

If the host leaves before a game is active:

1. remove/release every player from that lobby;
2. clear host state;
3. close the room;
4. mark `closedAt`;
5. make the room unavailable for future joins.

#### Keep non-host departure simple

If the second player leaves before play:

- remove only that player;
- keep the host;
- keep the room open;
- do not assign a new host.

### Done when

Every RoomManager test from 2C passes.

---

## 2E — Add deterministic IDs, clocks, and room-code generation

### Goal

Tests should not depend on random UUIDs, `Date.now()`, or unpredictable room codes.

### Why this is needed

You need to be able to write tests such as:

```text
clock says 1000 -> room.createdAt === 1000
clock says 2000 -> room.closedAt === 2000
first generated code collides
second generated code succeeds
```

without mocking globals.

### Recommended approach

Pass dependency functions into managers/constructors with production defaults.

Conceptually:

```js
new RoomManager({
  idFactory: crypto.randomUUID,
  now: Date.now,
  codeFactory: defaultCodeFactory,
  maxCodeAttempts: 10,
});
```

and equivalent dependencies for Game/GameManager.

You do not have to use exactly this syntax, but tests must be able to provide deterministic replacements.

### Room-code requirements

1. Production codes remain five characters using the chosen allowed character set.
2. Collision lookup must use the existing code map.
3. Retry count must be bounded.
4. If a collision happens and the next generated code is free, room creation succeeds with the second code.
5. If every attempt collides until the retry limit is reached, room creation fails with a clear controlled error.

### Add tests

- deterministic room ID
- deterministic `createdAt`
- deterministic `closedAt`
- forced code collision then success
- repeated collisions then clear failure

### Done when

No Room/RoomManager test needs to depend on actual randomness or wall-clock time.

---

## 2F — Write `Game.test.js`

### Goal

Test the Game object's own state rules separately from GameManager storage/validation.

### File

- `tests/unit/Game.test.js`

### Test construction

Given a valid room ID, two players, duration, injected ID, and injected clock:

- game gets expected ID;
- game stores the correct room ID;
- game starts in `pre-game`;
- `createdAt` uses the injected clock;
- `startedAt` starts as `null`;
- `endedAt` starts as `null`;
- duration is stored correctly;
- `results` starts as `null`;
- player array is copied.

### Test array protection

1. Create `roster = [bob, alice]`.
2. Construct Game.
3. Modify `roster` afterward.
4. Confirm Game membership does not change.
5. Call `game.getPlayers()` and mutate the returned array.
6. Confirm Game membership still does not change.

Step 2 only requires protection of the membership array itself. Deep immutable chain snapshots come in Step 3.

### Test valid transitions

#### Start

`pre-game → startGame()` should:

- succeed;
- set phase to `live-game`;
- set `startedAt`;
- finish the pre-game timestamp;
- start the live-game timestamp.

#### End

`live-game → endGame()` should:

- succeed;
- set phase to `end-game`;
- set `endedAt`;
- finish the live-game timestamp;
- start the end-game timestamp.

### Test invalid transitions

- `endGame()` before start is rejected.
- `startGame()` twice is rejected.
- `startGame()` after end is rejected.
- `endGame()` twice is rejected.
- Invalid attempts do not alter timestamps or phase.

### Done when

`Game.test.js` passes independently:

```bash
node --test tests/unit/Game.test.js
```

---

## 2G — Define valid game creation rules

### Goal

Move validation into the manager/service boundary so callers cannot construct impossible games accidentally.

### Game creation must require

- a real existing Room;
- that Room is open/eligible for creation at this Step 2 level;
- exactly two players;
- two distinct player IDs;
- those participants match the room's current two members;
- a supported duration/mode value;
- no existing linked game for that room.

### Duration decision

Pick one explicit representation now and document it in code/tests.

For example, if v1 timed games use seconds:

```text
60
120
180
300
```

and unlimited mode may later be represented separately.

Do not leave duration as arbitrary `undefined`, negative values, strings, or any number unless that is intentionally part of the game rules.

### Important Step 2 boundary

You are **not** checking locked lists yet. Step 3 will strengthen game creation so it only happens when both lobby participants have locked eligible lists.

---

## 2H — Refactor GameManager around a coordinated room → game creation operation

### Goal

A caller should not have to do this anymore:

```js
const game = gm.createGame(...);
room.setLinkedGame(game.id);
```

because those two actions can get out of sync.

### Preferred responsibility

Create one operation that has access to both managers/state and performs this sequence:

1. resolve the room;
2. validate the room;
3. validate its two players;
4. validate duration;
5. make sure no game is already linked;
6. create Game;
7. register Game in GameManager;
8. set `room.linkedGameId`;
9. return success only after both registrations succeed.

This operation can live in GameManager for Step 2 if that keeps the project simple. A service layer can be introduced later when networking arrives.

### Failure rule

No partial linking.

If creation fails:

- the GameManager must not retain a new game;
- the Room must not contain a new `linkedGameId`.

### Update tests

Replace tests that currently approve invalid games.

Remove/rewrite tests such as:

```text
createGame defaults players to []
create one-player game
```

Those should become rejection cases.

### GameManager tests to have by the end

- valid room creates one game;
- returned game is stored by ID;
- game contains exactly the room's two players;
- unknown room rejected;
- zero players rejected;
- one player rejected;
- three players rejected;
- duplicate player IDs rejected;
- mismatched players rejected;
- invalid duration rejected;
- room already linked to game rejected;
- valid creation links room and game exactly once;
- failed creation leaves neither side partially linked;
- `getGame()` works;
- `getGameList()` returns copies/list contents as intended;
- `deleteGame()` behavior is explicitly tested.

### Done when

`GameManager.test.js` reflects the rules you actually want, not temporary permissive behavior.

---

## 2I — Add closed-room cleanup

### Goal

Do not leave permanently closed room objects and public codes active forever.

### Add manager behavior

Create a clear cleanup path, for example:

- `deleteRoom(roomId)`
- `deleteRoomByCode(code)`
- `cleanupClosedRoom(roomId)`

The exact name is not important. What matters is that deleting a room removes both:

- the room from `#rooms`;
- the code mapping from `#roomCodes`.

### Test

1. Create room.
2. Save its ID/code.
3. Close/delete it.
4. Confirm lookup by ID fails.
5. Confirm lookup by code fails.
6. Confirm the old code can be generated/reused later if your code generator produces it again.

### Done when

Closed rooms do not leak indefinitely through manager maps.

---

## Step 2 final verification

Run these individually first:

```bash
node --test tests/unit/RoomManager.test.js
node --test tests/unit/Game.test.js
node --test tests/unit/GameManager.test.js
```

Then:

```bash
npm test
```

Then:

```bash
node scripts/smoke-game.js
```

### Step 2 is DONE only when all are true

- all RoomManager tests pass;
- all Game tests pass;
- all GameManager tests pass;
- `npm test` passes;
- intentionally breaking one assertion causes `npm test` to fail;
- restoring it causes tests to pass;
- smoke script demonstrates one valid two-player lifecycle;
- host leaving closes the lobby rather than transferring host;
- invalid players fail cleanly;
- room-code retries are bounded/testable;
- IDs/timestamps can be controlled in tests;
- invalid games cannot be created;
- room/game linking is coordinated;
- no browser is required for any Step 2 verification.

Only then move **CURRENT** to Step 3.

---

# Step 3 — NEXT: build the complete lobby and terminal game rules

## Goal

Turn the stable Room/Game foundation into the actual WordLink domain model before networking or browser integration.

By the end of Step 3, two fixture players should be able to complete the entire game from the terminal:

```text
room created
→ second player joins
→ 60-second list-selection phase begins
→ each player selects and locks a list
→ second lock creates one Game automatically
→ 10-second countdown
→ live guessing
→ winner / timed result / agreed draw
→ immutable final result
```

The central architecture rule is:

> **Room owns lobby readiness. Game owns the match after both players are ready.**

## Files involved

Existing:

- `server/room/Room.js`
- `server/room/RoomManager.js`
- `server/game/Game.js`
- `server/game/GameManager.js`
- `docs/gamerules.md`

Create as needed:

- `server/rules.js`
- `tests/fixtures/chains.js`
- focused unit test files for room selection/gameplay

Only create `public/js/shared/rules.js` if the browser later needs genuinely reusable non-secret formatting/validation helpers.

---

## 3A — Define chain/list fixtures and eligibility terminology

### Goal

Give tests stable chain data and make the states Draft/Ready/Blocked unambiguous.

### Create fixtures

At minimum include:

- two valid five-word Ready chains owned by Bob;
- two valid five-word Ready chains owned by Alice;
- one malformed chain for validation tests;
- one Blocked chain for eligibility rejection tests;
- stable list IDs.

### Define eligibility

Use the terminology from the game rules:

- **Draft** — not eligible for multiplayer selection.
- **Ready** — structurally complete and not blocked; allowed to be selected.
- **Blocked** — cannot be used.

Unknown/unreviewed word connections may still be Ready. Admin review comes later.

### Do not do yet

- no database IDs;
- no Supabase;
- no moderation tables;
- no client-controlled `verified` authority.

---

## 3B — Add per-player lobby selection state to Room

### Goal

Room should know what each joined player has selected and whether that choice is locked.

### Recommended state shape

You can keep simple records keyed by player ID, for example conceptually:

```js
selectionByPlayerId = new Map([
  ['bob-id', { listId: null, locked: false }],
  ['alice-id', { listId: null, locked: false }],
]);
```

You do not need a `Player` or `GameParticipant` class just to hold this data.

### Required operations

Room/RoomManager should support behavior equivalent to:

- player selects one owned Ready list;
- player changes selection before locking;
- player locks current selection;
- player cannot lock without a valid selection;
- player cannot alter selection after locking;
- player cannot unlock after locking;
- player cannot select another user's list;
- player cannot select Draft/Blocked/missing list;
- room can answer whether both players are locked.

### Tests

- Bob selects list A.
- Bob changes to list B before lock.
- Bob locks B.
- Bob cannot change back to A.
- Alice can independently select/lock her own list.
- invalid/non-owned/non-Ready selection rejected.

---

## 3C — Implement the 60-second selection deadline

### Goal

Once the second player joins, both players get a selection deadline.

### Rules

- No timer runs while only one player is in the room.
- When player two joins, start the selection deadline.
- If one/both players lock early, keep waiting for the other player as needed.
- At deadline, each still-unlocked player gets an automatic selection from that player's eligible Ready lists and becomes locked.
- Auto-selection must never select another user's list.
- If a player somehow has no eligible list, return a controlled failure/state rather than silently creating an invalid match. Step 5 will prevent such users from joining in the first place.

### Timer architecture

Inject a scheduler/clock. Tests must advance fake time directly rather than sleeping for 60 real seconds.

### Stale timer protection

Timer callbacks must verify they still belong to the current room/lobby state before changing anything.

A stale timer must do nothing after:

- room closed;
- second player left;
- lobby state restarted;
- game already created.

### Tests

- second join starts selection timing;
- first player alone does not start timing;
- unlocked player gets auto-selected at deadline;
- manually locked player is not replaced;
- stale deadline cannot modify closed/reset room.

---

## 3D — Handle lobby departure/reset correctly

### Host leaves before game

Use Step 2 rule:

- close lobby;
- remove/release remaining player;
- cancel selection deadline;
- prevent future lock commands from mutating it.

### Non-host leaves before game

- remove only non-host;
- keep host;
- cancel active selection deadline;
- clear/reset temporary selection state that depended on the two-player lobby;
- return to waiting-for-second-player state;
- when another player later joins, start a fresh selection phase.

### Tests

Test both departures while:

- neither player locked;
- one player locked;
- deadline callback is still scheduled.

---

## 3E — Define the exact lobby → Game boundary

### Goal

Game creation should happen automatically and exactly once when both players are locked.

### Required flow

When a lock operation completes:

1. update that player's lock state;
2. check whether both room players are locked;
3. if not, return lobby state only;
4. if yes, build two participant snapshots;
5. create/register Game;
6. set `room.linkedGameId`;
7. prevent duplicate/stale lock commands from creating another Game.

There is no host `Start Game` button in the domain model.

### Participant snapshot contents

Each Game participant should contain only the match data needed from that player, such as:

- stable player ID;
- display username;
- selected list ID/version if useful;
- immutable copy of the exact five-word chain used in this match;
- match progress initialized separately.

### Snapshot rule

After Game creation, modifying the original saved list or Room selection object must not change the Game's chain.

### Tests

- zero locks → no game;
- one lock → no game;
- second lock → exactly one game;
- duplicate second lock → still exactly one game;
- room links to that game ID;
- game refers back to room ID;
- later mutation of source list does not alter match snapshot.

---

## 3F — Add the 10-second match countdown

### Goal

The Game exists after both locks, but live guessing does not begin until countdown completes.

### State

You may keep the current `pre-game` phase to represent Game countdown.

Conceptually:

```text
Room selection phase
→ both locked
→ Game created in pre-game/countdown
→ countdown expires
→ Game live-game
```

### Requirements

- countdown begins once at Game creation;
- fake scheduler controls it in tests;
- duplicate/stale callback cannot start the game twice;
- no guess is accepted before live phase.

### Tests

- game remains non-live before countdown expiration;
- exact timer completion starts live phase once;
- stale countdown after finalized/invalid game does nothing.

---

## 3G — Implement guess handling and player progress

### Goal

Implement the central WordLink interaction without leaking hidden words.

### Rules from `docs/gamerules.md`

- opponent's first word is visible when live gameplay starts;
- player must guess words 2, 3, 4, and 5 in order;
- comparisons are case-insensitive;
- exact word guesses are required;
- players cannot skip ahead;
- incorrect guess does not advance progress.

### Normalize input

At minimum:

- trim surrounding whitespace;
- compare normalized casing.

Before implementing validation, decide/document:

- allowed characters;
- max word length;
- whether spaces/hyphens/apostrophes are legal inside an answer.

### Progress state

Keep match progress separate for each participant. For example:

```text
Bob progress solving Alice: 0..4 guessed hidden words
Alice progress solving Bob: 0..4 guessed hidden words
```

Do not modify persistent user/list objects.

### Tests

- correct next word advances exactly one;
- wrong word does not advance;
- different casing still matches;
- surrounding whitespace is normalized;
- future word cannot be skipped to;
- once all four hidden words are solved, completion is triggered.

---

## 3H — Implement timed-game ending

### Goal

Timed matches finish either on chain completion or timer expiration.

### On immediate chain completion

- first participant to solve all four hidden words wins;
- finalize once;
- stop/ignore remaining game timer callbacks.

### On timer expiration

Compare progress:

- higher correct-word count wins;
- equal progress produces draw.

### Tests

- Bob completes chain before timer → Bob win;
- Alice completes first → Alice win;
- timeout Bob 3 vs Alice 2 → Bob win;
- timeout 2 vs 2 → draw;
- stale timeout after already-completed game does nothing.

---

## 3I — Implement unlimited-game agreed draw

### Goal

Unlimited mode has no gameplay timeout and ends only by full completion or mutual draw agreement.

### Required state

Track each participant's current draw agreement/request.

### Behavior

- one player requesting draw does not finish match;
- both players agreeing produces draw;
- a duplicate request has no duplicate effect;
- define whether a player can cancel a request before agreement and document that choice;
- full chain completion before agreement still produces a win.

### Tests

Cover each case above.

---

## 3J — Create one immutable terminal result

### Goal

Every game ends with one server-owned result object that later persistence can trust.

### Result should include enough evidence for later steps

At minimum:

- game ID;
- room ID;
- result type: win/draw;
- winner/loser IDs when applicable;
- reason, such as:
  - `CHAIN_COMPLETED`
  - `TIME_EXPIRED`
  - `AGREED_DRAW`
- final progress/scores;
- completed timestamp.

Once finalized:

- result cannot be replaced;
- game cannot return to live state;
- duplicate end conditions return/recognize the existing result.

### Tests

- completion finalizes once;
- timeout finalizes once;
- agreed draw finalizes once;
- duplicate callbacks cannot overwrite result;
- client/user input never directly chooses winner.

---

## 3K — Build player-specific safe state

### Goal

The server/domain may know both chains, but each client-facing state must hide the opponent's unsolved words.

### Before live game

A player may receive lobby/countdown information needed by the UI, but never the opponent's full locked chain.

### During live game

For Bob solving Alice's chain, Bob may see:

- revealed first word;
- words he has already solved;
- placeholders for unsolved words;
- his own progress;
- opponent progress if the game design allows it.

Bob must **not** receive Alice's unsolved answers anywhere in serialized state.

### After final result

Define whether full chains become visible in results. Follow `gamerules.md`/product decision and test it explicitly.

### Tests

Inspect returned safe-state objects and verify hidden answers do not exist anywhere in them before allowed reveal.

---

## Step 3 final verification

Create/update the smoke script to demonstrate:

```text
create room
→ join Bob
→ join Alice
→ both select lists
→ both lock
→ Game auto-created exactly once
→ countdown
→ live guesses
→ winner / timeout / draw
→ final result
```

### Step 3 is DONE only when

- selection can change before lock but not after;
- invalid/non-owned/non-Ready lists are rejected;
- 60-second auto-selection is deterministic in tests;
- host/non-host lobby departure rules work;
- second lock creates exactly one Game;
- Game owns immutable chain snapshots;
- countdown works without real waiting;
- guesses advance sequentially only;
- timed winner/tie behavior works;
- unlimited agreed draw works;
- one immutable result is produced;
- safe state never leaks unsolved answers;
- all unit tests pass.

---

# Step 4: finish every browser screen using sample/local state

## Goal

Build the full user experience before networking it. The browser should be able to navigate through realistic mock/sample states shaped exactly like the server state from Step 3.

This step is intentionally frontend-only.

## Files involved

Existing files under `public/`, plus focused modules under `public/js/` as needed.

Do not connect Socket.IO or real accounts yet.

---

## 4A — Fix the screen/navigation foundation

### Do this

- Register `homeView` in `screens.js`.
- Make every route/screen resolve to a real render function.
- Give screens a consistent lifecycle such as:
  - `render()`
  - `load()` if async data is needed
  - `dispose()` to remove listeners/timers
- Ensure navigating away and back does not duplicate event listeners.

### Test manually

Navigate repeatedly among all screens and confirm one click produces one action.

---

## 4B — Fix list hydration/data loading

### Current problems

- `List` creates fresh IDs while hydrating existing data.
- browser data can currently set `verified`/eligibility authority.
- `loadData()` can return `undefined`, then renderer calls `forEach`.

### Fix

- preserve IDs supplied by loaded data;
- model display status without allowing browser code to grant Ready eligibility;
- make `loadData()` either:
  - return validated usable data; or
  - return/throw a structured failure;
- never call collection methods on an undefined result.

### UI states

Implement:

- loading;
- successful load;
- empty library;
- failure;
- retry.

---

## 4C — Build Home screen

Home should clearly expose the intended primary actions, for example:

- Create Game
- Join Game
- My Chains
- Practice

No real multiplayer actions yet; buttons navigate to sample/local screens.

---

## 4D — Build chain library/editor

### Library

Show saved chain cards with:

- chain name if used;
- five words or appropriate preview;
- Draft/Ready/Blocked display state;
- edit action;
- create action.

### Editor

Support exactly five ordered word inputs.

Browser validation can provide usability feedback, but final multiplayer eligibility remains server-owned later.

Handle:

- new chain;
- edit existing chain;
- cancel;
- save-success mock;
- validation errors.

---

## 4E — Build waiting-room/list-selection screen

Model the Step 3 Room state.

Show:

- room/invite code;
- host/player names;
- waiting-for-player state;
- 60-second selection countdown once two are present;
- player's eligible list choices;
- current selected list;
- Lock In button;
- locked state;
- opponent ready/not-ready state without revealing opponent chain.

Support sample transitions:

```text
host alone
→ second player joined
→ select list
→ change list
→ lock
→ both locked
```

---

## 4F — Build countdown screen

Show the 10-second pre-match countdown using sample state.

Requirements:

- clear countdown text;
- keyboard/mobile accessible;
- does not expose hidden opponent words;
- handles navigation/re-render cleanly.

---

## 4G — Build live-game screen

Show:

- revealed first word;
- placeholders/solved chain positions;
- guess input;
- submit action;
- timer when in timed mode;
- progress/status;
- draw action in unlimited mode if applicable.

### Keyboard requirement

Desktop user can submit a guess with Enter.

### Mobile requirement

Layout remains usable on a narrow phone viewport without horizontal overflow or tiny controls.

---

## 4H — Build results screen

Render sample results for:

- win by completion;
- win by timed score;
- loss;
- timed tie;
- agreed draw.

Show only result fields the Step 3 server model will actually provide.

---

## 4I — Build a clearly separated Practice mode

Practice may use one intentionally public sample chain because there is no opponent secret to protect.

Keep Practice visually/architecturally distinct enough that later multiplayer code is not forced to pretend a local sample chain came from a server match.

---

## Step 4 final verification

Step 4 is DONE when:

- every planned screen can be reached with sample state;
- home is registered and functional;
- chain data preserves IDs;
- browser cannot mark itself Ready/verified authoritatively;
- load failure has a visible retry path;
- waiting/select/lock/countdown/game/results screens exist;
- practice can be completed locally;
- Enter submits guesses on desktop;
- narrow mobile layout works;
- focus states are visible;
- status does not rely only on color;
- repeated navigation does not accumulate listeners/timers.

---

# Step 5: add local identities and an in-memory application layer

## Goal

Make two separate browser sessions act like two different authenticated users without introducing Supabase yet.

This gives networking a real identity model while keeping everything local and resettable.

## Create

Server:

- `server/config.js`
- `server/auth/devIdentity.js`
- `server/repositories/memory.js`
- service modules as needed

Browser:

- local dev-login/session handling under `public/js/`

---

## 5A — Create development identities

Create stable fixture users, at minimum:

- Alice
- Bob
- optional Eve for unauthorized/third-player tests

Each fixture user should have:

- stable user ID;
- display name;
- separately owned chains;
- at least one Ready chain for Alice/Bob.

---

## 5B — Create a development-only login/session mechanism

For loopback/local development only:

1. browser selects Alice or Bob;
2. server creates an opaque random session token;
3. token maps to fixture user in server memory;
4. future requests derive actor identity from that token.

### Security boundary

Never accept this as authoritative:

```json
{ "hostId": "alice-id" }
```

from browser JSON.

The server determines the acting user from the session.

---

## 5C — Create the in-memory repository

Repository should hold current local-development data behind an interface that can later be swapped for Supabase.

At minimum store/access:

- users/profiles;
- chains and ownership;
- room/game state if services require repository access.

Keep domain rules in domain/services, not buried in storage code.

---

## 5D — Enforce ownership/eligibility through services

Before room create/join:

- actor must be authenticated;
- actor must have at least one owned Ready chain.

For list selection:

- actor can only select their own eligible chain.

Do not trust browser-submitted ownership metadata.

---

## 5E — Separate local/test and production configuration

Add:

- `.env.example`;
- ignored local environment file if needed;
- clear `NODE_ENV`/mode checks.

Production/staging configuration must refuse to start with fixture authentication or memory-only persistence enabled accidentally.

---

## Step 5 final verification

Use two isolated browser sessions:

- session 1 logs in as Alice;
- session 2 logs in as Bob;
- Alice sees only Alice-owned chains;
- Bob sees only Bob-owned chains;
- forging `userId`/`hostId` in a request is ignored/rejected;
- a user without an eligible chain cannot create/join;
- server restart/reset behavior is documented and expected.

---

# Step 6: connect local browsers through HTTP and Socket.IO

## Goal

Replace sample UI transitions with real communication between two local browser sessions while keeping the Step 3 domain rules authoritative.

## Create

- `server/app.js`
- HTTP route modules
- Socket.IO handler modules
- `services/gameService.js` or equivalent orchestration service
- `public/js/api.js`
- `public/js/socket.js`
- integration tests

---

## 6A — Separate Express app creation from `listen()`

Refactor so tests can import/create the app without immediately binding port 3000.

Conceptually:

```text
server/app.js -> creates/configures Express
server/server.js -> creates HTTP server, attaches Socket.IO, listens
```

Integration tests should be able to start on an ephemeral port.

---

## 6B — Attach Socket.IO to the same HTTP server

Use the same authoritative Node process for:

- Express/static/API requests;
- WebSocket/Socket.IO events;
- in-memory Room/Game state.

Do not put game authority in the browser.

---

## 6C — Authenticate before room/game commands

A socket/HTTP request must resolve to the local dev session actor from Step 5 before it can:

- create room;
- join room;
- select/lock list;
- guess;
- request draw;
- leave;
- request state sync.

---

## 6D — Implement room commands

Add server commands for:

- create room;
- join by code;
- leave room;
- select list;
- lock list;
- fetch/resync room state.

The second completed lock must trigger Step 3's automatic Game creation. Do not add a separate host Start Game command.

---

## 6E — Implement live-game commands

Add commands for:

- guess;
- draw request/agreement;
- state sync/reconnect lookup.

Every command must go through tested domain/service logic rather than directly mutating objects in a socket handler.

---

## 6F — Add acknowledgements and duplicate protection

Every client command should carry a command/request ID.

Server acknowledgements should make it possible for the browser to tell:

- success;
- validation failure;
- stale request;
- duplicate request;
- unauthorized action.

Add room/game revision numbers or equivalent state versioning so stale state can be recognized.

---

## 6G — Send player-specific safe state only

When broadcasting match updates, do not broadcast one full Game object to everyone.

For each player:

1. derive safe state using Step 3 code;
2. send only that player's safe representation.

No opponent hidden answers in socket payloads.

---

## 6H — Write integration tests

Use real local HTTP/socket clients in tests.

Cover:

- Alice creates room;
- Bob joins;
- both select/lock;
- Game auto-created;
- countdown/live game starts;
- guesses work;
- match finishes;
- Eve cannot join full room;
- Alice cannot send command as Bob;
- user cannot subscribe to unrelated room;
- safe-state payload does not expose hidden answers.

---

## Step 6 final verification

Step 6 is DONE when automated integration clients can complete a full match through the actual HTTP/socket boundary without manually calling Room/Game methods.

---

# Step 7: complete real two-browser play and reliability behavior

## Goal

Make the local multiplayer experience survive refreshes, disconnects, duplicate clicks, stale timers, and normal user mistakes.

This is where the system stops being a happy-path demo and becomes reliable enough to automate end-to-end.

---

## 7A — Replace sample UI state with API/socket state

Connect Step 4 screens to Step 6 APIs/events.

Each screen should render server state, not invent authoritative game state locally.

---

## 7B — Implement initial sync and reconnect sync

On page refresh or socket reconnect:

- authenticate session;
- determine whether user belongs to an active room/game;
- request authoritative latest safe state;
- render correct screen from that state.

Do not assume the browser received every prior socket event.

---

## 7C — Implement disconnect behavior

Define/test separately:

### Pre-game

- host leaves/disconnect policy follows lobby rules;
- non-host leave returns host to waiting state.

### Live game

Implement the chosen grace period/forfeit rules from product decisions.

At minimum define:

- temporary disconnect grace;
- explicit leave/forfeit;
- one player never reconnects;
- both players disconnect;
- match already finalized while reconnecting.

---

## 7D — Enforce one controlling tab/session where required

Prevent one account from opening multiple tabs that can both issue conflicting game commands.

Choose a deterministic policy, such as latest connection controlling the match, and surface it clearly to the displaced tab.

---

## 7E — Reject stale/duplicate activity

Test repeated actions such as:

- double-click Lock;
- duplicate guess submission;
- old countdown callback;
- old match command after user joined another room;
- repeated leave;
- repeated draw agreement.

They must not duplicate game creation/results/state changes.

---

## 7F — Clean up resources

When room/game is finished/abandoned, clean up:

- room maps/code maps;
- game maps when appropriate;
- membership mappings;
- timers;
- socket subscriptions/listeners;
- command-deduplication caches;
- reconnect records after retention window.

---

## Step 7 final verification

Using two separate browser profiles/sessions, manually verify:

```text
create
→ join
→ select
→ lock
→ countdown
→ play
→ results
```

for both timed and unlimited modes.

Also verify:

- refresh during lobby;
- refresh during live game;
- non-host leaves;
- host leaves;
- invalid/full room;
- duplicate Lock clicks;
- duplicate Guess clicks;
- third user attempts to join;
- temporary disconnect/reconnect;
- no hidden-answer leakage.

---

# Step 8: automate the complete local player journey

## Goal

Turn the manual Step 7 acceptance flow into repeatable end-to-end tests and CI.

## Create

- `playwright.config.js`
- `tests/e2e/`
- test-server helpers
- `.github/workflows/ci.yml`

---

## 8A — Build isolated E2E test environment

Tests must:

- start their own server;
- use a dedicated port;
- use test/dev identities;
- reset in-memory data between tests;
- not depend on your manually running dev server.

---

## 8B — Use separate browser contexts for players

Playwright should use isolated contexts for Alice and Bob so cookies/session state are genuinely separate.

Use Eve/third context for unauthorized/full-room cases.

---

## 8C — Automate core match

Automate:

- login Alice/Bob;
- Alice creates invite;
- Bob joins;
- both select/lock;
- countdown;
- sequential guesses;
- result screen.

Test timed and unlimited mode.

---

## 8D — Automate failure/reliability scenarios

Add cases for:

- invalid invite code;
- room full;
- refresh/reconnect;
- failed API request UI;
- disconnect/forfeit behavior;
- duplicate actions;
- mobile/narrow viewport;
- no answer leakage through rendered DOM/state payloads where practical.

---

## 8E — Add CI

GitHub Actions should run on Linux:

1. install dependencies;
2. run unit tests;
3. run integration tests;
4. install Playwright browser dependencies;
5. run E2E tests.

Linux CI is important for catching case-sensitive path/import mistakes that Windows may hide.

---

## Step 8 final verification

A clean checkout can:

```text
install
→ test domain
→ test integration
→ start test server
→ run two-player browser journey
```

without manual setup.

---

# Step 9: replace local fixtures with Supabase accounts and private chain storage

## Goal

Replace temporary local identity/storage while preserving the already-tested domain and service contracts.

Do not rewrite gameplay around Supabase. Supabase should become an adapter for identity/persistence.

## Create

- versioned Supabase migrations
- server auth adapter
- repository/database adapter
- browser auth screens/session handling
- database permission/RLS tests

---

## 9A — Design database schema/migrations

At minimum plan tables for:

- profiles/users app metadata;
- chains;
- immutable chain versions/snapshots if needed;
- ownership/status fields.

Use migrations committed to the repo rather than manually changing production tables only through the dashboard.

---

## 9B — Implement real account flow

Support:

- signup;
- email confirmation;
- login;
- logout;
- password reset;
- session refresh;
- initial profile creation.

---

## 9C — Verify tokens server-side

Browser sends Supabase auth token/session proof.

Node server verifies it and derives the acting user ID.

Do not trust a browser-supplied user ID independently of the verified token.

---

## 9D — Replace memory chain repository with Supabase adapter

Implement the same application-facing operations used in Step 5, now backed by database storage.

Support:

- create chain;
- read user's chains;
- edit chain;
- archive/delete behavior as chosen;
- Ready/Blocked state;
- optimistic conflict handling if edits happen concurrently.

---

## 9E — Add row-level security/ownership rules

Ordinary authenticated users must not be able to directly query another user's private chain contents.

Test access at both levels:

- through your application API;
- direct database/API request under user's auth token.

---

## 9F — Lock an immutable chain version for matches

When a chain is selected for a match, later edits to the saved chain must not alter the already-created match snapshot.

Store/reference a version/snapshot that can later support results and moderation evidence.

---

## Step 9 final verification

- Alice and Bob can create real accounts;
- each sees only their own chains;
- data survives server restart/login on another device;
- expired/forged auth fails;
- Alice cannot read/edit Bob's chains through app API;
- Alice cannot read/edit Bob's chains directly through database permissions;
- fixture auth is unavailable outside permitted local/test environments.

---

# Step 10: persist matches, results, and recovery state

## Goal

Make competitive outcomes durable and exactly-once so server/process failure cannot invent or duplicate records.

---

## 10A — Design match/result persistence

Store enough information to prove the match outcome later, including:

- match/game identity;
- both participants;
- locked chain versions/snapshots or references;
- mode/settings;
- start/final timestamps;
- final result/reason;
- progress evidence needed for result/reporting.

---

## 10B — Persist match evidence before competitive play

Before a competitive game becomes live, ensure the authoritative participant/chain evidence needed for later result/reporting is durable.

If persistence cannot be established, do not pretend the competitive match is safely recordable.

---

## 10C — Finalize result exactly once

Use one restricted server/database operation/transaction to:

- write final result;
- update both players' record outcomes;
- prevent duplicate/conflicting finalization.

Clients submit actions, never `winnerId` as authority.

---

## 10D — Handle uncertain writes/retries

A network timeout does not necessarily mean the database write failed.

Retry using the same match/finalization identity so a second attempt recognizes an already-committed result rather than awarding twice.

---

## 10E — Show pending vs recorded state accurately

Results UI should distinguish:

- match finished locally/in server memory;
- result successfully persisted;
- result save pending/retrying;
- unrecoverable persistence failure if one occurs.

Do not show a result as permanently recorded until it is.

---

## 10F — Define restart recovery behavior

After process restart:

- committed completed matches/results remain intact;
- unfinished in-memory beta matches that cannot safely resume are marked interrupted/abandoned according to a documented rule;
- never fabricate a win/loss because the server restarted.

---

## Step 10 final verification

Test:

- normal result persistence;
- duplicate finalization request;
- conflicting finalization attempt;
- response lost after commit;
- retry after uncertain response;
- server restart after committed result;
- server restart during unfinished match;
- both player profiles show consistent records.

---

# Step 11: add reports, admin review, security, and release hardening

## Goal

Add the moderation and security controls needed before inviting external users.

---

## 11A — Implement match-chain reporting

A participant can report the opponent's preserved chain version from a completed match.

Server determines the exact reported evidence from match records.

Do not accept arbitrary submitted words as the authoritative evidence.

Store:

- reporter;
- match;
- reported chain version;
- reason/comment if allowed;
- timestamps/status.

---

## 11B — Implement admin roles and review queue

Add protected admin authorization separate from ordinary users.

Admin review UI/service supports:

- open reports;
- view preserved evidence;
- allow;
- disallow;
- dismiss;
- reason/notes;
- audit history;
- reversal of prior ruling.

---

## 11C — Apply pair rulings to future eligibility

If admin disallows ordered pair:

```text
WORD_A → WORD_B
```

future chain validation/selection must block that ordered pair.

Reverse order:

```text
WORD_B → WORD_A
```

is separate unless separately ruled.

Do not retroactively alter an already-running or completed match snapshot.

---

## 11D — Add request/security protections

Implement appropriate protections for the final architecture, including:

- allowed origins;
- payload size/type validation;
- rate limits for sensitive/high-frequency actions;
- safe text rendering/XSS avoidance;
- security headers;
- auth/permission checks on every private route/socket command;
- no secrets in browser bundle;
- hidden answers excluded from logs/errors;
- production-safe error messages.

---

## 11E — Graceful shutdown and cleanup

On process shutdown:

- stop accepting new work;
- finalize/mark recoverable state appropriately;
- close HTTP/socket listeners;
- close database connections if applicable;
- flush critical logs/telemetry within reasonable limits.

---

## 11F — Accessibility/release acceptance pass

Check:

- keyboard-only navigation;
- visible focus;
- screen-reader labels on controls;
- status not color-only;
- reduced-motion preference;
- mobile touch targets;
- real-phone layout;
- long usernames/words/content;
- loading/error/retry states;
- logout/account deletion/revocation behavior.

---

## Step 11 final verification

- a participant can report the exact preserved opponent chain from a completed match;
- only authorized admins can review/moderate;
- disallowed ordered pairs affect future eligibility;
- reversed pair remains independent;
- ordinary users cannot call admin operations;
- hidden answers cannot be obtained through APIs, sockets, database rules, logs, or history;
- security/accessibility/manual acceptance checks pass.

---

# Step 12: deploy the private online beta

## Goal

Deploy one understandable, supportable version for invited users without prematurely designing for massive scale.

Start with **one authoritative game-server instance**.

---

## 12A — Choose hosting that supports the actual architecture

Hosting must support:

- long-running Node process;
- WebSockets/Socket.IO;
- HTTPS;
- environment secrets;
- application logs;
- health checks;
- controlled deploy/restart/rollback.

Do not choose a platform that only supports short stateless requests if it cannot reliably host the authoritative Socket.IO game process.

---

## 12B — Create separate staging/production configuration

At minimum separate:

- database/Supabase project or schema environment;
- auth redirect URLs;
- allowed origins;
- secrets;
- deployment URLs;
- logging environment labels.

Never test dangerous migrations directly against the only production dataset.

---

## 12C — Configure deployment runtime

Pin/document:

- Node version;
- install/build/start commands;
- required environment variables;
- reverse-proxy/WebSocket behavior;
- `/health` check;
- migration procedure;
- restart behavior.

---

## 12D — Test real remote multiplayer

Use two devices/networks if possible.

Test:

```text
account signup/login
→ chain creation
→ room invite
→ remote join
→ list selection/lock
→ countdown
→ full match
→ result persistence
→ reconnect
→ report flow
```

Do not count same-browser localhost testing as deployment validation.

---

## 12E — Test controlled failure/recovery

Before inviting beta users, intentionally test:

- app restart;
- client reconnect;
- database temporary failure if practical;
- failed deployment rollback;
- backup restore in staging.

Verify outcomes are not fabricated or duplicated.

---

## 12F — Document owner operations

Update `README.md` and relevant docs with:

- local setup;
- environment setup;
- migrations;
- deployment;
- restart procedure;
- rollback procedure;
- backup/restore procedure;
- logs/monitoring locations;
- known beta limitations;
- support/report process;
- retention/account deletion behavior.

---

## Step 12 final verification

The beta is ready only when invited users can:

- create real accounts;
- create/manage chains;
- share a private room invite;
- complete timed and unlimited matches remotely;
- reconnect after interruption;
- see durable records;
- report a chain/problem;

and you can:

- diagnose failures from logs;
- restart safely;
- roll back a deployment;
- restore staging backup;
- explain known limitations without guessing.

---

# Working rules for future implementation help

When asking for help with a step, keep the work inside the **CURRENT** step unless a dependency genuinely requires a small supporting edit.

For every implementation task, identify these six things explicitly:

1. **Process** — browser, Node server, database, test runner, or CI.
2. **Inputs** — what data enters the function/handler and where it came from.
3. **Authority** — which values are trusted/server-derived versus merely browser-submitted.
4. **Files** — files to edit together and existing callers/imports that must also change.
5. **Behavior** — expected success state and expected failure state.
6. **Proof** — exact terminal/browser/test command that proves the task is complete.

Do not move the **CURRENT** marker because code "looks finished." Move it only after the step's completion checks pass.
