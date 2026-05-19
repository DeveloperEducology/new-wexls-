# Online Multiplayer Practice V1

## Summary
Add a real-time two-player competition mode for any existing practice skill. V1 uses a **separate Node WebSocket server**, **guest names**, **room-code invites**, **same 10 questions for both players**, and **match-only scoring** that does not update single-player SmartScore/mastery.

Runtime flow:

```txt
Player creates room
→ Server generates room code
→ Player 2 joins room
→ Host starts match
→ Server sends shared question seed/order
→ Both clients fetch/render same question JSON
→ Each answer is validated locally and submitted to server
→ Server broadcasts score/progress
→ After 10 questions, server declares winner
```

## Key Changes

- Add a multiplayer route:
  - `/multiplayer`
  - Lobby screen: enter guest name, create room, or join with code.
  - Room screen: show both players, selected skill, ready/start state.
  - Match screen: reuse existing `QuestionRenderer`, answer validation, and feedback styling.
  - Results screen: winner, final score, accuracy, average time.

- Add a separate WebSocket server:
  - New dependency: `ws`.
  - New script: `npm run multiplayer-server`.
  - Server runs independently from Next.js, for example on `ws://localhost:4001`.
  - Next.js remains responsible for question generation through existing `/api/practice`.

- Add a lightweight multiplayer protocol:
  - `CREATE_ROOM`
  - `JOIN_ROOM`
  - `SET_SKILL`
  - `PLAYER_READY`
  - `START_MATCH`
  - `SUBMIT_ANSWER`
  - `NEXT_QUESTION`
  - `ROOM_STATE`
  - `MATCH_COMPLETE`
  - `ERROR`

- Add shared multiplayer utilities:
  - Room code generation.
  - Match state shape.
  - Score calculation.
  - WebSocket client wrapper.
  - Question seed/order helpers.

## Match Rules

- Room supports exactly 2 players.
- Players use guest names only.
- Host chooses skill using existing subject/topic/skill values.
- Both players receive the same 10 question seeds in the same order.
- Each client fetches questions from:

```txt
/api/practice?subject=...&topic=...&skill=...&seed=...
```

- Answer validation uses existing `isAnswerCorrect`.
- Multiplayer attempts do **not** write to `localStorage` mastery or SmartScore.
- Match scoring:
  - Correct answer: `100` base points.
  - Speed bonus: up to `50` points.
  - Speed bonus decreases linearly from question start to 20 seconds.
  - Wrong answer: `0` points.
  - Final score is total points across 10 questions.
- Tiebreaker:
  - Higher correct count wins.
  - If still tied, lower total answer time wins.
  - If still tied, declare draw.

## Implementation Changes

- Create multiplayer WebSocket server:
  - Suggested file: `server/multiplayer-server.js`.
  - Keep room state in memory for V1.
  - Clean up rooms when both players disconnect or after match completion.
  - Reject joins when room is full, match already started, or room code is invalid.

- Create shared protocol files:
  - Suggested folder: `src/lib/multiplayer/`.
  - Include constants for message types, scoring, and match limits.
  - Export `calculateMatchPoints({ isCorrect, timeSpentMs })`.

- Create UI components:
  - `MultiplayerLobby`
  - `MultiplayerRoom`
  - `MultiplayerMatch`
  - `MultiplayerScoreboard`
  - `MultiplayerResults`
  - Keep them separate from the current single-player `PracticePageContent`.

- Reuse existing practice rendering:
  - Use `QuestionRenderer` for all question types.
  - Use `isAnswerCorrect` for validation.
  - Use current question JSON format unchanged.
  - Do not add generator-specific multiplayer logic.

- Add environment config:
  - `NEXT_PUBLIC_MULTIPLAYER_WS_URL=ws://localhost:4001`
  - Default client fallback may be `ws://localhost:4001` in development.

## Test Plan

- Start both processes:
  - `npm run dev`
  - `npm run multiplayer-server`

- Manual scenarios:
  - Player 1 creates a room and sees a room code.
  - Player 2 joins with the room code.
  - Host selects a skill, for example addition facts or time MCQ.
  - Both players receive the same question text/options/model.
  - Correct answer increases score.
  - Wrong answer gives zero points.
  - Scoreboard updates on both screens after each answer.
  - Match ends after 10 questions.
  - Winner/tie logic displays correctly.

- Regression scenarios:
  - Existing `/practice?...` single-player flow still works.
  - Existing mastery/localStorage state is unchanged after multiplayer.
  - MCQ, fill blank, categorization, and interactive part questions still validate correctly.
  - Invalid room code shows a friendly error.
  - Room full shows a friendly error.
  - Player disconnect shows opponent disconnected state.

## Assumptions

- V1 uses an in-memory room store; restarting the WebSocket server clears rooms.
- No login/auth in V1.
- No database in V1.
- No anti-cheat beyond server-controlled seeds and server-side room state.
- Multiplayer is a separate mode, not a replacement for single-player practice.
- Deployment will require hosting the WebSocket server somewhere that supports long-running Node processes, not plain Vercel serverless functions.
