<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
	defineProps<{
		class?: string;
	}>(),
	{
		class: "",
	},
);

const classes = computed(() =>
	cn(
		"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
		props.class,
	),
);
</script>

<template>
	<input :class="classes" />
</template>
