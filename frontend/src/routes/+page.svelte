<script lang="ts">
	import { onMount } from 'svelte';
	import { createGameActor } from '$game/machine';
	import { playBet, playWin, playLose, playHit, playBigHit, isMuted, toggleMute } from '$game/sound.svelte';
	import { createRGSAdapter, type RGSAdapter } from '$rgs';
	import Arena from '$components/Arena.svelte';
	import FighterSelect from '$components/FighterSelect.svelte';
	import HpBars from '$components/HpBars.svelte';
	import WinnerOverlay from '$components/WinnerOverlay.svelte';
	import BalanceBar from '$components/BalanceBar.svelte';
	import InfoPanel from '$components/InfoPanel.svelte';
	import Replay from '$components/Replay.svelte';
	// @ts-ignore — JS module from parent project
	import { BattleSimulation } from '$core/simulation.js';

	// Detect replay mode
	const urlParams = new URLSearchParams(window.location.search);
	const isReplayMode = urlParams.get('replay') === 'true';
	const isSocial = urlParams.get('social') === 'true';

	let rgs: RGSAdapter = $state(null as any);
	const actor = createGameActor();

	// Reactive state from actor
	let state = $state(actor.getSnapshot());
	let balance = $state('$0.00');
	let frames: any[] = $state([]);
	let currentFighters: any[] = $state([]);
	let simResult: any = $state(null);

	actor.subscribe((s) => { state = s; });
	actor.start();

	let betLevels: number[] = $state([1_000_000, 2_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000]);

	onMount(async () => {
		rgs = createRGSAdapter();
		try {
			const auth = await rgs.authenticate();
			balance = rgs.formatAmount(auth.balance.amount);
			betLevels = auth.config.betLevels;
			actor.send({ type: 'SET_STAKE', amount: auth.config.defaultBet });
		} catch {
			// Will show $0.00
		}
	});

	// Spacebar bound to bet button
	function handleKeydown(e: KeyboardEvent) {
		if (e.code === 'Space') {
			e.preventDefault();
			if (isIdle && state.context.selectedFighter) handlePlay();
		}
	}

	async function handlePlay() {
		playBet();
		actor.send({ type: 'PLAY' });
		const snap = actor.getSnapshot();
		if (snap.value !== 'betting') return;

		try {
			const result = await rgs.play(snap.context.stake, snap.context.selectedFighter!);
			actor.send({ type: 'PLAY_SUCCESS', round: result.round });

			// Run simulation client-side for playback
			const sim = new BattleSimulation(result.round.seed, [result.round.fighterA, result.round.fighterB]);
			const simData = sim.runAll();
			simResult = simData;
			frames = simData.frames;
		} catch (e: any) {
			actor.send({ type: 'PLAY_ERROR', error: e.message });
		}
	}

	function handlePlaybackComplete() {
		actor.send({ type: 'PLAYBACK_COMPLETE' });
		const bal = rgs.getBalance();
		if (bal) balance = rgs.formatAmount(bal.amount);
		// Play win/lose sound
		const round = actor.getSnapshot().context.round;
		if (round && round.winner === round.playerBet) playWin();
		else playLose();
	}

	function handlePlayAgain() {
		frames = [];
		simResult = null;
		handlePlay();
	}

	function handleReset() {
		frames = [];
		simResult = null;
		actor.send({ type: 'RESET' });
	}

	let currentFrameIndex = $state(0);
	let infoOpen = $state(false);

	// Derive current frame fighters for HP bars
	$effect(() => {
		if (frames.length > 0 && state.value === 'playing') {
			// Updated by Arena tick — we'll poll last rendered frame
		}
	});

	const isIdle = $derived(state.value === 'idle');
	const isPlaying = $derived(state.value === 'playing');
	const isResult = $derived(state.value === 'result');
	const isBetting = $derived(state.value === 'betting');
	const stakeDisplay = $derived(`$${(state.context.stake / 1_000_000).toFixed(2)}`);

	const winnerFighter = $derived.by(() => {
		if (!simResult?.winner) return null;
		const w = simResult.winner;
		return { name: w.name, emoji: w.emoji, color: w.color, hp: w.hp, maxHp: w.maxHp };
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isReplayMode}
	<Replay />
{:else}
<InfoPanel open={infoOpen} onClose={() => infoOpen = false} social={isSocial} />

<div class="game-container">
	<div class="top-bar">
		<BalanceBar {balance} stake={stakeDisplay} social={isSocial} />
		<button class="info-btn" onclick={() => infoOpen = true}>ℹ️</button>
		<button class="info-btn" onclick={() => toggleMute()}>{isMuted() ? '🔇' : '🔊'}</button>
	</div>

	{#if isPlaying && frames.length > 0}
		<HpBars fighters={frames[currentFrameIndex]?.fighters ?? []} />
	{/if}

	<div class="arena-wrapper">
		<Arena {frames} playing={isPlaying} onComplete={handlePlaybackComplete} onFrame={(i) => currentFrameIndex = i} onHit={(amt) => amt > 15 ? playBigHit() : playHit()} />

		{#if isResult && state.context.round && winnerFighter}
			<WinnerOverlay
				round={state.context.round}
				winner={winnerFighter}
				onPlayAgain={handlePlayAgain}
				onReset={handleReset}
				formatAmount={(a) => rgs.formatAmount(a)}
			/>
		{/if}
	</div>

	{#if isIdle}
		<FighterSelect
			selected={state.context.selectedFighter}
			onSelect={(f) => actor.send({ type: 'SELECT_FIGHTER', fighter: f })}
		/>
		<div class="stake-row">
			<button class="stake-btn" onclick={() => { const i = betLevels.indexOf(state.context.stake); if (i > 0) actor.send({ type: 'SET_STAKE', amount: betLevels[i - 1] }); }}>−</button>
			<span class="stake-display">{stakeDisplay}</span>
			<button class="stake-btn" onclick={() => { const i = betLevels.indexOf(state.context.stake); if (i < betLevels.length - 1) actor.send({ type: 'SET_STAKE', amount: betLevels[i + 1] }); }}>+</button>
		</div>
		<button
			class="btn-fight"
			disabled={!state.context.selectedFighter}
			onclick={handlePlay}
		>
			{isSocial ? 'Play!' : 'Fight!'}
		</button>
	{/if}

	{#if isBetting}
		<p class="loading">Starting battle...</p>
	{/if}

	{#if state.context.error}
		<p class="error">{state.context.error}</p>
	{/if}
</div>
{/if}

<style>
	.game-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-family: system-ui, sans-serif;
		color: #fff;
		height: 100dvh;
		background: #0f0f1a;
		overflow: hidden;
	}
	.arena-wrapper { position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
	.top-bar { display: flex; gap: 0.5rem; align-items: stretch; }
	.top-bar :global(:first-child) { flex: 1; }
	.info-btn {
		background: #222;
		border: 1px solid #333;
		border-radius: 6px;
		padding: 0 0.75rem;
		font-size: 1rem;
		cursor: pointer;
	}
	.stake-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}
	.stake-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 1px solid #555;
		background: #222;
		color: #fff;
		font-size: 1.2rem;
		cursor: pointer;
	}
	.stake-btn:hover { background: #333; }
	.stake-display { font-size: 1.1rem; font-weight: 700; min-width: 60px; text-align: center; }
	.btn-fight {
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
	.btn-fight:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-fight:hover:not(:disabled) { background: #4338ca; }
	.loading { text-align: center; color: #888; }
	.error { text-align: center; color: #f44; font-size: 0.85rem; }
</style>
