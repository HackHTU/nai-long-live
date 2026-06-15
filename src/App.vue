<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import AppFooter from "@/components/live/AppFooter.vue";
import AppHeader from "@/components/live/AppHeader.vue";
import LiveSidebar from "@/components/live/LiveSidebar.vue";
import MainContent from "@/components/live/MainContent.vue";
import {
	MAX_DISPLAY_NAME_LENGTH,
	PLAYBACK_HARD_SYNC_SECONDS,
	PLAYBACK_SOFT_SYNC_SECONDS,
	PLAYBACK_START_GRACE_SECONDS,
} from "@/shared/config";
import type { CreateCommentInput, CreateVoteInput, Profile } from "@/shared/schemas";
import type { LiveSnapshot } from "@/shared/types";
import type { VideoItem } from "@/shared/videos";

const snapshot = ref<LiveSnapshot | null>(null);
const profile = ref<Profile>(loadProfile());
const displayName = ref(profile.value.name);
const commentBody = ref("");
const isPlaying = ref(true);
const isMuted = ref(true);
const volume = ref(0.8);
const errorMessage = ref("");
const playbackPrompt = ref("");
const videoElement = ref<HTMLVideoElement | null>(null);
const pollTimer = ref<number | null>(null);
const pendingPlayTimer = ref<number | null>(null);

const currentVideoId = computed(() => snapshot.value?.playback.videoId ?? null);

const currentVideo = computed(() => {
	return snapshot.value?.videos.find((video) => video.id === currentVideoId.value) ?? null;
});

const nextVideo = computed(() => {
	const nextVote = snapshot.value?.voteQueue[0];
	return snapshot.value?.videos.find((video) => video.id === nextVote?.videoId) ?? null;
});

const onlineCount = computed(() => {
	const names = new Set(snapshot.value?.comments.map((comment) => comment.authorName) ?? []);
	return Math.max(1, names.size);
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
	await syncVideo({ mode: "poll" });
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

function getTargetTime() {
	const state = snapshot.value?.playback;
	const video = currentVideo.value;
	if (!state || !video || !state.startedAt) {
		return null;
	}

	const serverElapsed = (state.serverNow - state.startedAt) / 1000;
	const localElapsed = (Date.now() - state.serverNow) / 1000;
	return Math.max(0, Math.min(video.durationSeconds - 0.1, serverElapsed + localElapsed));
}

async function syncVideo(options: { mode: "initial" | "switch" | "ready" | "poll" | "manual" }) {
	await nextTick();
	const element = videoElement.value;
	const targetTime = getTargetTime();
	if (!element || targetTime === null) {
		return;
	}

	element.volume = volume.value;
	element.muted = isMuted.value;
	element.playsInline = true;
	element.autoplay = true;

	const drift = targetTime - element.currentTime;
	const absDrift = Math.abs(drift);
	const shouldPrime =
		options.mode === "initial" || options.mode === "switch" || options.mode === "ready";
	const withinStartupGrace =
		options.mode === "ready" && element.currentTime <= PLAYBACK_START_GRACE_SECONDS;

	if (shouldPrime || absDrift >= PLAYBACK_HARD_SYNC_SECONDS || withinStartupGrace) {
		element.currentTime = targetTime;
		element.playbackRate = 1;
	} else if (absDrift >= PLAYBACK_SOFT_SYNC_SECONDS) {
		element.playbackRate = drift > 0 ? 1.06 : 0.94;
	} else {
		element.playbackRate = 1;
	}

	if (isPlaying.value && options.mode === "poll" && element.paused) {
		await ensurePlayback();
	}

	if (isPlaying.value && options.mode !== "poll") {
		await ensurePlayback();
	}
}

async function ensurePlayback(attempt = 0) {
	const element = videoElement.value;
	if (!element || !isPlaying.value) {
		return;
	}

	element.muted = isMuted.value;
	element.playsInline = true;

	try {
		await element.play();
		playbackPrompt.value = "";
	} catch {
		if (attempt >= 4 || !isPlaying.value) {
			playbackPrompt.value = "点击播放";
			return;
		}
		if (pendingPlayTimer.value) {
			window.clearTimeout(pendingPlayTimer.value);
		}
		pendingPlayTimer.value = window.setTimeout(
			() => {
				void ensurePlayback(attempt + 1);
			},
			150 * (attempt + 1),
		);
	}
}

async function handleVideoReady() {
	await syncVideo({ mode: "ready" });
}

function togglePlayback() {
	const element = videoElement.value;
	if (!element) {
		return;
	}

	if (element.paused) {
		isPlaying.value = true;
		playbackPrompt.value = "";
		void syncVideo({ mode: "manual" });
	} else {
		isPlaying.value = false;
		element.pause();
	}
}

function toggleMuted() {
	isMuted.value = !isMuted.value;
	if (!isMuted.value) {
		playbackPrompt.value = "";
	}
	if (videoElement.value) {
		videoElement.value.muted = isMuted.value;
	}
}

async function startPlaybackWithSound() {
	isPlaying.value = true;
	isMuted.value = false;
	playbackPrompt.value = "";
	if (videoElement.value) {
		videoElement.value.muted = false;
	}
	await syncVideo({ mode: "manual" });
}

function enterFullscreen() {
	void videoElement.value?.requestFullscreen();
}

watch(volume, (value) => {
	if (videoElement.value) {
		videoElement.value.volume = value;
	}
});

watch(currentVideoId, (videoId, previousVideoId) => {
	if (videoId === previousVideoId) {
		return;
	}
	void nextTick(() => {
		const element = videoElement.value;
		if (element) {
			if (pendingPlayTimer.value) {
				window.clearTimeout(pendingPlayTimer.value);
				pendingPlayTimer.value = null;
			}
			element.load();
		}
		void syncVideo({ mode: previousVideoId ? "switch" : "initial" });
	});
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
	if (pendingPlayTimer.value) {
		window.clearTimeout(pendingPlayTimer.value);
	}
});
</script>

<template>
	<div class="min-h-screen bg-[#f7f7f2] text-foreground">
		<AppHeader :online-count="onlineCount" />
		<main class="lg:h-[calc(100vh-121px)] lg:overflow-hidden">
			<div class="grid min-h-[calc(100vh-121px)] grid-cols-1 gap-0 lg:h-full lg:grid-cols-[minmax(0,1fr)_460px]">
				<MainContent
					v-model:video-element="videoElement"
					:current-video="currentVideo"
					:is-muted="isMuted"
					:is-playing="isPlaying"
					:playback-prompt="playbackPrompt"
					:snapshot="snapshot"
					:volume="volume"
					@enter-fullscreen="enterFullscreen"
					@start-with-sound="startPlaybackWithSound"
					@toggle-muted="toggleMuted"
					@toggle-playback="togglePlayback"
					@update:volume="volume = $event"
					@vote="submitVote"
					@video-ended="refreshSnapshot"
					@video-ready="handleVideoReady"
				/>

				<LiveSidebar
					:comment-body="commentBody"
					:display-name="displayName"
					:error-message="errorMessage"
					:profile="profile"
					:snapshot="snapshot"
					@save-profile="saveProfile"
					@submit-comment="submitComment"
					@update:comment-body="commentBody = $event"
					@update:display-name="displayName = $event"
					@vote="submitVote"
				/>
			</div>
		</main>
		<AppFooter />
	</div>
</template>
