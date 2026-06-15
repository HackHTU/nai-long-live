import { describe, expect, it } from "vitest";
import {
	MAX_COMMENT_LENGTH,
	MAX_DISPLAY_NAME_LENGTH,
	MAX_VOTES_PER_VIDEO,
} from "../src/shared/config";
import { createCommentSchema, createVoteSchema, profileSchema } from "../src/shared/schemas";
import { videos } from "../src/shared/videos";

const author = {
	name: "测试观众",
	avatar: "avatar-test",
};

describe("shared schemas", () => {
	it("defines a validated video catalog", () => {
		expect(videos).toHaveLength(12);
		expect(videos.every((video) => video.type === "video")).toBe(true);
		expect(videos.every((video) => video.url.startsWith("/videos/"))).toBe(true);
	});

	it("validates display names and comments", () => {
		expect(profileSchema.safeParse(author).success).toBe(true);
		expect(
			profileSchema.safeParse({
				...author,
				name: "x".repeat(MAX_DISPLAY_NAME_LENGTH + 1),
			}).success,
		).toBe(false);
		expect(createCommentSchema.safeParse({ author, body: "来了" }).success).toBe(true);
		expect(
			createCommentSchema.safeParse({ author, body: "x".repeat(MAX_COMMENT_LENGTH + 1) }).success,
		).toBe(false);
	});

	it("rejects votes for unknown videos", () => {
		expect(createVoteSchema.safeParse({ author, videoId: videos[0]?.id }).success).toBe(true);
		expect(createVoteSchema.safeParse({ author, videoId: "missing" }).success).toBe(false);
		expect(MAX_VOTES_PER_VIDEO).toBe(200);
	});
});
