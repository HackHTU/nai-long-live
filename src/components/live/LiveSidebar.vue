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
	<aside class="relative flex min-h-[40vh] flex-col border-l border-black/10 bg-white lg:h-full">
		<div class="flex items-center justify-between border-b border-border px-4 py-3">
			<div>
				<p class="text-xs text-muted-foreground">同步直播间</p>
				<h2 class="text-lg font-semibold">评论</h2>
			</div>
			<Avatar :alt="profile.name" :src="profile.avatar" />
		</div>

		<div class="flex flex-col border-b border-border lg:hidden">
			<VotePanel
				compact
				:videos="snapshot?.videos ?? []"
				:vote-counts="snapshot?.voteCounts ?? []"
				@vote="emit('vote', $event)"
			/>
		</div>

		<CommentPanel
			class="flex min-h-0 flex-1"
			:comment-body="commentBody"
			:comments="snapshot?.comments ?? []"
			:display-name="displayName"
			@save-profile="emit('save-profile')"
			@submit-comment="emit('submit-comment')"
			@update:comment-body="emit('update:commentBody', $event)"
			@update:display-name="emit('update:displayName', $event)"
		/>

		<p v-if="errorMessage" class="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
			{{ errorMessage }}
		</p>
	</aside>
</template>
