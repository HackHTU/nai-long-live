<script setup lang="ts">
import { cn } from "@/lib/utils";

withDefaults(
	defineProps<{
		src: string;
		alt: string;
		class?: string;
	}>(),
	{
		class: "",
	},
);
</script>

<template>
	<img :class="cn('size-10 rounded-full border object-cover', $props.class)" :alt="alt" :src="src" />
</template>
