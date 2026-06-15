<script setup lang="ts">
import type { VideoItem } from "@/shared/videos";
import PlaybackControls from "./PlaybackControls.vue";

defineProps<{
	currentVideo: VideoItem | null;
	isPlaying: boolean;
	isMuted: boolean;
	volume: number;
}>();

const emit = defineEmits<{
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
	<section class="flex min-h-[70vh] flex-1 bg-[#101114] p-3 lg:min-h-0 lg:p-6">
		<div class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-[#17181c] shadow-2xl">
			<div class="relative min-h-0 flex-1 overflow-hidden bg-black">
				<video
					v-if="currentVideo"
					ref="videoElement"
					class="h-full w-full object-contain"
					:key="currentVideo.id"
					:src="currentVideo.url"
					:muted="isMuted"
					playsinline
					autoplay
					preload="auto"
					webkit-playsinline
					@loadedmetadata="emit('video-ready')"
					@ended="emit('video-ended')"
				/>
				<div v-else class="flex h-full flex-col items-center justify-center p-8 text-center text-white">
					<p class="text-sm text-white/60">等待投票</p>
					<h1 class="mt-2 text-2xl font-semibold">选择下一段内容</h1>
					<p class="mt-3 text-sm text-white/70">当前队列为空，投票后直播会立即开始。</p>
				</div>
			</div>

			<PlaybackControls
				:is-muted="isMuted"
				:is-playing="isPlaying"
				:volume="volume"
				@enter-fullscreen="emit('enter-fullscreen')"
				@toggle-muted="emit('toggle-muted')"
				@toggle-playback="emit('toggle-playback')"
				@update:volume="emit('update:volume', $event)"
			/>
		</div>
	</section>
</template>
