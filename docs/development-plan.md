# WordLink development plan

Status: tailored working plan. The confirmed choices below are settled; other decisions remain proposals.

## Confirmed direction

- First release: private games tested with friends. Public discovery is a later option, not a beta requirement.
- Keep HTML/CSS, vanilla JavaScript, Express, Socket.IO, and Supabase. No framework migration is needed for the planned game.
- The owner will implement the game with guidance. Break each milestone into small exercises with explanations, a visible outcome, and a verification checklist; do not implement application features on the owner's behalf unless requested.
- Valid connections are recognizable phrases or compound words, not loose associations or slang-only connections.
- Player-created chains remain central. Players can report unfair chains for admin review; stored decisions improve future automatic eligibility checks. Universal automatic language verification is no longer a prerequisite.
- The reporting workflow below is the proposed design. Pair-wide bans are confirmed; report timing and result corrections remain policy decisions until agreed.

## Goal and current starting point

Deliver a browser game where two players bring five-word chains, choose a chain in a lobby, race to solve the opposing chain, and receive an accurate result. Support phones and desktop browsers with a dark, clean, relaxed interface using the existing purple palette and Manrope.

Already present:
- Express serves the frontend and a health endpoint.
- Screen navigation and placeholders cover the main game flow.
- The chain library renders mock JSON; create, edit, search, and filter actions are placeholders.
- Core rules are documented in `docs/gamerules.md`.
- Color variables and initial styling exist.

Not yet implemented: real accounts, database persistence, verification, room management, multiplayer events, guessing, timers, results, or meaningful automated tests. Socket.IO and Supabase are named in the README but are not installed dependencies. The initial home screen is not registered in the screen renderer yet.

## Decisions to make

| Decision | Proposed starting point | Resolve before |
| --- | --- | --- |
| First audience | Confirmed: private games with friends; public lobbies deferred | Settled |
| Technology | Confirmed: vanilla JS, Express, Socket.IO, and Supabase | Settled |
| Development approach | Confirmed: owner implements with step-by-step guidance | Settled |
| Chain eligibility | Format checks and stored moderation decisions; unknown connections remain playable, subject to reporting | Rules finalized |
| Ban scope | Confirmed: a disallowed ordered pair is blocked in every chain | Settled |
| Match corrections | Proposed: reports alone never alter results; define whether admin decisions can void a result | Results and moderation |
| Account requirement | Accounts for saved chains and recorded multiplayer; no guest record merging in v1 | Database design |
| First-time eligibility | Create a custom chain that passes format and existing ban checks; no presets or advance admin approval required | Onboarding |
| Game modes | Timed mode first during development; add documented unlimited mode before calling the documented game complete | Match implementation |
| Guess normalization | Ignore case and surrounding whitespace; decide punctuation, spaces, hyphens, plurals, and accented letters explicitly | Verification and guessing |
| Hints and incorrect guesses | No hints or score penalty initially; rate-limit abusive guessing | Match implementation |
| Live disconnects | Proposed 30-second reconnect grace; clock continues, explicit quit forfeits, both absent eventually abort without awarding a win | Reliability work |
| Server restart | Small beta may abort active matches without a loss; resumable matches require durable active state | Hosting decision |
| Scope and schedule | Choose weekly time budget, desired launch date, hosting budget, and expected concurrent players | Release estimate |

### Report-based moderation and growing eligibility checks

Players are responsible for recognizable phrases and compounds. The server checks format and known moderation decisions; passing these checks does not prove every connection is fair. Unknown pairs must remain playable for reporting to build useful coverage. Use Ready rather than Verified for this state; reserve Reviewed for content an admin has actually assessed.

Proposed flow:
1. A player saves five words. Normalize according to the game's rules and check the four ordered pairs and exact chain against active bans.
2. If format is valid and no ban applies, the chain is ready to play. Approved pairs can be reused, but unknown pairs do not require advance approval.
3. In a match, the opponent may flag the list without revealing hidden words or affecting the timer. On the results screen, reveal the chain to participants and let the reporter identify the disputed pair and add a reason. Exact reveal/report timing remains a UI decision.
4. The server verifies that the reporter played against this chain and records the immutable chain version used in that match, match ID, author, reporter, selected pair if known, reason, and timestamp. Do not trust words supplied by the reporting browser.
5. An admin queue groups related reports and displays unique reporters, distinct matches, prior rulings, and the original evidence. Fifteen reports can prioritize a review, but do not automatically establish that a connection is invalid.
6. An admin may allow a connection, disallow it, or dismiss the report with a recorded reason. Confirmed scope: normalized ordered pairs, so banning DOG -> WATER blocks that pair in every chain, including existing saved chains when next used. Never ban DOG or WATER individually; WATER -> DOG is a separate ordered pair. Exact-chain decisions remain an optional extension for issues that concern the complete chain.
7. New saves, room joins, lock-ins, automatic selections, and game starts use current decisions. Cached eligibility must not let an old chain bypass a new ban. If a locked chain becomes ineligible before play, cancel the countdown and return players to selection rather than starting with a banned chain.
8. Preserve chain snapshots already in play and completed match records. Proposed beta policy: later bans affect future games, not automatic retroactive scoring. Decide separately whether admins can void a disputed match; any correction must update both records once and preserve an audit trail.

Data and permissions:
- `chain_reports`: immutable evidence references, reporter, reason, review state, and resolution. Link reports to the exact match chain version, not the editable current list.
- `pair_decisions`: normalized first/second word, allowed/disallowed ruling, reason, admin, timestamp, and revision history.
- `chain_decisions`: optional rulings against a canonical five-word sequence when pair-level decisions are insufficient.
- Reports, decisions, and admin access can live in the existing database; a separate database is not required. Ordinary players cannot read other users' report evidence or write admin rulings.
- Allow one report per reporter and opponent chain version per match, updated instead of duplicated. Show unique reporter counts across repeated matches separately from total reports. Add submission limits and require real match participation.
- Preserve evidence when an author edits or deletes a list. Later changes create a new version; equivalent banned content remains blocked after normalization.
- Admin decisions are reversible and audited. Ordinary report counts never ban a chain or penalize an account by themselves.
- Approval is evidence of a review, not a permanent exemption: current disallowed decisions take precedence. Changing words removes any whole-chain Reviewed label, while pair decisions still apply to unchanged pairs.

Limitations: unfair new pairs can still be played before review, and admins need to keep up with reports. This system learns from recorded human decisions; it does not discover unknown invalid phrases automatically. No external autocomplete service is needed for the beta.

Done when: an actual opponent can submit a report, an authorized admin can review preserved evidence, and a disallowed decision prevents future use without changing unrelated pairs or leaking live answers.

## Recommended implementation order

### 1. Finish the rules and define the first release

- Finalize Ready vs. Reviewed labels, report timing, and result-correction policy; pair-wide bans are confirmed.
- Resolve the decisions that affect fairness: valid pairs, normalization, simultaneous finishes, leaving, reconnecting, and draws.
- Define a finite set of room timer options and limits for chain names and words.
- Record that there are five words but only four guesses, because the first word is given.
- Decide what opponents can see: recommend progress count but no live guesses or hidden answer words.
- Separate beta requirements from later ideas. Keep chat, rankings, matchmaking ratings, spectators, tournaments, achievements, and monetization out of the first release unless explicitly chosen.

Done when: sample games, ties, timeouts, and departures all have an unambiguous result in the rules document.

### 2. Make the core puzzle playable locally

- Implement the game view with a fixed development chain and a next-word input.
- Show the given word, four unknown positions, correct/incorrect feedback, and completion.
- Implement and test a small pure game-rules module separately from DOM rendering.
- Support Enter to submit, focus retention, long allowed words, and the phone keyboard.
- Use this prototype to test whether guessing is enjoyable and whether clues are needed. Any hint system is a separate rules decision.

Done when: someone unfamiliar with the project can complete a sample chain on a phone and desktop. Answers embedded in this local prototype are development-only; production answers will live on the server.

### 3. Establish the reusable UI and screen flow

- Fix the initial home renderer and implement useful content for each screen.
- Build consistent buttons, fields, status labels, panels, spacing, and keyboard focus using the existing palette.
- Keep the existing vanilla JS structure; split responsibilities as code grows rather than rewriting the app.
- Give each data-driven screen distinct loading, empty, failed, and populated states.
- Prevent an old async response from updating a newer screen after navigation.
- Ensure phone layouts work before finishing every desktop detail.

| Screen | Main job | Important states |
| --- | --- | --- |
| Home | Explain the game and get the player ready | Signed out, needs a ready chain, ready to play |
| Account | Sign up, sign in, recover access | Validation, pending, expired session |
| My chains | Find and manage saved chains | Empty, drafts, ready, reviewed, blocked |
| Chain editor | Build four adjacent pairs and check format/known bans | Incomplete, ready, banned pair, edited |
| Private games | Create a room or join by invite/code | Invalid invite, waiting room, full room, room disappeared |
| Room | Wait, choose a chain, lock in | Waiting for opponent, 60-second selection, 10-second countdown |
| Match | Solve the chain | Correct/incorrect guesses, reconnecting, timed/unlimited |
| Results | Explain the outcome, reveal chains, and offer reporting | Win, loss, draw, forfeit, interrupted match, report submitted |
| Admin review | Inspect reported chains and record rulings | Pending, allowed, disallowed, dismissed, reversed |
| Profile | Show player identity and record | New player, populated record |

Done when: the full flow is navigable with sample data and no essential action depends on hover or color alone.

### 4. Add accounts and durable chain storage

- Configure Supabase Auth and database migrations; choose one sign-in method initially.
- Store public display information separately from authentication details.
- Implement create, read, update, and delete for a player's own chains.
- Replace mock data in the chain library; implement real search and status filters.
- Enforce ownership in the backend and database permissions, not just by hiding buttons.
- Check chain format and stored pair/chain decisions with clear reasons for blocking; permit unknown pairs. Recheck after edits.
- Make eligibility and moderation server-controlled; players must not approve themselves or bypass bans through a direct database request.
- Never place elevated database secrets in browser files.

Suggested data model:
- `profiles`: user ID and display name.
- `chains`: owner, name, current version, timestamps.
- `chain_versions`: immutable five-word contents, normalized representation, and optional review metadata.
- `matches`: participants, mode, duration, timestamps, result, and result reason.
- `match_players`: each player's locked chain version, solved count, and outcome.
- Add the report and moderation decision tables described above; preserve decision revisions and report evidence.

Persist a locked version so later edits or deletion cannot change an ongoing match. Historical matches must remain understandable. Public player records must not expose private chain contents. Derive records from completed results initially, or update cached totals in the same database transaction as the result.

Done when: two accounts cannot read or modify each other's private chains; data survives refresh and sign-in on another device; incomplete or banned chains cannot enter play, while unknown but properly formed chains can.

### 5. Build rooms and a server-controlled match lifecycle

- Add Socket.IO alongside Express and authenticate socket connections.
- Implement room creation, joining, leaving, and the two-player capacity limit.
- For the friends beta, use private invite links or room codes; do not require a public lobby browser. Enforce room membership on the server even when a player knows a room ID.
- Check current chain eligibility on the server when joining, locking in, auto-selecting, and starting play.
- Implement states: waiting -> selecting -> countdown -> playing -> finished; include closed/aborted exits.
- Start the 60-second selection period only when the second player joins.
- Auto-select an eligible chain if selection expires; handle eligibility disappearing without crashing.
- Lock choices irrevocably and snapshot the chosen version.
- Start one 10-second countdown when both players are locked.
- Implement documented pre-game departure rules, cancel obsolete timers, and reset readiness when the non-host leaves.

Done when: two separate browsers can reach the same match start reliably, and a third player or an unauthorized event cannot change that room.

### 6. Complete multiplayer guessing, results, and both modes

- The server owns the answer, current position, deadlines, and winner. Browsers submit guesses and display the permitted state.
- Never send the opposing full chain in HTML, API responses, or socket messages before its permitted reveal.
- Reject out-of-turn, out-of-phase, malformed, duplicate, or late submissions.
- Use server timestamps for deadlines; browser countdowns only display remaining time.
- Define event ordering: a proposed rule is first valid completion processed by the server wins; reject guesses received at or after the deadline.
- Implement timed expiry: more correct guesses wins; equal progress is a draw.
- Implement unlimited play with a draw offer that requires both players' agreement.
- Record one outcome per match even if finish, timeout, and disconnect events arrive close together.
- Show the result reason and support a fresh match after both players agree to play again.

Done when: two accounts can complete the entire journey and receive the same persisted outcome and accurate record.

### 7. Add reporting, admin review, and reliability

- Implement report submission, preserved match evidence, and the protected admin review screen before inviting beta players.
- Connect admin rulings to future chain eligibility; test duplicate reports, unauthorized review attempts, ban reversals, and a ban issued during a countdown.
- Restore an authorized player's current match snapshot after reconnect or refresh; do not rely on receiving every socket event.
- Add event IDs or equivalent duplicate protection where retrying an action could apply it twice.
- Implement the agreed disconnect, explicit leave, both-disconnected, and server-restart policies.
- Handle multiple tabs, expired sessions, full/disappearing rooms, and chain edits during selection.
- If saving a result fails, show a pending state and retry without awarding the result twice.
- Limit request sizes and submission frequency; render user-provided names as text.

Meaningful automated checks:
- Word normalization, sequential guessing, four-guess completion, and ties.
- Selection timeout, one countdown only, host/non-host departure, and stale timer cancellation.
- A guess at the deadline, simultaneous final guesses, and duplicate result processing.
- Private-chain access, moderation tampering, unauthorized room actions, and hidden answer leakage.
- Reconnection to the current state and a database failure during result persistence.

Manual acceptance checks:
- Two independent browser sessions play timed and unlimited games start to finish.
- Test a real phone, narrow desktop window, keyboard-only navigation, and long permitted content.
- Disconnect one player, refresh, reconnect, leave permanently, and restart the server.

Done when: failures have predictable player-facing outcomes and the tests that protect match fairness pass.

### 8. Deploy a small beta and observe real play

- Select hosting after budget and audience are known. The backend must support a long-running Node process and persistent socket connections.
- Start with one authoritative game-server instance unless shared state and coordination have been deliberately implemented.
- Configure environment variables, production origin/auth redirects, HTTPS, and database migrations.
- Verify `/health`, useful error logs, restart behavior, and a backup/restore approach.
- Keep testing data and production data separate; exclude answer contents and authentication tokens from normal logs.
- Run the complete two-device acceptance flow against the deployed build.
- Have a small group play without developer guidance. Track confusing screens, disputed pairs, abandoned onboarding, and stalled matches.

Done when: invited players can join remotely, play reliably, and report issues; the owner can diagnose failures and recover data.

### 9. Polish and release

- Fix beta issues before expanding the feature set.
- Improve instructions and empty states where players got stuck.
- Tune spacing, contrast, motion, and interaction feedback on both screen sizes.
- Before opening public lobbies, expand the beta chain-review process to handle inappropriate names, higher report volume, and appeals.
- Finish public-facing account/help requirements appropriate to the chosen release.
- Document setup, deployment, schema changes, and known limitations.
- Release to the agreed audience; use observed play to choose the next feature.

Done when: the release checklist passes, no known critical fairness or data-access bugs remain, and players can complete onboarding and matches without assistance.

## Work rhythm and immediate next milestone

Finish one phase's acceptance criteria before treating it as complete. Keep commits small and test a real user journey at each milestone. Estimate dates after the owner chooses available hours and collaboration style; the phase order is more reliable than an invented launch date.

Guidance format for each implementation session:
1. Explain one concept and the small behavior being added.
2. Identify the files to change and give a short checklist or pseudocode.
3. Let the owner write the code; provide targeted examples or debugging help as needed.
4. Review the result together and check normal and failure behavior.
5. Record the completed milestone and choose the next small task.

First exercise: register a basic home view, then build the sample chain board, next-word input, guess validation, and completion state in separate exercises. Add format and moderation checks with persistence; the local prototype does not need a language-verification provider.

Immediate milestone: settle the remaining moderation policy details, then build the local sample match. Release scope is settled: private games for friends, with the owner implementing through guided exercises.

## Technical references

- [Socket.IO: handling disconnections](https://socket.io/docs/v4/tutorial/handling-disconnections): a reconnecting browser needs to synchronize with the server's current state.
- [Socket.IO: delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/): account for missed events and deliberate retry behavior.
- [Supabase: row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): configure database grants and row policies for exposed tables; keep privileged access server-side.
