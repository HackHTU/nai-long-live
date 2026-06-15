<script setup lang="ts">
import { Send } from "lucide-vue-next";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_COMMENT_LENGTH, MAX_DISPLAY_NAME_LENGTH } from "@/shared/config";
import type { LiveComment } from "@/shared/types";

defineProps<{
	comments: LiveComment[];
	displayName: string;
	commentBody: string;
}>();

const emit = defineEmits<{
	"update:displayName": [value: string];
	"update:commentBody": [value: string];
	"save-profile": [];
	"submit-comment": [];
}>();
</script>

<template>
	<section class="min-h-0 flex-col border-b border-border">
		<div class="flex items-center gap-2 border-b border-border px-4 py-3">
			<Input
				class="h-9"
				:maxlength="MAX_DISPLAY_NAME_LENGTH"
				:model-value="displayName"
				:value="displayName"
				@change="emit('save-profile')"
				@input="emit('update:displayName', ($event.target as HTMLInputElement).value)"
			/>
		</div>
		<div class="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
			<div v-for="comment in comments" :key="comment.id" class="flex gap-3">
				<Avatar class="size-8" :alt="comment.authorName" :src="comment.authorAvatar" />
				<div class="min-w-0">
					<p class="text-xs font-medium">{{ comment.authorName }}</p>
					<p class="break-words text-sm text-muted-foreground">{{ comment.body }}</p>
				</div>
			</div>
		</div>
		<form class="flex gap-2 border-t border-border p-3" @submit.prevent="emit('submit-comment')">
			<Input
				class="min-w-0 flex-1"
				:maxlength="MAX_COMMENT_LENGTH"
				placeholder="发送评论"
				:value="commentBody"
				@input="emit('update:commentBody', ($event.target as HTMLInputElement).value)"
			/>
			<Button size="icon" type="submit">
				<Send class="size-4" />
			</Button>
		</form>
	</section>
</template>
