<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import type { VoteCount } from "@/shared/types";
import type { VideoItem } from "@/shared/videos";

const props = defineProps<{
	videos: VideoItem[];
	voteCounts: VoteCount[];
	compact?: boolean;
}>();

const emit = defineEmits<{
	vote: [video: VideoItem];
}>();

function isFull(videoId: string) {
	return props.voteCounts.find((item) => item.videoId === videoId)?.isFull ?? false;
}

function voteCount(videoId: string) {
	return props.voteCounts.find((item) => item.videoId === videoId)?.count ?? 0;
}
</script>

<template>
	<section class="min-h-0 flex-col">
		<div class="border-b border-border px-4 py-3" :class="compact && 'pb-2'">
			<p class="text-sm font-medium">投票展示</p>
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto p-3" :class="compact && 'space-y-3 overflow-y-visible'">
			<div
				class="flex gap-2"
				:class="compact ? 'overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'flex-wrap'"
			>
				<button
					v-for="video in videos"
					:key="video.id"
					class="max-w-full shrink-0 disabled:cursor-not-allowed disabled:opacity-45"
					:disabled="isFull(video.id)"
					type="button"
					@click="emit('vote', video)"
				>
					<Badge class="group relative min-h-9 cursor-pointer gap-2 px-4 text-sm" variant="outline">
						<span class="truncate">{{ video.name }}</span>
						<span class="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] leading-none text-secondary-foreground">
							{{ voteCount(video.id) }}
						</span>
						<span
							class="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-20 hidden w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-left text-xs leading-relaxed text-popover-foreground shadow-md group-hover:block"
						>
							{{ video.description }}
						</span>
					</Badge>
				</button>
			</div>
		</div>
	</section>
</template>
