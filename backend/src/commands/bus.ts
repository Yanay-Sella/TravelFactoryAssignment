export type Command = { type: string };

type CommandHandler = (command: any) => Promise<unknown>;

const handlers = new Map<string, CommandHandler>();

export const registerCommand = (type: string, handler: CommandHandler): void => {
	handlers.set(type, handler);
};

// Exactly one handler per command, and its result is returned to the caller.
export const dispatch = async <TResult>(command: Command): Promise<TResult> => {
	const handler = handlers.get(command.type);

	if (!handler) {
		throw new Error(`No handler registered for command "${command.type}"`);
	}

	return (await handler(command)) as TResult;
};
