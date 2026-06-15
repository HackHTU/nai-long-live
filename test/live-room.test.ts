import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { MAX_VOTES_PER_VIDEO } from "../src/shared/config";

const author = {
	name: "测试观众",
	avatar: "avatar-test",
};

describe("LiveRoom", () => {
	it("starts empty before voting", async () => {
		const room = env.LIVE_ROOM.getByName("empty-room");
		const snapshot = await room.getSnapshot();

		expect(snapshot.playback.empty).toBe(true);
		expect(snapshot.playback.videoId).toBeNull();
		expect(snapshot.videos.length).toBeGreaterThan(0);
	});

	it("stores comments", async () => {
		const room = env.LIVE_ROOM.getByName("comments-room");
		const result = await room.addComment({
			author,
			body: "来了",
		});

		expect(result.comment.body).toBe("来了");
		expect(result.snapshot.comments.at(-1)?.body).toBe("来了");
	});

	it("starts playback from FIFO votes", async () => {
		const room = env.LIVE_ROOM.getByName("votes-room");

		await room.addVote({ author, videoId: "bounce" });
		await room.addVote({ author, videoId: "simple" });
		const snapshot = await room.getSnapshot();

		expect(snapshot.playback.videoId).toBe("bounce");
		expect(snapshot.voteQueue[0]?.videoId).toBe("simple");
	});

	it("limits each video option to 200 queued votes", async () => {
		const room = env.LIVE_ROOM.getByName("vote-limit-room");

		for (let index = 0; index < MAX_VOTES_PER_VIDEO + 1; index += 1) {
			await room.addVote({ author, videoId: "simple" });
		}

		let message = "";
		try {
			await room.addVote({ author, videoId: "simple" });
		} catch (error) {
			message = error instanceof Error ? error.message : String(error);
		}

		expect(message).toBe("VOTE_OPTION_FULL");
	});
});
