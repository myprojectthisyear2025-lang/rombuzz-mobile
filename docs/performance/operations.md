<!-- Path: docs/performance/operations.md; Purpose: Generated middleware and database-operation rankings from measured requests. -->
# Operation detail

Warm successful requests only. Inclusive spans overlap; do not sum these medians. Middleware and auth use interval union per request. Logical database rows use the longest named operation per request, avoiding a short duplicate lookup hiding the expensive one.

| Flow | Auth inclusive p50 ms | Other middleware p50 ms | Serialization p50 ms | Header to finish p50 ms |
|---|---:|---:|---:|---:|
| health | 0.00 | 0.16 | 0.03 | 0.61 |
| discover | 2.27 | 0.10 | 2.08 | 0.65 |
| view-profile | 1.73 | 0.08 | 0.04 | 0.26 |
| letsbuzz-posts-reels | 1.63 | 0.07 | 0.21 | 0.32 |
| social-stats | 1.70 | 0.08 | 0.03 | 0.31 |
| notifications | 1.70 | 0.08 | 0.53 | 0.40 |
| matches-inbox | 1.83 | 0.11 | 0.08 | 0.34 |
| chat-open | 1.77 | 0.12 | 0.40 | 0.32 |
| chat-history | 1.62 | 0.08 | 0.40 | 0.30 |
| shared-purchased-media | 1.91 | 0.09 | 5.51 | 0.65 |
| unread | 1.75 | 0.07 | 0.04 | 0.32 |
| microbuzz | 1.61 | 0.07 | 0.03 | 0.26 |
| own-profile-gallery | 1.43 | 0.06 | 0.18 | 0.25 |
| gifts-catalog | 1.54 | 0.07 | 0.09 | 0.26 |
| video-call-active | 1.64 | 0.07 | 0.03 | 0.28 |
| chat-send | 2.65 | 0.50 | 0.07 | 0.83 |
| video-call-start | 3.02 | 0.36 | 0.07 | 0.50 |
| video-call-token | 2.46 | 0.38 | 0.08 | 0.39 |
| video-call-accept | 1.99 | 0.24 | 0.06 | 0.40 |
| video-call-end | 2.21 | 0.32 | 0.06 | 0.50 |

Body parsing, CORS, installed validation/rate limiting and error/logging middleware are covered when they execute. No standalone rate-limiter was exercised by these successful flows; absent work is not a measured zero. Auth includes its user lookup. Header-to-finish includes response flushing and diagnostic preparation; finish does not mean bytes have arrived at the device.

## Longest logical Mongo operations

| Flow | Logical operation | Calls per request p50 | Longest call per request p50 ms |
|---|---|---:|---:|
| shared-purchased-media | ChatRoom.findOne | 2 | 93.45 |
| unread | ChatRoom.find | 1 | 93.12 |
| discover | User.find | 1 | 35.60 |
| notifications | User.findOne | 81 | 29.25 |
| matches-inbox | ChatRoom.findOne | 20 | 28.37 |
| chat-send | ChatRoom.updateOne | 2 | 17.27 |
| video-call-start | VideoCallSession.create-save | 1 | 6.35 |
| discover | User.updateOne | 1 | 5.86 |
| video-call-start | VideoCallSession.findOne | 1 | 4.84 |
| video-call-start | VideoCallSession.find | 1 | 4.62 |
| video-call-end | VideoCallSession.save | 1 | 4.56 |
| video-call-accept | VideoCallSession.save | 1 | 4.25 |
| chat-send | User.countDocuments | 1 | 3.79 |
| chat-history | ChatRoom.aggregate | 1 | 3.42 |
| chat-open | ChatRoom.aggregate | 1 | 3.37 |
| chat-send | ChatRoom.findOne | 2 | 3.35 |
| video-call-start | User.findOne | 4 | 3.25 |
| video-call-start | Match.findOne | 1 | 3.23 |
| video-call-start | Relationship.findOne | 1 | 2.95 |
| chat-send | Match.findOne | 1 | 2.90 |

Logical query duration is not Mongo server execution time. Use the driver/hydration spans and bounded executionStats in baseline.md to distinguish these layers. Detailed driver commands, query offsets, process CPU/ELU context and overlap remain in evidence/local-baseline.json. No query predicates, raw command documents or response bodies are captured.
