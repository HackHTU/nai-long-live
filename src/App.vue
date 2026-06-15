<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import LiveSidebar from "@/components/live/LiveSidebar.vue";
import VideoStage from "@/components/live/VideoStage.vue";
import { MAX_DISPLAY_NAME_LENGTH, PLAYBACK_DRIFT_TOLERANCE_SECONDS } from "@/shared/config";
import type { CreateCommentInput, CreateVoteInput, Profile } from "@/shared/schemas";
import type { LiveSnapshot } from "@/shared/types";
import type { VideoItem } from "@/shared/videos";

const snapshot = ref<LiveSnapshot | null>(null);
const profile = ref<Profile>(loadProfile());
const displayName = ref(profile.value.name);
const commentBody = ref("");
const isPlaying = ref(true);
const isMuted = ref(false);
const volume = ref(0.8);
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
			<VideoStage
				v-model:video-element="videoElement"
				:current-video="currentVideo"
				:is-muted="isMuted"
				:is-playing="isPlaying"
				:next-video="nextVideo"
				:volume="volume"
				@enter-fullscreen="enterFullscreen"
				@toggle-muted="toggleMuted"
				@toggle-playback="togglePlayback"
				@update:volume="volume = $event"
				@video-ended="refreshSnapshot"
				@video-ready="syncVideo"
			/>

			<LiveSidebar
				:comment-body="commentBody"
				:display-name="displayName"
				:error-message="errorMessage"
				:next-video="nextVideo"
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
</template>
