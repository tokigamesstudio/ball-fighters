<script lang="ts">
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(body) {
		margin: 0;
		background: #0f0f1a;
		color: #fff;
		font-family: system-ui, -apple-system, sans-serif;
		overflow: hidden;
	}
	:global(*) { box-sizing: border-box; }
</style>
