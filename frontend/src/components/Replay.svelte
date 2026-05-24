<script lang="ts">
	import { onMount } from 'svelte';
	import Arena from '$components/Arena.svelte';
	// @ts-ignore
	import { BattleSimulation } from '$core/simulation.js';

	let status: 'loading' | 'ready' | 'playing' | 'done' = $state('loading');
	let frames: any[] = $state([]);
	let error: string | null = $state(null);
	let replayData: any = $state(null);

	// Parse URL params
	const params = new URLSearchParams(window.location.search);
	const rgsUrl = params.get('rgs_url') || '';
	const game = params.get('game') || '';
	const version = params.get('version') || '1';
	const mode = params.get('mode') || 'BASE';
	const event = params.get('event') || '';
	const currency = params.get('currency') || 'USD';
	const amount = params.get('amount');
	const social = params.get('social') === 'true';

	const betDisplay = amount ? `${(parseInt(amount) / 1_000_000).toFixed(2)}` : null;

	onMount(async () => {
		try {
			const res = await fetch(`${rgsUrl}/bet/replay/${game}/${version}/${mode}/${event}`);
			if (!res.ok) throw new Error(`Failed to load replay (${res.status})`);
			replayData = await res.json();

			// Run simulation from state
			const state = replayData.state;
			const sim = new BattleSimulation(state.seed, [state.fighterA, state.fighterB]);
			const result = sim.runAll();
			frames = result.frames;
			status = 'ready';
		} catch (e: any) {
			error = e.message;
		}
	});

	function startReplay() {
		status = 'playing';
	}

	function handleComplete() {
		status = 'done';
	}
</script>

<div class="replay-container">
	{#if error}
		<div class="center"><p class="error">⚠️ {error}</p></div>
	{:else if status === 'loading'}
		<div class="center"><p>Loading replay...</p></div>
	{:else}
		{#if betDisplay}
			<div class="replay-info">
				<span>{social ? 'Play' : 'Bet'}: {betDisplay} {currency}</span>
				{#if replayData?.payoutMultiplier > 0}
					<span>{social ? 'Win' : 'Payout'}: {replayData.payoutMultiplier}x</span>
				{/if}
			</div>
		{/if}

		<Arena {frames} playing={status === 'playing'} onComplete={handleComplete} />

		{#if status === 'ready'}
			<button class="btn-play" onclick={startReplay}>▶ Play</button>
		{/if}

		{#if status === 'done'}
			<div class="result">
				{#if replayData?.payoutMultiplier > 0}
					<p class="win">{social ? 'Won' : 'Won'} {replayData.payoutMultiplier}x</p>
				{:else}
					<p class="loss">No win</p>
				{/if}
				<button class="btn-play" onclick={() => { status = 'playing'; }}>↻ Replay</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.replay-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		color: #fff;
		font-family: system-ui, sans-serif;
		min-height: 100dvh;
		background: #0f0f1a;
	}
	.center { display: flex; align-items: center; justify-content: center; flex: 1; }
	.error { color: #f44; }
	.replay-info {
		display: flex;
		justify-content: space-between;
		background: #111;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.85rem;
	}
	.btn-play {
		width: 100%;
		padding: 0.75rem;
		font-size: 1rem;
		font-weight: 700;
		border: none;
		border-radius: 8px;
		background: #4f46e5;
		color: #fff;
		cursor: pointer;
	}
	.btn-play:hover { background: #4338ca; }
	.result { text-align: center; }
	.win { font-size: 1.2rem; font-weight: 700; color: #4ade80; }
	.loss { font-size: 1rem; color: #888; }
</style>
