<script setup lang="ts">
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

defineProps<{
	isPlaying: boolean;
	isMuted: boolean;
	volume: number;
}>();

const emit = defineEmits<{
	"toggle-playback": [];
	"toggle-muted": [];
	"enter-fullscreen": [];
	"update:volume": [value: number];
}>();
</script>

<template>
	<div class="flex w-full items-center gap-2 border-t border-white/10 bg-[#17181c] px-3 py-3 text-white">
		<Button class="rounded-full text-white hover:bg-white/10" size="icon" type="button" variant="ghost" @click="emit('toggle-playback')">
			<Pause v-if="isPlaying" class="size-4" />
			<Play v-else class="size-4" />
		</Button>
		<Button class="rounded-full text-white hover:bg-white/10" size="icon" type="button" variant="ghost" @click="emit('toggle-muted')">
			<VolumeX v-if="isMuted" class="size-4" />
			<Volume2 v-else class="size-4" />
		</Button>
		<input
			class="min-w-0 flex-1 accent-white"
			max="1"
			min="0"
			step="0.05"
			type="range"
			:value="volume"
			@input="emit('update:volume', Number(($event.target as HTMLInputElement).value))"
		/>
		<Button class="rounded-full text-white hover:bg-white/10" size="icon" type="button" variant="ghost" @click="emit('enter-fullscreen')">
			<Maximize2 class="size-4" />
		</Button>
	</div>
</template>
