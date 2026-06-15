import { z } from "zod";
import { MAX_COMMENT_LENGTH, MAX_DISPLAY_NAME_LENGTH } from "./config";
import { videoById } from "./videos";

export const profileSchema = z.object({
	name: z.string().trim().min(1).max(MAX_DISPLAY_NAME_LENGTH),
	avatar: z.string().trim().min(1).max(120),
});

export const createCommentSchema = z.object({
	author: profileSchema,
	body: z.string().trim().min(1).max(MAX_COMMENT_LENGTH),
});

export const createVoteSchema = z.object({
	author: profileSchema,
	videoId: z.string().refine((value) => videoById.has(value), "Unknown video"),
});

export type Profile = z.infer<typeof profileSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateVoteInput = z.infer<typeof createVoteSchema>;
