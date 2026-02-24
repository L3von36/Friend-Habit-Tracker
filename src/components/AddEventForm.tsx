import type { Event, Friend } from "@/types";

interface AddEventFormProps {
  friendId: string;
  friends: Friend[];
  onSubmit: (event: Omit<Event, "id">) => void;
  onCancel: () => void;
}

export function AddEventForm({
  friendId,
  onSubmit,
}: AddEventFormProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Since the form fields are removed, we submit a default event.
    onSubmit({
      friendId,
      title: "New Event",
      description: "Logged from the simplified form.",
      date: new Date().toISOString().split("T")[0],
      category: "behavior",
      sentiment: "neutral",
      importance: 3,
      energyImpact: "neutral",
      tags: [],
      participantIds: [],
      attachments: []
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 text-center text-slate-500">
        <p>Event form is under construction.</p>
      </div>
      <button type="submit" className="w-full bg-violet-500 text-white p-2 rounded-lg">Log Default Event</button>
    </form>
  );
}
