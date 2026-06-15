import { DurableObject } from "cloudflare:workers";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { type DrizzleSqliteDODatabase, drizzle } from "drizzle-orm/durable-sqlite";
import {
	MAX_VOTES_PER_VIDEO,
	RECENT_COMMENT_LIMIT,
	VOTE_QUEUE_PREVIEW_LIMIT,
} from "../../src/shared/config";
import type { CreateCommentInput, CreateVoteInput } from "../../src/shared/schemas";
import type { LiveComment, LiveSnapshot, VoteCount, VoteQueueItem } from "../../src/shared/types";
import { getVideoById, videos } from "../../src/shared/videos";
import { comments, votes } from "../db/schema";

export class LiveRoom extends DurableObject<Env> {
	private readonly db: DrizzleSqliteDODatabase;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.db = drizzle(ctx.storage, { logger: false });
		ctx.blockConcurrencyWhile(async () => {
			this.migrate();
			this.ensurePlayback();
		});
	}

	async getSnapshot(): Promise<LiveSnapshot> {
		this.advancePlayback();
		return this.buildSnapshot();
	}

	async addComment(
		input: CreateCommentInput,
	): Promise<{ comment: LiveComment; snapshot: LiveSnapshot }> {
		const now = Date.now();
		const [inserted] = await this.db
			.insert(comments)
			.values({
				authorName: input.author.name,
				authorAvatar: input.author.avatar,
				body: input.body,
				createdAt: now,
			})
			.returning();

		if (!inserted) {
			throw new Error("COMMENT_INSERT_FAILED");
		}

		const comment = {
			id: inserted.id,
			authorName: inserted.authorName,
			authorAvatar: inserted.authorAvatar,
			body: inserted.body,
			createdAt: inserted.createdAt,
		};

		return { comment, snapshot: await this.getSnapshot() };
	}

	async addVote(input: CreateVoteInput): Promise<{ vote: VoteQueueItem; snapshot: LiveSnapshot }> {
		const existingCount = await this.countVotesForVideo(input.videoId);
		if (existingCount >= MAX_VOTES_PER_VIDEO) {
			throw new Error("VOTE_OPTION_FULL");
		}

		const now = Date.now();
		const [inserted] = await this.db
			.insert(votes)
			.values({
				videoId: input.videoId,
				authorName: input.author.name,
				authorAvatar: input.author.avatar,
				createdAt: now,
			})
			.returning();

		if (!inserted) {
			throw new Error("VOTE_INSERT_FAILED");
		}

		const current = this.getPlaybackRow();
		if (!current.videoId) {
			this.startNextFromQueue(now);
		}

		const vote = {
			id: inserted.id,
			videoId: inserted.videoId,
			authorName: inserted.authorName,
			createdAt: inserted.createdAt,
		};

		return { vote, snapshot: await this.getSnapshot() };
	}

	private migrate() {
		this.ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS comments (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				author_name TEXT NOT NULL,
				author_avatar TEXT NOT NULL,
				body TEXT NOT NULL,
				created_at INTEGER NOT NULL
			);
			CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at);
			CREATE TABLE IF NOT EXISTS votes (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				video_id TEXT NOT NULL,
				author_name TEXT NOT NULL,
				author_avatar TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				consumed_at INTEGER
			);
			CREATE INDEX IF NOT EXISTS votes_video_id_idx ON votes(video_id);
			CREATE INDEX IF NOT EXISTS votes_consumed_at_id_idx ON votes(consumed_at, id);
			CREATE TABLE IF NOT EXISTS playback (
				id INTEGER PRIMARY KEY,
				video_id TEXT,
				started_at INTEGER
			);
		`);
	}

	private ensurePlayback() {
		const row = this.ctx.storage.sql
			.exec<{ total: number }>("SELECT COUNT(*) as total FROM playback WHERE id = 1")
			.one();

		if (row.total === 0) {
			this.ctx.storage.sql.exec(
				"INSERT INTO playback (id, video_id, started_at) VALUES (1, NULL, NULL)",
			);
		}
	}

	private advancePlayback() {
		const now = Date.now();
		let current = this.getPlaybackRow();

		if (!current.videoId || !current.startedAt) {
			this.startNextFromQueue(now);
			return;
		}

		while (current.videoId && current.startedAt) {
			const video = getVideoById(current.videoId);
			if (!video) {
				this.startNextFromQueue(now);
				current = this.getPlaybackRow();
				continue;
			}

			const elapsedMs = now - current.startedAt;
			if (elapsedMs < video.durationSeconds * 1000) {
				return;
			}

			this.startNextFromQueue(now);
			current = this.getPlaybackRow();
			if (!current.videoId) {
				return;
			}
		}
	}

	private startNextFromQueue(now: number) {
		const next = this.ctx.storage.sql
			.exec<{ id: number; videoId: string }>(
				"SELECT id, video_id as videoId FROM votes WHERE consumed_at IS NULL ORDER BY id ASC LIMIT 1",
			)
			.toArray()[0];

		if (!next || !getVideoById(next.videoId)) {
			this.ctx.storage.sql.exec(
				"UPDATE playback SET video_id = NULL, started_at = NULL WHERE id = 1",
			);
			return;
		}

		this.ctx.storage.sql.exec("UPDATE votes SET consumed_at = ? WHERE id = ?", now, next.id);
		this.ctx.storage.sql.exec(
			"UPDATE playback SET video_id = ?, started_at = ? WHERE id = 1",
			next.videoId,
			now,
		);
	}

	private getPlaybackRow() {
		return this.ctx.storage.sql
			.exec<{ videoId: string | null; startedAt: number | null }>(
				"SELECT video_id as videoId, started_at as startedAt FROM playback WHERE id = 1",
			)
			.one();
	}

	private async buildSnapshot(): Promise<LiveSnapshot> {
		const current = this.getPlaybackRow();
		const recentComments = await this.db
			.select()
			.from(comments)
			.orderBy(desc(comments.createdAt))
			.limit(RECENT_COMMENT_LIMIT);
		const queue = await this.db
			.select()
			.from(votes)
			.where(isNull(votes.consumedAt))
			.orderBy(asc(votes.id))
			.limit(VOTE_QUEUE_PREVIEW_LIMIT);
		const voteCounts = await this.getVoteCounts();

		return {
			videos,
			playback: {
				videoId: current.videoId,
				startedAt: current.startedAt,
				serverNow: Date.now(),
				empty: !current.videoId,
			},
			comments: recentComments.reverse().map((comment) => ({
				id: comment.id,
				authorName: comment.authorName,
				authorAvatar: comment.authorAvatar,
				body: comment.body,
				createdAt: comment.createdAt,
			})),
			voteCounts,
			voteQueue: queue.map((vote) => ({
				id: vote.id,
				videoId: vote.videoId,
				authorName: vote.authorName,
				createdAt: vote.createdAt,
			})),
		};
	}

	private async getVoteCounts(): Promise<VoteCount[]> {
		const rows = await this.db
			.select({
				videoId: votes.videoId,
				value: count(),
			})
			.from(votes)
			.where(isNull(votes.consumedAt))
			.groupBy(votes.videoId);
		const countByVideo = new Map(rows.map((row) => [row.videoId, row.value]));

		return videos.map((video) => {
			const value = countByVideo.get(video.id) ?? 0;
			return {
				videoId: video.id,
				count: value,
				isFull: value >= MAX_VOTES_PER_VIDEO,
			};
		});
	}

	private async countVotesForVideo(videoId: string) {
		const [row] = await this.db
			.select({ value: count() })
			.from(votes)
			.where(and(eq(votes.videoId, videoId), isNull(votes.consumedAt)));
		return row?.value ?? 0;
	}
}
