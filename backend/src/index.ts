import { loadEnv } from "commoneventframework";

const envReady = loadEnv();

import "./generated/HandlerRegistry";

import { createServer } from "node:http";
import {
	APIGatewayProxyStructuredResultV2,
	Context,
	buildCommonEvent,
	getRouteConfig,
	registerHandler,
	resolveHandlerRef,
	Response,
	setLambdaContext
} from "commoneventframework";
import requestListener from "commoneventframework/dist/dev/requestListener";
import { CommonEvent, LambdaEvent } from "commoneventframework/dist/types/commonEvent";
import { HandlerFn, InputParserFn } from "./handlers/types";

export const handler = async (
	event: LambdaEvent,
	context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
	await envReady;
	await setLambdaContext(context);
	const commonEvent: CommonEvent = await buildCommonEvent(event);

	try {
		const routeConfig = getRouteConfig(commonEvent);

		if (!routeConfig || !routeConfig.handler) {
			return new Response(404, { error: "Route not found" });
		}

		const handlerFn = resolveHandlerRef(routeConfig.handler) as HandlerFn | undefined;
		const parserFn = routeConfig.inputParser
			? resolveHandlerRef(routeConfig.inputParser) as InputParserFn | undefined
			: undefined;

		if (!handlerFn) {
			return new Response(500, { error: `Handler "${routeConfig.handler}" not found` });
		}

		const input = parserFn ? parserFn(commonEvent) : {};
		if (input instanceof Response) return input;

		const result = await handlerFn(input, commonEvent);

		if (result && 'statusCode' in result) {
			return result as APIGatewayProxyStructuredResultV2;
		}
		return new Response(200, result as object);
	} catch (err) {
		console.error('handler error', err);
		return new Response(500, err as object);
	}
};

// CEF's startDevServer binds to "localhost", which is unreachable from outside a
// container. Same listener, same request mapping — only the bind address differs.
if (process.argv.includes("--local")) {
	registerHandler(handler);

	const port = Number(process.env.PORT ?? 8888);
	const host = process.env.HOST ?? "0.0.0.0";

	createServer(requestListener).listen(port, host, () => {
		console.log(`Server is running on http://${host}:${port}`);
	});
}
