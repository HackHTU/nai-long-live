<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import type { VoteCount, VoteQueueItem } from "@/shared/types";
import type { VideoItem } from "@/shared/videos";

const props = defineProps<{
	videos: VideoItem[];
	voteCounts: VoteCount[];
	voteQueue: VoteQueueItem[];
	nextVideo: VideoItem | null;
	compact?: boolean;
}>();

const emit = defineEmits<{
	vote: [video: VideoItem];
}>();

function isFull(videoId: string) {
	return props.voteCounts.find((item) => item.videoId === videoId)?.isFull ?? false;
}
</script>

<template>
	<section class="min-h-0 flex-col">
		<div class="border-b border-border px-4 py-3" :class="compact && 'pb-2'">
			<p class="text-sm font-medium">下一段内容</p>
			<p class="text-xs text-muted-foreground">
				{{ nextVideo ? `队列下一条：${nextVideo.name}` : "队列为空，投票后开始播放。" }}
			</p>
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
					:title="video.description"
					@click="emit('vote', video)"
				>
					<Badge class="min-h-9 cursor-pointer px-4 text-sm" variant="outline">
						<span class="truncate">{{ video.name }}</span>
					</Badge>
				</button>
			</div>

			<div v-if="voteQueue.length" :class="compact ? '' : 'mt-5'">
				<p class="mb-2 text-xs text-muted-foreground">队列</p>
				<div
					class="flex gap-2"
					:class="compact ? 'overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : 'flex-wrap'"
				>
					<Badge v-for="item in voteQueue" :key="item.id" class="max-w-full shrink-0" variant="secondary">
						<span class="truncate">
							{{ videos.find((video) => video.id === item.videoId)?.name ?? item.videoId }}
						</span>
					</Badge>
				</div>
			</div>
		</div>
	</section>
</template>
