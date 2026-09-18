# AnchorGrid · Online test plan v0.6

## Goal
Validate a private match between devices in Mexico and Colombia using GitHub Pages + Firebase Realtime Database.

## Firebase
Use a Realtime Database instance in `us-central1` and enable Anonymous Authentication.
For the production GitHub Pages build, add the seven `VITE_FIREBASE_*` repository secrets documented in `FIREBASE_SETUP.md`, then redeploy.

## 1v1 smoke test
1. Device A opens the GitHub Pages URL and creates a 1v1 room.
2. Device B opens the invitation URL or types the 4-digit code.
3. Confirm both devices show the same room, theme and seats.
4. Start the match.
5. Move a pawn on A; B should receive the new state almost immediately.
6. Drag a wall on B; A should receive it and both revisions should match.
7. Confirm both players begin with 10 walls.

## Inactivity test
1. Let the active player's 30-second timer expire.
2. Confirm nobody is eliminated or disconnected.
3. A warning should appear with a 10-second grace timer.
4. Make a move during the grace period: the action should be accepted and the next turn should begin normally.
5. Repeat and do nothing during the grace period: only the turn should be skipped.

## Host migration test
1. Note which device shows HOST.
2. Disable Wi-Fi/data on the host.
3. Another connected player should become host and the authority epoch should increase.
4. Continue playing while the original host is offline.
5. Reconnect the original host. It should recover its seat but not steal authority back.

## Cross-country quality check
During a Mexico/Colombia test, look for:
- no duplicated moves;
- no wall appearing twice;
- revision number converges on all devices;
- no frozen timer after host migration;
- reconnect restores the same seat;
- movement feels responsive because player actions now transact directly against RTDB rather than relaying through the host.
