import { LIVE_ROOM_ID } from "../src/shared/config";
import { createCommentSchema, createVoteSchema } from "../src/shared/schemas";
import { LiveRoom } from "./do/live-room";

export { LiveRoom };

function json(data: unknown, init?: ResponseInit) {
	return Response.json(data, {
		...init,
		headers: {
			"cache-control": "no-store",
			...init?.headers,
		},
	});
}

function getClientKey(request: Request) {
	return (
		request.headers.get("cf-connecting-ip") ??
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		"local"
	);
}

async function parseJson(request: Request) {
	try {
		return await request.json();
	} catch {
		return null;
	}
}

async function enforceRateLimit(binding: RateLimit, request: Request) {
	const outcome = await binding.limit({ key: getClientKey(request) });
	if (!outcome.success) {
		return json({ error: "RATE_LIMITED" }, { status: 429 });
	}
	return null;
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const room = env.LIVE_ROOM.getByName(LIVE_ROOM_ID);

		if (url.pathname === "/api/live" && request.method === "GET") {
			return json(await room.getSnapshot());
		}

		if (url.pathname === "/api/comments" && request.method === "POST") {
			const limited = await enforceRateLimit(env.COMMENT_RATE_LIMIT, request);
			if (limited) {
				return limited;
			}

			const parsed = createCommentSchema.safeParse(await parseJson(request));
			if (!parsed.success) {
				return json({ error: "VALIDATION_FAILED", issues: parsed.error.issues }, { status: 400 });
			}

			return json(await room.addComment(parsed.data));
		}

		if (url.pathname === "/api/votes" && request.method === "POST") {
			const limited = await enforceRateLimit(env.VOTE_RATE_LIMIT, request);
			if (limited) {
				return limited;
			}

			const parsed = createVoteSchema.safeParse(await parseJson(request));
			if (!parsed.success) {
				return json({ error: "VALIDATION_FAILED", issues: parsed.error.issues }, { status: 400 });
			}

			try {
				return json(await room.addVote(parsed.data));
			} catch (error) {
				if (error instanceof Error && error.message === "VOTE_OPTION_FULL") {
					return json({ error: "VOTE_OPTION_FULL" }, { status: 409 });
				}
				throw error;
			}
		}

		if (url.pathname.startsWith("/api/")) {
			return json({ error: "NOT_FOUND" }, { status: 404 });
		}

		return new Response(null, { status: 404 });
	},
} satisfies ExportedHandler<Env>;
