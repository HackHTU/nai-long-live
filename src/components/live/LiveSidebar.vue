<script setup lang="ts">
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/shared/schemas";
import type { LiveSnapshot } from "@/shared/types";
import type { VideoItem } from "@/shared/videos";
import CommentPanel from "./CommentPanel.vue";
import VotePanel from "./VotePanel.vue";

defineProps<{
	snapshot: LiveSnapshot | null;
	profile: Profile;
	displayName: string;
	commentBody: string;
	nextVideo: VideoItem | null;
	errorMessage: string;
}>();

const emit = defineEmits<{
	"update:displayName": [value: string];
	"update:commentBody": [value: string];
	"save-profile": [];
	"submit-comment": [];
	vote: [video: VideoItem];
}>();
</script>

<template>
	<aside class="relative flex min-h-[40vh] flex-col border-l border-black/10 bg-white lg:h-screen">
		<div class="flex items-center justify-between border-b border-border px-4 py-3">
			<div>
				<p class="text-xs text-muted-foreground">同步直播间</p>
				<h2 class="text-lg font-semibold">评论与投票</h2>
			</div>
			<Avatar :alt="profile.name" :src="profile.avatar" />
		</div>

		<div class="flex flex-col border-b border-border lg:hidden">
			<VotePanel
				compact
				:next-video="nextVideo"
				:videos="snapshot?.videos ?? []"
				:vote-counts="snapshot?.voteCounts ?? []"
				:vote-queue="snapshot?.voteQueue ?? []"
				@vote="emit('vote', $event)"
			/>
		</div>

		<div class="grid min-h-0 flex-1 grid-rows-1 lg:grid-rows-[1fr_1fr]">
			<CommentPanel
				class="flex min-h-0"
				:comment-body="commentBody"
				:comments="snapshot?.comments ?? []"
				:display-name="displayName"
				@save-profile="emit('save-profile')"
				@submit-comment="emit('submit-comment')"
				@update:comment-body="emit('update:commentBody', $event)"
				@update:display-name="emit('update:displayName', $event)"
			/>

			<VotePanel
				class="hidden min-h-0 lg:flex"
				:next-video="nextVideo"
				:videos="snapshot?.videos ?? []"
				:vote-counts="snapshot?.voteCounts ?? []"
				:vote-queue="snapshot?.voteQueue ?? []"
				@vote="emit('vote', $event)"
			/>
		</div>

		<p v-if="errorMessage" class="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
			{{ errorMessage }}
		</p>
	</aside>
</template>
