export type DomainEvent = { type: string };

type Subscriber = (event: any) => void | Promise<void>;

const subscribers = new Map<string, Subscriber[]>();

export const subscribe = (type: string, subscriber: Subscriber): void => {
	subscribers.set(type, [...(subscribers.get(type) ?? []), subscriber]);
};

// Any number of subscribers, and none of them can fail the command that emitted the
// event: a notification breaking must not undo an already-persisted approval.
export const emit = async <TEvent extends DomainEvent>(event: TEvent): Promise<void> => {
	for (const subscriber of subscribers.get(event.type) ?? []) {
		try {
			await subscriber(event);
		} catch (error) {
			console.error(`[events] subscriber failed for ${event.type}`, error);
		}
	}
};
