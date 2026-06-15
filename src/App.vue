<script setup lang="ts">
import {
	Maximize2,
	MessageCircle,
	Pause,
	Play,
	Send,
	Volume2,
	VolumeX,
	Vote,
} from "lucide-vue-next";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
	MAX_COMMENT_LENGTH,
	MAX_DISPLAY_NAME_LENGTH,
	PLAYBACK_DRIFT_TOLERANCE_SECONDS,
} from "./shared/config";
import type { CreateCommentInput, CreateVoteInput, Profile } from "./shared/schemas";
import type { LiveSnapshot } from "./shared/types";
import type { VideoItem } from "./shared/videos";

const snapshot = ref<LiveSnapshot | null>(null);
const profile = ref<Profile>(loadProfile());
const displayName = ref(profile.value.name);
const commentBody = ref("");
const isPlaying = ref(true);
const isMuted = ref(false);
const volume = ref(0.8);
const activeMobilePanel = ref<"comments" | "votes">("comments");
const errorMessage = ref("");
const videoElement = ref<HTMLVideoElement | null>(null);
const pollTimer = ref<number | null>(null);

const currentVideo = computed(() => {
	const currentId = snapshot.value?.playback.videoId;
	return snapshot.value?.videos.find((video) => video.id === currentId) ?? null;
});

const nextVideo = computed(() => {
	const nextVote = snapshot.value?.voteQueue[0];
	return snapshot.value?.videos.find((video) => video.id === nextVote?.videoId) ?? null;
});

const voteCountByVideo = computed(() => {
	const counts = new Map<string, { count: number; isFull: boolean }>();
	for (const item of snapshot.value?.voteCounts ?? []) {
		counts.set(item.videoId, { count: item.count, isFull: item.isFull });
	}
	return counts;
});

function loadProfile(): Profile {
	const saved = localStorage.getItem("nai-long-profile");
	if (saved) {
		try {
			return JSON.parse(saved) as Profile;
		} catch {
			localStorage.removeItem("nai-long-profile");
		}
	}

	const seed = Math.floor(Math.random() * 9000) + 1000;
	return {
		name: `观众${seed}`,
		avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=nai-long-${seed}`,
	};
}

function saveProfile() {
	const nextName = displayName.value.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
	profile.value = {
		...profile.value,
		name: nextName || profile.value.name,
	};
	displayName.value = profile.value.name;
	localStorage.setItem("nai-long-profile", JSON.stringify(profile.value));
}

async function refreshSnapshot() {
	const response = await fetch("/api/live");
	if (!response.ok) {
		throw new Error("无法连接直播间");
	}
	snapshot.value = await response.json();
	await syncVideo();
}

async function postJson<T>(url: string, body: T) {
	const response = await fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
	const data = await response.json();
	if (!response.ok) {
		throw new Error(data.error ?? "请求失败");
	}
	return data as { snapshot: LiveSnapshot };
}

async function submitComment() {
	errorMessage.value = "";
	saveProfile();
	const body = commentBody.value.trim();
	if (!body) {
		return;
	}

	try {
		const payload: CreateCommentInput = { author: profile.value, body };
		const data = await postJson("/api/comments", payload);
		snapshot.value = data.snapshot;
		commentBody.value = "";
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : "评论失败";
	}
}

async function submitVote(video: VideoItem) {
	errorMessage.value = "";
	saveProfile();
	try {
		const payload: CreateVoteInput = { author: profile.value, videoId: video.id };
		const data = await postJson("/api/votes", payload);
		snapshot.value = data.snapshot;
	} catch (error) {
		errorMessage.value = error instanceof Error ? error.message : "投票失败";
	}
}

async function syncVideo() {
	await nextTick();
	const element = videoElement.value;
	const state = snapshot.value?.playback;
	const video = currentVideo.value;
	if (!element || !state || !video || !state.startedAt) {
		return;
	}

	element.volume = volume.value;
	element.muted = isMuted.value;

	const serverElapsed = (state.serverNow - state.startedAt) / 1000;
	const localElapsed = (Date.now() - state.serverNow) / 1000;
	const targetTime = Math.max(
		0,
		Math.min(video.durationSeconds - 0.1, serverElapsed + localElapsed),
	);

	if (Math.abs(element.currentTime - targetTime) > PLAYBACK_DRIFT_TOLERANCE_SECONDS) {
		element.currentTime = targetTime;
	}

	if (isPlaying.value) {
		await element.play().catch(() => {
			isPlaying.value = false;
		});
	}
}

function togglePlayback() {
	const element = videoElement.value;
	if (!element) {
		return;
	}

	if (element.paused) {
		isPlaying.value = true;
		void syncVideo();
	} else {
		isPlaying.value = false;
		element.pause();
	}
}

function toggleMuted() {
	isMuted.value = !isMuted.value;
	if (videoElement.value) {
		videoElement.value.muted = isMuted.value;
	}
}

function enterFullscreen() {
	void videoElement.value?.requestFullscreen();
}

watch(volume, (value) => {
	if (videoElement.value) {
		videoElement.value.volume = value;
	}
});

watch(currentVideo, () => {
	void syncVideo();
});

onMounted(async () => {
	saveProfile();
	await refreshSnapshot().catch((error) => {
		errorMessage.value = error instanceof Error ? error.message : "加载失败";
	});
	pollTimer.value = window.setInterval(() => {
		void refreshSnapshot().catch(() => {});
	}, 3000);
});

onUnmounted(() => {
	if (pollTimer.value) {
		window.clearInterval(pollTimer.value);
	}
});
</script>

<template>
	<main class="min-h-screen bg-[#f7f7f2] text-foreground lg:h-screen lg:overflow-hidden">
		<div class="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_380px]">
			<section class="relative flex min-h-[70vh] items-center justify-center bg-[#101114] p-3 lg:min-h-screen lg:p-6">
				<div class="relative aspect-[9/16] h-full max-h-[calc(100vh-48px)] w-full max-w-[520px] overflow-hidden rounded-lg bg-black shadow-2xl">
					<video
						v-if="currentVideo"
						ref="videoElement"
						class="h-full w-full object-cover"
						:src="currentVideo.url"
						:muted="isMuted"
						playsinline
						autoplay
						@loadedmetadata="syncVideo"
						@ended="refreshSnapshot"
					/>
					<div v-else class="flex h-full flex-col items-center justify-center p-8 text-center text-white">
						<p class="text-sm text-white/60">等待投票</p>
						<h1 class="mt-2 text-2xl font-semibold">选择下一段内容</h1>
						<p class="mt-3 text-sm text-white/70">当前队列为空，投票后直播会立即开始。</p>
					</div>

					<div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 text-white">
						<p class="text-xs uppercase tracking-[0.18em] text-white/60">LIVE</p>
						<h2 class="mt-1 text-xl font-semibold">{{ currentVideo?.name ?? "等待投票" }}</h2>
						<p class="mt-1 line-clamp-2 text-sm text-white/70">
							{{ currentVideo?.description ?? "所有观众将看到同一段同步播放的视频。" }}
						</p>
					</div>
				</div>

				<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-2 text-white backdrop-blur">
					<button class="grid size-9 place-items-center rounded-full hover:bg-white/10" type="button" @click="togglePlayback">
						<Pause v-if="isPlaying" class="size-4" />
						<Play v-else class="size-4" />
					</button>
					<button class="grid size-9 place-items-center rounded-full hover:bg-white/10" type="button" @click="toggleMuted">
						<VolumeX v-if="isMuted" class="size-4" />
						<Volume2 v-else class="size-4" />
					</button>
					<input v-model.number="volume" class="w-20 accent-white" max="1" min="0" step="0.05" type="range" />
					<button class="grid size-9 place-items-center rounded-full hover:bg-white/10" type="button" @click="enterFullscreen">
						<Maximize2 class="size-4" />
					</button>
				</div>
			</section>

			<aside class="relative flex min-h-[40vh] flex-col border-l border-black/10 bg-white lg:h-screen">
				<div class="flex items-center justify-between border-b border-border px-4 py-3">
					<div>
						<p class="text-xs text-muted-foreground">同步直播间</p>
						<h2 class="text-lg font-semibold">评论与投票</h2>
					</div>
					<img class="size-10 rounded-full border" :alt="profile.name" :src="profile.avatar" />
				</div>

				<div class="grid grid-cols-2 border-b border-border lg:hidden">
					<button
						class="flex items-center justify-center gap-2 px-3 py-3 text-sm"
						:class="activeMobilePanel === 'comments' ? 'bg-secondary font-medium' : 'text-muted-foreground'"
						type="button"
						@click="activeMobilePanel = 'comments'"
					>
						<MessageCircle class="size-4" />
						评论
					</button>
					<button
						class="flex items-center justify-center gap-2 px-3 py-3 text-sm"
						:class="activeMobilePanel === 'votes' ? 'bg-secondary font-medium' : 'text-muted-foreground'"
						type="button"
						@click="activeMobilePanel = 'votes'"
					>
						<Vote class="size-4" />
						投票
					</button>
				</div>

				<div class="grid min-h-0 flex-1 grid-rows-1 lg:grid-rows-[1fr_1fr]">
					<section class="min-h-0 flex-col border-b border-border" :class="activeMobilePanel === 'comments' ? 'flex' : 'hidden lg:flex'">
						<div class="flex items-center gap-2 border-b border-border px-4 py-3">
							<input
								v-model="displayName"
								class="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
								:maxlength="MAX_DISPLAY_NAME_LENGTH"
								@change="saveProfile"
							/>
						</div>
						<div class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
							<div v-for="comment in snapshot?.comments ?? []" :key="comment.id" class="flex gap-3">
								<img class="size-8 rounded-full border" :alt="comment.authorName" :src="comment.authorAvatar" />
								<div class="min-w-0">
									<p class="text-xs font-medium">{{ comment.authorName }}</p>
									<p class="break-words text-sm text-muted-foreground">{{ comment.body }}</p>
								</div>
							</div>
						</div>
						<form class="flex gap-2 border-t border-border p-3" @submit.prevent="submitComment">
							<input
								v-model="commentBody"
								class="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
								:maxlength="MAX_COMMENT_LENGTH"
								placeholder="发送评论"
							/>
							<button class="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground" type="submit">
								<Send class="size-4" />
							</button>
						</form>
					</section>

					<section class="min-h-0 flex-col" :class="activeMobilePanel === 'votes' ? 'flex' : 'hidden lg:flex'">
						<div class="border-b border-border px-4 py-3">
							<p class="text-sm font-medium">下一段内容</p>
							<p class="text-xs text-muted-foreground">
								{{ nextVideo ? `队列下一条：${nextVideo.name}` : "队列为空，投票后开始播放。" }}
							</p>
						</div>
						<div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
							<button
								v-for="video in snapshot?.videos ?? []"
								:key="video.id"
								class="w-full rounded-lg border border-border bg-card p-3 text-left transition hover:border-ring disabled:opacity-50"
								:disabled="voteCountByVideo.get(video.id)?.isFull"
								type="button"
								@click="submitVote(video)"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-medium">{{ video.name }}</p>
										<p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ video.description }}</p>
									</div>
									<span class="rounded-full bg-secondary px-2 py-1 text-xs">
										{{ voteCountByVideo.get(video.id)?.count ?? 0 }}/200
									</span>
								</div>
							</button>
						</div>
					</section>
				</div>

				<p v-if="errorMessage" class="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
					{{ errorMessage }}
				</p>
				<div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent lg:hidden" />
			</aside>
		</div>
		<link v-if="nextVideo" rel="prefetch" as="video" :href="nextVideo.url" />
	</main>
</template>
