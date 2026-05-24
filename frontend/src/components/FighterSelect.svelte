<script lang="ts">
	interface Props {
		selected: string | null;
		onSelect: (fighter: string) => void;
	}

	let { selected, onSelect }: Props = $props();

	const fighters = [
		{ id: 'blaze', name: 'Blaze', emoji: '🔥', color: '#ff4400' },
		{ id: 'quake', name: 'Quake', emoji: '🪨', color: '#8B4513' },
		{ id: 'spark', name: 'Spark', emoji: '⚡', color: '#FFD700' },
		{ id: 'phantom', name: 'Phantom', emoji: '👻', color: '#9B59B6' }
	];
</script>

<div class="fighter-select">
	{#each fighters as f}
		<button
			class="fighter-card"
			class:selected={selected === f.id}
			style:--color={f.color}
			onclick={() => onSelect(f.id)}
		>
			<span class="emoji">{f.emoji}</span>
			<span class="name">{f.name}</span>
		</button>
	{/each}
</div>

<style>
	.fighter-select {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	.fighter-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
		border: 2px solid #333;
		border-radius: 8px;
		background: #1a1a2e;
		color: #fff;
		cursor: pointer;
		transition: all 0.2s;
	}
	.fighter-card:hover {
		border-color: var(--color);
	}
	.fighter-card.selected {
		border-color: var(--color);
		box-shadow: 0 0 16px color-mix(in srgb, var(--color) 40%, transparent);
	}
	.emoji { font-size: 1.5rem; }
	.name { font-size: 0.8rem; font-weight: 600; }

	@media (max-height: 500px) {
		.fighter-card { padding: 0.4rem 0.6rem; }
		.emoji { font-size: 1rem; }
		.name { font-size: 0.7rem; }
	}
</style>
