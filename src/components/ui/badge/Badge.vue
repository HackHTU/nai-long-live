<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
	defineProps<{
		variant?: "default" | "secondary" | "outline";
		class?: string;
	}>(),
	{
		variant: "default",
		class: "",
	},
);

const classes = computed(() =>
	cn(
		"inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-medium transition",
		props.variant === "default" && "bg-primary text-primary-foreground",
		props.variant === "secondary" && "bg-secondary text-secondary-foreground",
		props.variant === "outline" &&
			"border border-input bg-background text-foreground hover:bg-accent",
		props.class,
	),
);
</script>

<template>
	<span :class="classes">
		<slot />
	</span>
</template>
