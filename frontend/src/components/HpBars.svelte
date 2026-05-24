<script lang="ts">
	interface Fighter {
		name: string;
		emoji: string;
		color: string;
		hp: number;
		maxHp: number;
		alive: boolean;
	}

	interface Props {
		fighters: Fighter[];
	}

	let { fighters }: Props = $props();
</script>

<div class="hp-bars">
	{#each fighters as f}
		<div class="hp-card" class:dead={!f.alive}>
			<span class="avatar" style:color={f.color}>{f.emoji}</span>
			<div class="info">
				<div class="name-row">
					<span>{f.name}</span>
					<span class="hp-text">{Math.ceil(f.hp)}</span>
				</div>
				<div class="bar">
					<div
						class="fill"
						style:width="{Math.max(0, f.hp / f.maxHp * 100)}%"
						style:background={f.hp / f.maxHp > 0.6 ? f.color : f.hp / f.maxHp > 0.3 ? '#ff9800' : '#f44336'}
					></div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.hp-bars { display: flex; gap: 1rem; justify-content: center; }
	.hp-card { display: flex; align-items: center; gap: 0.5rem; opacity: 1; transition: opacity 0.3s; }
	.hp-card.dead { opacity: 0.4; }
	.avatar { font-size: 1.25rem; }
	.info { min-width: 100px; }
	.name-row { display: flex; justify-content: space-between; font-size: 0.75rem; color: #ccc; }
	.hp-text { font-weight: 700; }
	.bar { height: 6px; background: #333; border-radius: 3px; overflow: hidden; }
	.fill { height: 100%; transition: width 0.1s; border-radius: 3px; }
</style>
