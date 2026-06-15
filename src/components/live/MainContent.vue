<script setup lang="ts">
import type { LiveSnapshot } from "@/shared/types";
import type { VideoItem } from "@/shared/videos";
import VideoStage from "./VideoStage.vue";
import VotePanel from "./VotePanel.vue";

defineProps<{
	snapshot: LiveSnapshot | null;
	currentVideo: VideoItem | null;
	isPlaying: boolean;
	isMuted: boolean;
	volume: number;
}>();

const emit = defineEmits<{
	vote: [video: VideoItem];
	"video-ready": [];
	"video-ended": [];
	"toggle-playback": [];
	"toggle-muted": [];
	"enter-fullscreen": [];
	"update:volume": [value: number];
}>();

const videoElement = defineModel<HTMLVideoElement | null>("videoElement", {
	default: null,
});
</script>

<template>
	<section class="flex min-h-[70vh] min-w-0 flex-col bg-[#101114] lg:h-full lg:min-h-0">
		<VotePanel
			compact
			class="hidden shrink-0 border-b border-white/10 bg-white lg:flex"
			:videos="snapshot?.videos ?? []"
			:vote-counts="snapshot?.voteCounts ?? []"
			@vote="emit('vote', $event)"
		/>

		<VideoStage
			v-model:video-element="videoElement"
			:current-video="currentVideo"
			:is-muted="isMuted"
			:is-playing="isPlaying"
			:volume="volume"
			@enter-fullscreen="emit('enter-fullscreen')"
			@toggle-muted="emit('toggle-muted')"
			@toggle-playback="emit('toggle-playback')"
			@update:volume="emit('update:volume', $event)"
			@video-ended="emit('video-ended')"
			@video-ready="emit('video-ready')"
		/>

	</section>
</template>
