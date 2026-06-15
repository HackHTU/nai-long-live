import type { VideoItem } from "./videos";

export interface LiveComment {
	id: number;
	authorName: string;
	authorAvatar: string;
	body: string;
	createdAt: number;
}

export interface VoteCount {
	videoId: string;
	count: number;
	isFull: boolean;
}

export interface VoteQueueItem {
	id: number;
	videoId: string;
	authorName: string;
	createdAt: number;
}

export interface PlaybackState {
	videoId: string | null;
	startedAt: number | null;
	serverNow: number;
	empty: boolean;
}

export interface LiveSnapshot {
	videos: VideoItem[];
	playback: PlaybackState;
	comments: LiveComment[];
	voteCounts: VoteCount[];
	voteQueue: VoteQueueItem[];
}
