<!-- Path: docs/performance/waterfalls.md; Purpose: Paired real-request timelines and nonoverlapping accounting. -->
# Paired request waterfalls

Each flow below uses one warm request at the middle rank of client duration. Every interval is from that request. Server offsets use its own monotonic clock. The client-to-server offset is unknown; no false wall-clock alignment is attempted. Tap, navigation, React/native content display and media display are unavailable without a device capture.

## discover

Request ID: `c31a4fc1-5c57-4ceb-9e08-e5240c9615f8`. HTTP to headers: **62.98 ms**; through body: **65.28 ms**; subsequent JSON parse: **2.06 ms**.

| Nonoverlapping backend interval category | ms |
|---|---:|
| dispatch-response-gaps | 0.20 |
| middleware | 0.09 |
| auth | 0.41 |
| mongo | 19.27 |
| mongo-command | 32.19 |
| handler | 1.13 |
| logic | 5.37 |
| serialize | 1.74 |
| **Backend to headers** | **60.42** |
| Client body total minus backend | 4.86 |

Longest inclusive spans (do not add to the table): User.find: 33.93 ms at server +18.79; User.updateOne: 6.11 ms at server +10.61; User.findOne: 5.95 ms at server +2.60; discover.filter-score: 3.45 ms at server +52.73; discover.sort-transform-sign: 1.91 ms at server +56.19.

## letsbuzz-posts-reels

Request ID: `84cf65d8-6c2a-4a5c-b9cc-708ce738a720`. HTTP to headers: **7.00 ms**; through body: **7.34 ms**; subsequent JSON parse: **0.23 ms**.

| Nonoverlapping backend interval category | ms |
|---|---:|
| dispatch-response-gaps | 0.14 |
| middleware | 0.07 |
| auth | 0.34 |
| mongo | 1.38 |
| mongo-command | 2.61 |
| handler | 0.70 |
| serialize | 0.36 |
| **Backend to headers** | **5.61** |
| Client body total minus backend | 1.73 |

Longest inclusive spans (do not add to the table): User.find: 1.65 ms at server +3.00; User.findOne: 1.29 ms at server +0.53; Match.find: 1.06 ms at server +1.89.

## notifications

Request ID: `0f0601ce-3364-4848-9034-6b2f477c49f4`. HTTP to headers: **37.24 ms**; through body: **37.40 ms**; subsequent JSON parse: **0.19 ms**.

| Nonoverlapping backend interval category | ms |
|---|---:|
| dispatch-response-gaps | 0.18 |
| middleware | 0.12 |
| auth | 0.34 |
| mongo | 7.42 |
| mongo-command | 26.14 |
| handler | 0.72 |
| serialize | 0.52 |
| **Backend to headers** | **35.44** |
| Client body total minus backend | 1.96 |

Longest inclusive spans (do not add to the table): User.findOne: 29.25 ms at server +5.51; User.findOne: 29.16 ms at server +5.50; User.findOne: 28.49 ms at server +5.99; User.findOne: 28.42 ms at server +5.98; User.findOne: 28.32 ms at server +5.96.

## matches-inbox

Request ID: `a09bc5f5-5d74-4b37-ab7c-4c8cc6e611d9`. HTTP to headers: **37.60 ms**; through body: **37.73 ms**; subsequent JSON parse: **0.04 ms**.

| Nonoverlapping backend interval category | ms |
|---|---:|
| dispatch-response-gaps | 0.14 |
| middleware | 0.07 |
| auth | 0.26 |
| mongo | 3.29 |
| mongo-command | 32.04 |
| handler | 0.34 |
| serialize | 0.08 |
| **Backend to headers** | **36.22** |
| Client body total minus backend | 1.51 |

Longest inclusive spans (do not add to the table): ChatRoom.findOne: 28.57 ms at server +7.43; ChatRoom.findOne: 28.49 ms at server +7.44; ChatRoom.findOne: 28.46 ms at server +7.38; ChatRoom.findOne: 28.43 ms at server +7.16; ChatRoom.findOne: 28.43 ms at server +7.31.

## chat-open

Request ID: `a20b1015-35ee-4f93-8cf7-3b86ea7c5e1e`. HTTP to headers: **13.22 ms**; through body: **13.42 ms**; subsequent JSON parse: **0.45 ms**.

| Nonoverlapping backend interval category | ms |
|---|---:|
| dispatch-response-gaps | 0.19 |
| middleware | 0.12 |
| auth | 0.30 |
| mongo | 3.29 |
| mongo-command | 6.98 |
| handler | 0.54 |
| serialize | 0.41 |
| **Backend to headers** | **11.84** |
| Client body total minus backend | 1.58 |

Longest inclusive spans (do not add to the table): ChatRoom.aggregate: 3.43 ms at server +7.72; User.countDocuments: 3.25 ms at server +4.40; Relationship.findOne: 2.82 ms at server +4.48; Match.findOne: 2.58 ms at server +4.46; User.findOne: 1.40 ms at server +0.58.

## shared-purchased-media

Request ID: `073c25bf-1851-49e6-8cb8-66b899991658`. HTTP to headers: **130.11 ms**; through body: **132.60 ms**; subsequent JSON parse: **2.72 ms**.

| Nonoverlapping backend interval category | ms |
|---|---:|
| dispatch-response-gaps | 0.30 |
| middleware | 0.10 |
| auth | 0.42 |
| mongo | 14.11 |
| mongo-command | 17.08 |
| handler | 19.69 |
| hydrate | 68.88 |
| serialize | 7.96 |
| **Backend to headers** | **128.53** |
| Client body total minus backend | 4.07 |

Longest inclusive spans (do not add to the table): ChatRoom.findOne: 93.45 ms at server +7.74; mongoose.document-init: 68.88 ms at server +32.25; User.countDocuments: 2.26 ms at server +5.38; User.findOne: 1.76 ms at server +0.79; Match.findOne: 1.67 ms at server +5.44.

## unread

Request ID: `f40553f4-0fd5-431e-9f8e-0e69b199998a`. HTTP to headers: **101.85 ms**; through body: **101.97 ms**; subsequent JSON parse: **0.01 ms**.

| Nonoverlapping backend interval category | ms |
|---|---:|
| dispatch-response-gaps | 0.36 |
| middleware | 0.07 |
| auth | 0.27 |
| mongo | 11.38 |
| mongo-command | 19.56 |
| handler | 1.15 |
| hydrate | 67.77 |
| serialize | 0.04 |
| **Backend to headers** | **100.59** |
| Client body total minus backend | 1.38 |

Longest inclusive spans (do not add to the table): ChatRoom.find: 90.77 ms at server +3.15; mongoose.document-init: 67.77 ms at server +26.10; Match.find: 5.48 ms at server +94.14; User.find: 5.37 ms at server +94.05; User.findOne: 1.36 ms at server +0.67.

## video-call-start

Request ID: `2e9e15cc-b789-49cf-b5dc-59ad0031f5f3`. HTTP to headers: **22.27 ms**; through body: **22.53 ms**; subsequent JSON parse: **0.03 ms**.

| Nonoverlapping backend interval category | ms |
|---|---:|
| dispatch-response-gaps | 0.30 |
| middleware | 0.36 |
| auth | 0.46 |
| mongo | 4.57 |
| mongo-command | 11.45 |
| handler | 2.96 |
| serialize | 0.09 |
| **Backend to headers** | **20.19** |
| Client body total minus backend | 2.35 |

Longest inclusive spans (do not add to the table): VideoCallSession.findOne: 6.08 ms at server +5.97; VideoCallSession.create-save: 5.48 ms at server +13.04; VideoCallSession.find: 3.73 ms at server +5.64; User.findOne: 3.14 ms at server +5.93; Match.findOne: 3.06 ms at server +5.80.

`mongo` in the nonoverlapping table means remaining Mongoose time after driver and hydration intervals. `auth` excludes its nested Mongo spans. `handler` is elapsed route work without a finer label; it is not proven CPU time. `dispatch-response-gaps` includes uncovered Express dispatch, response preparation and instrumentation. Process-wide event-loop diagnostics in raw traces are contextual and cannot be charged exclusively to this request. Approximate non-server time includes local scheduling/transport/body transfer; it is not a geographic RTT measurement.
