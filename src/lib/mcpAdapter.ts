import type { Friend, Event, Memory } from '@/types'

function summarizeFriendBasic(friend: Friend) {
  const parts: string[] = []
  parts.push(`${friend.name}`)
  if (friend.relationship) parts.push(`relationship: ${friend.relationship}`)
  if (friend.level) parts.push(`level ${friend.level}`)
  if (typeof friend.streak !== 'undefined') parts.push(`streak: ${friend.streak}`)
  return parts.join(' • ')
}

export function buildFriendContext(friend: Friend, events: Event[], memories: Memory[]) {
  const lastEvent = events && events.length > 0 ? events[0] : null


  return {
    id: friend.id,
    name: friend.name,
    summary: summarizeFriendBasic(friend),
    lastEvent: lastEvent ? { title: lastEvent.title, date: new Date(lastEvent.date).toISOString(), category: lastEvent.category } : null,
    memoriesCount: memories.length,
    eventsCount: events.length,
    birthday: friend.birthday || null,
    raw: { friend, events, memories }
  }
}

export function listFriendsSummary(friends: Friend[]) {
  return friends.map(f => ({ id: f.id, name: f.name, summary: summarizeFriendBasic(f) }))
}

export function getEventsForFriend(allEvents: Event[], friendId: string) {
  return allEvents.filter(e => e.friendId === friendId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getMemoriesForFriend(allMemories: Memory[], friendId: string) {
  return allMemories.filter(m => m.friendId === friendId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getFriendById(friends: Friend[], friendId: string) {
  return friends.find(f => f.id === friendId) || null
}

export function listFriends(friends: Friend[]) {
  return friends.map(f => ({ ...f, summary: summarizeFriendBasic(f) }))
}

export function queryEvents(allEvents: Event[], opts: { friendId?: string; category?: string; since?: string } = {}) {
  let res = allEvents;
  if (opts.friendId) res = res.filter(e => e.friendId === opts.friendId);
  if (opts.category) res = res.filter(e => e.category === opts.category);
  if (opts.since) {
    const sinceDate = opts.since;
    res = res.filter(e => new Date(e.date) >= new Date(sinceDate));
  }
  return res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function queryMemories(allMemories: Memory[], opts: { friendId?: string; since?: string } = {}) {
  let res = allMemories;
  if (opts.friendId) res = res.filter(m => m.friendId === opts.friendId);
  if (opts.since) {
    const sinceDate = opts.since;
    res = res.filter(m => new Date(m.date) >= new Date(sinceDate));
  }
  return res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export default {
  buildFriendContext,
  listFriendsSummary,
  getEventsForFriend,
  getMemoriesForFriend
}
