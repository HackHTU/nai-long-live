<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
	defineProps<{
		variant?: "default" | "secondary" | "ghost" | "outline" | "destructive";
		size?: "default" | "sm" | "icon";
		class?: string;
	}>(),
	{
		variant: "default",
		size: "default",
		class: "",
	},
);

const classes = computed(() =>
	cn(
		"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		props.variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
		props.variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
		props.variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
		props.variant === "outline" && "border border-input bg-background hover:bg-accent",
		props.variant === "destructive" && "bg-destructive text-white hover:bg-destructive/90",
		props.size === "default" && "h-10 px-4 py-2",
		props.size === "sm" && "h-9 px-3",
		props.size === "icon" && "size-10",
		props.class,
	),
);
</script>

<template>
	<button :class="classes">
		<slot />
	</button>
</template>
