<script lang="ts">
	interface Props {
		selected: string | null;
		onSelect: (fighter: string) => void;
	}

	let { selected, onSelect }: Props = $props();

	const fighters = [
		{ id: 'blaze', name: 'Blaze', sprite: './sprites/blaze_idle_v2.png', color: '#ff4400', hp: 76, dmg: 60, speed: 60, volatility: 'Medium' },
		{ id: 'quake', name: 'Quake', sprite: './sprites/quake_idle.png', color: '#8B4513', hp: 100, dmg: 30, speed: 30, volatility: 'Low' },
		{ id: 'spark', name: 'Spark', sprite: './sprites/spark_idle.png', color: '#FFD700', hp: 35, dmg: 90, speed: 90, volatility: 'High' },
		{ id: 'phantom', name: 'Phantom', sprite: './sprites/phantom_idle.png', color: '#9B59B6', hp: 70, dmg: 55, speed: 60, volatility: 'Medium' }
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
			<span class="sprite" style:background-image="url({f.sprite})"></span>
			<span class="name">{f.name}</span>
			<div class="stats">
				<div class="stat-row"><span class="label">HP</span><div class="bar"><div class="fill" style:width="{f.hp}%" style:background={f.color}></div></div></div>
				<div class="stat-row"><span class="label">DMG</span><div class="bar"><div class="fill" style:width="{f.dmg}%" style:background={f.color}></div></div></div>
				<div class="stat-row"><span class="label">SPD</span><div class="bar"><div class="fill" style:width="{f.speed}%" style:background={f.color}></div></div></div>
			</div>
			<span class="volatility" class:vol-high={f.volatility === 'High'} class:vol-low={f.volatility === 'Low'}>{f.volatility} Risk</span>
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
	.sprite {
		width: 48px;
		height: 48px;
		background-size: 800% 100%;
		animation: sprite-anim 0.8s steps(7) infinite;
	}
	@keyframes sprite-anim {
		from { background-position: 0% 0; }
		to { background-position: 100% 0; }
	}
	.name { font-size: 0.8rem; font-weight: 600; }
	.stats { width: 100%; display: flex; flex-direction: column; gap: 3px; margin-top: 4px; }
	.stat-row { display: flex; align-items: center; gap: 4px; }
	.label { font-size: 0.55rem; width: 24px; text-align: right; opacity: 0.7; }
	.bar { flex: 1; height: 4px; background: #333; border-radius: 2px; overflow: hidden; }
	.fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
	.volatility { font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; background: #333; margin-top: 4px; }
	.vol-high { background: #ff4444; color: #fff; }
	.vol-low { background: #44aa44; color: #fff; }

	@media (max-height: 500px) {
		.fighter-card { padding: 0.4rem 0.6rem; }
		.sprite { width: 32px; height: 32px; }
		.name { font-size: 0.7rem; }
	}
</style>
