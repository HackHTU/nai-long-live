import type { LiveRoom } from "../server";

declare module "cloudflare:workers" {
	interface ProvidedEnv {
		COMMENT_RATE_LIMIT: RateLimit;
		VOTE_RATE_LIMIT: RateLimit;
		LIVE_ROOM: DurableObjectNamespace<LiveRoom>;
	}
}
