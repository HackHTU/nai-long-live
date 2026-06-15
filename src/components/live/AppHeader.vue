<script setup lang="ts">
defineProps<{
	onlineCount: number;
}>();
</script>

<template>
	<header class="border-b border-border bg-white/95 px-4 py-3 backdrop-blur">
		<div class="flex w-full items-center justify-between gap-4">
			<div>
				<p class="text-xs text-muted-foreground">Nai Long Live</p>
				<h1 class="text-lg font-semibold">奶龙同步直播间</h1>
			</div>
			<p class="text-sm text-muted-foreground">当前在线人数 {{ onlineCount }}</p>
		</div>
	</header>
</template>
