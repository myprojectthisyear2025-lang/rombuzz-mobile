/** Path: scripts/performance/seed.cjs
 * Purpose: Representative synthetic records and existing-index creation ONLY in a disposable local database. */
const { backendRequire } = require('./local-harness.cjs');
async function seed(mongoose) {
  if (mongoose.connection.host !== '127.0.0.1') throw new Error('Local fixture only');
  const User = backendRequire('./models/User');
  const Match = backendRequire('./models/Match');
  const Post = backendRequire('./models/PostModel');
  const Room = backendRequire('./models/ChatRoom');
  const Notification = backendRequire('./models/Notification');
  const Relationship = backendRequire('./models/Relationship');
  const Presence = backendRequire('./models/MicroBuzzPresence');
  const now = Date.now();
  await User.insertMany(Array.from({ length: 401 }, (_, i) => ({
    id: `perf${i}`, email: `perf${i}@example.test`, firstName: 'Synthetic',
    gender: i % 2 ? 'female' : 'male', dob: '01/01/1995', city: 'Synthetic', country: 'US',
    location: { lat: 0.001 * (i % 20), lng: 0.001 * (i % 10) }, lastActive: now,
    bio: 'Synthetic profile for measurement. '.repeat(10), interests: ['music', 'walking'],
    avatar: 'https://example.test/avatar.jpg', preferences: { gender: 'everyone' },
    media: Array.from({ length: 4 }, (_, j) => ({ id: `media${i}-${j}`, type: j === 3 ? 'reel' : 'image',
      url: `https://example.test/${j === 3 ? 'video.mp4' : 'image.jpg'}`, privacy: 'public',
      caption: j === 3 ? 'scope:public kind:reel' : 'scope:public kind:photo' })),
  })));
  await Match.insertMany(Array.from({ length: 20 }, (_, i) => ({ id: `match${i}`, users: ['perf0', `perf${i + 1}`] })));
  await Post.insertMany(Array.from({ length: 120 }, (_, i) => ({ id: `post${i}`, userId: `perf${1 + i % 20}`,
    text: 'Synthetic post', type: i % 3 === 0 ? 'video' : 'image', visibility: 'matches', privacy: 'matches',
    mediaUrl: `https://example.test/${i % 3 === 0 ? 'video.mp4' : 'image.jpg'}`,
    createdAt: new Date(now - i * 60000) })));
  await Room.create({ roomId: 'perf0_perf1', participants: ['perf0', 'perf1'],
    messages: Array.from({ length: 500 }, (_, i) => ({ id: `msg${i}`, from: i % 2 ? 'perf0' : 'perf1',
      to: i % 2 ? 'perf1' : 'perf0', text: 'Synthetic message', time: new Date(now - (500 - i) * 60000) })) });
  await Notification.insertMany(Array.from({ length: 80 }, (_, i) => ({ id: `notice${i}`, fromId: `perf${i % 20 + 1}`,
    toId: 'perf0', type: 'buzz', message: 'Synthetic notice', createdAt: new Date(now - i * 60000) })));
  // Build only indexes already declared in these existing models, and only on the disposable database.
  for (const model of [User, Match, Post, Room, Notification, Relationship, Presence]) await model.createIndexes();
  return { users: 401, matches: 20, posts: 120, messages: 500, notifications: 80,
    media: 'example.test references only; no CDN requests', models: [User, Match, Post, Room] };
}
module.exports = { seed };
