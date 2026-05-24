<script lang="ts">
	interface Props {
		open: boolean;
		onClose: () => void;
		social?: boolean;
	}

	let { open, onClose, social = false }: Props = $props();

	const bet = social ? 'play' : 'bet';
	const bets = social ? 'plays' : 'bets';
	const win = social ? 'win' : 'win';
	const payout = social ? 'win' : 'payout';
</script>

{#if open}
<div class="modal-backdrop" onclick={onClose}>
	<div class="modal" onclick={(e) => e.stopPropagation()}>
		<button class="close-btn" onclick={onClose}>✕</button>
		<div class="content">
			<h2>Game Rules</h2>

			<h3>How to Play</h3>
			<p>Select a fighter and place your {bet}. Two fighters battle in a physics-driven arena. If your chosen fighter wins, you receive a {payout} based on the victory tier.</p>

			<h3>{social ? 'Play' : 'Payout'} Tiers</h3>
			<table>
				<thead><tr><th>Tier</th><th>Condition</th><th>Multiplier</th></tr></thead>
				<tbody>
				<tr><td>Obliterate</td><td>Winner HP &gt; 60%</td><td>2.38x</td></tr>
				<tr><td>Close Call</td><td>Winner HP 20–60%</td><td>1.03x</td></tr>
				<tr><td>Clutch</td><td>Winner HP &lt; 20%</td><td>0.73x</td></tr>
				</tbody>
			</table>

			<h3>Fighters</h3>
			<table>
				<thead><tr><th>Fighter</th><th>Style</th><th>Ability</th></tr></thead>
				<tbody>
				<tr><td>🔥 Blaze</td><td>Aggressive</td><td>Fire trails, area damage</td></tr>
				<tr><td>🪨 Quake</td><td>Tank</td><td>Ground pounds, high mass</td></tr>
				<tr><td>⚡ Spark</td><td>Ranged</td><td>Bouncing electric projectiles</td></tr>
				<tr><td>👻 Phantom</td><td>Evasive</td><td>Teleportation, phasing</td></tr>
				</tbody>
			</table>

			<h3>RTP &amp; Max {social ? 'Win' : 'Win'}</h3>
			<p><strong>RTP:</strong> 95.0%</p>
			<p><strong>Max {social ? 'Win' : 'Win'}:</strong> 2.38x per {bet}</p>

			<h3>UI Guide</h3>
			<ul>
				<li><strong>Fighter Cards</strong> — Select your fighter</li>
				<li><strong>− / +</strong> — Adjust {bet} size</li>
				<li><strong>Fight!</strong> — Place {bet} and start battle</li>
				<li><strong>Spacebar</strong> — Quick {bet} (same as Fight! button)</li>
				<li><strong>Play Again</strong> — Repeat with same fighter</li>
				<li><strong>Change Fighter</strong> — Return to selection</li>
			</ul>

			<h3>Disclaimer</h3>
			<p class="disclaimer">Malfunction voids all {social ? 'plays' : 'wins'} and {bets}. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many {bets}. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. TM and © 2026 Stake Engine.</p>
		</div>
	</div>
</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.85);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.modal {
		background: #1a1a2e;
		border-radius: 12px;
		padding: 1.5rem;
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		position: relative;
	}
	.close-btn {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background: none;
		border: none;
		color: #aaa;
		font-size: 1.2rem;
		cursor: pointer;
	}
	.content { color: #ddd; font-size: 0.85rem; line-height: 1.5; }
	h2 { margin: 0 0 1rem; font-size: 1.2rem; color: #fff; }
	h3 { margin: 1rem 0 0.5rem; font-size: 0.95rem; color: #fff; }
	p { margin: 0.25rem 0; }
	table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
	th, td { padding: 0.3rem 0.5rem; border: 1px solid #333; text-align: left; font-size: 0.8rem; }
	th { background: #222; color: #fff; }
	ul { padding-left: 1.2rem; margin: 0.25rem 0; }
	li { margin: 0.2rem 0; }
	.disclaimer { font-size: 0.75rem; color: #888; margin-top: 0.5rem; }
</style>
