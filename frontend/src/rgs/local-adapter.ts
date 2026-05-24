import type { RGSAdapter, RGSAuthResult, RGSBalance, RGSPlayResult } from './types';

export class LocalAdapter implements RGSAdapter {
	private serverUrl: string;
	private token: string;
	private balance: RGSBalance | null = null;

	constructor(serverUrl = '') {
		this.serverUrl = serverUrl;
		this.token = this.getOrCreateToken();
	}

	private getOrCreateToken(): string {
		if (typeof localStorage === 'undefined') return 'player_dev';
		let id = localStorage.getItem('arena_player_id');
		if (!id) {
			id = 'player_' + Math.random().toString(36).slice(2);
			localStorage.setItem('arena_player_id', id);
		}
		return id;
	}

	async authenticate(): Promise<RGSAuthResult> {
		const res = await fetch(`${this.serverUrl}/balance?token=${this.token}`);
		const data = await res.json();
		this.balance = { amount: data.balance * 1_000_000, currency: 'USD' };

		return {
			balance: this.balance,
			config: { minBet: 1_000_000, maxBet: 100_000_000, defaultBet: 2_000_000, stepBet: 1_000_000, betLevels: [1_000_000, 2_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000] },
			jurisdictionFlags: { disabledAutoplay: false, disabledSpacebar: false, minimumRoundDuration: 0 },
			activeRound: null
		};
	}

	async play(amount: number, fighterChoice: string): Promise<RGSPlayResult> {
		const stake = amount / 1_000_000;
		const res = await fetch(`${this.serverUrl}/slot/play`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionToken: this.token, fighterChoice, stake })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error);

		// Refresh balance
		const balRes = await fetch(`${this.serverUrl}/balance?token=${this.token}`);
		const balData = await balRes.json();
		this.balance = { amount: balData.balance * 1_000_000, currency: 'USD' };

		return {
			balance: this.balance,
			round: {
				seed: data.seed,
				fighterA: data.fighterA,
				fighterB: data.fighterB,
				winner: data.winner,
				playerBet: fighterChoice,
				tier: data.tier,
				narrative: data.narrative,
				payout: data.payout ?? 0,
				payoutMultiplier: data.payout > 0 ? data.payout / stake : 0
			},
			active: false
		};
	}

	async endRound() {
		return { balance: this.balance! };
	}

	getBalance(): RGSBalance | null {
		return this.balance;
	}

	formatAmount(amount: number): string {
		return `$${(amount / 1_000_000).toFixed(2)}`;
	}

	parseAmount(displayValue: number): number {
		return displayValue * 1_000_000;
	}
}
