<script lang="ts">
	interface Props {
		balance: string;
		stake: string;
		social?: boolean;
	}

	let { balance, stake, social = false }: Props = $props();
</script>

<div class="balance-bar">
	<span class="balance">{balance}</span>
	<span class="stake">{social ? 'Play' : 'Bet'}: {stake}</span>
</div>

<style>
	.balance-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		background: #111;
		border-radius: 6px;
		font-size: 0.85rem;
		color: #eee;
	}
	.balance { font-weight: 700; }
	.stake { color: #aaa; }
</style>
