<script lang="ts">
	import type { RGSRoundState } from '$rgs';

	interface Props {
		round: RGSRoundState;
		winner: { name: string; emoji: string; color: string; hp: number; maxHp: number } | null;
		onPlayAgain: () => void;
		onReset: () => void;
		formatAmount: (amount: number) => string;
	}

	let { round, winner, onPlayAgain, onReset, formatAmount }: Props = $props();

	const playerWon = $derived(round.winner === round.playerBet);
	const winAmount = $derived(round.payout * 1_000_000);
</script>

{#if winner}
	<div class="overlay">
		<div class="content">
			<h2 style:color={winner.color}>
				{#if playerWon && round.tier}
					{winner.emoji} {round.tier}!
				{:else if playerWon}
					{winner.emoji} {winner.name} Wins!
				{:else}
					Defeated
				{/if}
			</h2>

			<p class="stats">
				{#if playerWon}
					{round.narrative ?? ''} • Won {formatAmount(winAmount)}
				{:else}
					Better luck next time
				{/if}
			</p>

			<div class="actions">
				<button class="btn primary" onclick={onPlayAgain}>Play Again</button>
				<button class="btn" onclick={onReset}>Change Fighter</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.8);
		z-index: 10;
		animation: fadeIn 0.3s;
	}
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
	.content { text-align: center; }
	h2 { font-size: 1.5rem; margin: 0 0 0.5rem; }
	.stats { color: #aaa; font-size: 0.9rem; margin: 0 0 1rem; }
	.actions { display: flex; gap: 0.5rem; justify-content: center; }
	.btn {
		padding: 0.5rem 1rem;
		border: 1px solid #555;
		border-radius: 6px;
		background: #222;
		color: #fff;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.btn.primary { background: #4f46e5; border-color: #4f46e5; }
	.btn:hover { opacity: 0.85; }
</style>
