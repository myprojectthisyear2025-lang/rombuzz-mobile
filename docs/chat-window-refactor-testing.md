# Mobile chat verification

The mobile chat window was split into focused files and given an updated UI.
Backend files, API request formats, socket event names, and existing media/call
integrations remain unchanged. The entry route is `app/chat/[peerId].tsx`.

## Where the code lives

The former 3,943-line route now delegates to `src/features/chat/window/ChatWindowScreen.tsx`.
Every new TypeScript source file in that folder is at most 300 lines.

| Location | Responsibility |
| --- | --- |
| `ChatWindowScreen.tsx` | Main screen entry; connects behavior, shared styles, and the UI. |
| `useChatWindowController.ts` | Composes the smaller hooks and the existing history/media integrations. |
| `ChatWindowView.tsx` | Arranges the header, inverted message list, composer, and overlays. |
| `components/` | Message types, replies, media, header, composer, and sheets. |
| `hooks/` | Identity, unread state, keyboard, send/edit/delete actions, gestures, and protected media. |
| `realtime/` | Socket subscriptions and message/event reconciliation. |
| `styles/` | Shared theme colors, Manrope typography, and responsive bubble sizing. |

The existing `src/features/chat/thread/` helpers, backend, dependencies, and native build settings were retained.

## Automated checks

Run from the mobile project folder:

```powershell
node --test scripts/chat-tests/*.test.cjs
```

These tests use Node's built-in runner and the project's existing TypeScript
installation. They execute the extracted hooks with lightweight state, network,
and native-module mocks. They check sending/reply payloads, optimistic message
reconciliation, edit and pin rollback, reaction toggling, delete scopes, composer
transitions, and ephemeral expiry. They do not simulate native rendering, camera
permissions, playback, real sockets, or the keyboard.

Additional checks passed during the refactor: TypeScript with `--noEmit`, targeted ESLint,
and an Expo Android export including Hermes bytecode (3,025 modules). The bundle was
generated in a temporary folder; no APK was built or installed.
The regression suite currently contains 43 passing cases, including socket handlers and message classification.

## Device checklist

Use two matched test accounts on separate devices. Keep one chat open while
performing each action from the other device. Test Android and iOS when available.

| Area                  | Check                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open and history      | Open from inbox, reopen a cached conversation, scroll through older pages, and confirm no duplicate or missing messages. Open a pinned/search result with a target message and verify scrolling/highlighting.            |
| Text and replies      | Send short, long, multiline, and emoji messages. Swipe to reply to text, photos, videos, and shared items; send the reply and tap its quote. Verify the draft/reply can be cancelled.                                    |
| Message actions       | Edit within the allowed window; check the edited label on both devices. React, change/remove a reaction, and double tap to love. Pin/unpin, open pinned messages, remove for yourself, and unsend for both participants. |
| Failures              | Disable connectivity before sending/editing/pinning. Confirm existing messages remain and rejected edits/pins restore their previous state. Reconnect and reopen the thread.                                             |
| Media                 | Send gallery photos/videos, camera captures, and voice recordings. Open/play them, including existing older media and muted videos. Verify paid media unlock and gift messages.                                          |
| Protected media       | Send view-once and view-twice photos/videos. As the receiver, open and close each; confirm view counts and final expiry, with one expiry notice. Check both devices and reopen the thread.                               |
| Shared content        | Open shared posts, reels, profile photos, and profile reels. Check quotes, playback, reactions, and long-press actions.                                                                                                  |
| Keyboard and layout   | Open/close the keyboard, grow the multiline composer, expand attachment controls, and rotate if supported. Confirm newest messages remain above the composer and controls avoid the navigation bar/home indicator.       |
| Navigation            | Verify back, thread info, peer profile, pinned messages, Meet in the Middle, video call, call-history callback, and confirmed meetup directions. Return to the same chat after each.                                     |
| Presence and unread   | Verify typing, sent/seen labels, inbox ordering, unread badge clearing on open, and updates after leaving/reopening. Change the peer nickname and return to the chat.                                                    |
| Appearance and sheets | Review small and large phones, long names, light/dark theme where supported, safe-area spacing, loading/empty states, reaction picker, reply ideas, and reporting sheet.                                                 |

## Existing backend limitation

In the supplied backend ZIP, the `POST /chat/rooms/:roomId/reply-suggestions`
handler in `server/routes/chatRooms.js` ends its success path at `// ...` without
sending a response. If that version is deployed, Reply Ideas may keep loading.
That behavior predates this mobile refactor; no backend change is included.

When reporting a failure, include the platform, build, exact steps, message type,
whether the other account saw the same result, and whether reopening fixes it.
