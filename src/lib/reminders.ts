import type { Friend, Reminder, Event } from '@/types';

export function generateReminders(friends: Friend[], events: Event[]): Reminder[] {
  const reminders: Reminder[] = [];
  const today = new Date();

  friends.forEach(friend => {
    const friendEvents = events.filter(e => e.friendId === friend.id);
    const lastEvent = friendEvents.length > 0 
      ? new Date(Math.max(...friendEvents.map(e => new Date(e.date).getTime())))
      : null;

    // Check-in reminder (if no contact in 14 days)
    if (lastEvent) {
      const daysSinceContact = Math.floor((today.getTime() - lastEvent.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceContact >= 14) {
        reminders.push({
          id: `checkin-${friend.id}`,
          friendId: friend.id,
          type: 'checkin',
          message: `You haven't talked to ${friend.name} in ${daysSinceContact} days`,
          date: today.toISOString(),
          dismissed: false,
        });
      }
    }

    // Birthday reminder
    if (friend.birthday) {
      const birthday = new Date(friend.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      const daysUntilBirthday = Math.floor((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilBirthday <= 7 && daysUntilBirthday >= 0) {
        reminders.push({
          id: `birthday-${friend.id}-${today.getFullYear()}`,
          friendId: friend.id,
          type: 'birthday',
          message: daysUntilBirthday === 0 
            ? `It's ${friend.name}'s birthday today!`
            : `${friend.name}'s birthday is in ${daysUntilBirthday} days`,
          date: thisYearBirthday.toISOString(),
          dismissed: false,
        });
      }
    }
  });

  return reminders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function exportData(friends: Friend[], events: Event[]): string {
  const data = {
    friends,
    events,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): { friends: Friend[]; events: Event[] } | null {
  try {
    const data = JSON.parse(jsonString);
    if (data.friends && data.events) {
      return { friends: data.friends, events: data.events };
    }
    return null;
  } catch {
    return null;
  }
}
