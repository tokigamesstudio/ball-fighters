import type { RGSAdapter, RGSAuthResult, RGSBalance, RGSPlayResult } from './types';

export class StakeEngineAdapter implements RGSAdapter {
	private client: any = null;
	private balance: RGSBalance | null = null;
	private DisplayAmount: any = null;
	private url: string;

	constructor(url: string) {
		this.url = url;
	}

	async authenticate(): Promise<RGSAuthResult> {
		// @ts-ignore
		const { RGSClient, DisplayAmount } = await import('./stake-engine.bundle.js');
		this.DisplayAmount = DisplayAmount;

		this.client = RGSClient({ url: this.url, enforceBetLevels: true });
		const { balance, config, jurisdictionFlags, round } = await this.client.Authenticate();
		this.balance = { amount: balance.amount, currency: balance.currency };

		return {
			balance: this.balance,
			config: {
				minBet: config.minBet,
				maxBet: config.maxBet,
				defaultBet: config.betLevels[config.defaultBetLevel] || config.minBet,
				stepBet: config.stepBet,
				betLevels: config.betLevels
			},
			jurisdictionFlags: {
				disabledAutoplay: jurisdictionFlags.disabledAutoplay,
				disabledSpacebar: jurisdictionFlags.disabledSpacebar,
				minimumRoundDuration: jurisdictionFlags.minimumRoundDuration
			},
			activeRound: round?.active ? round.state : null
		};
	}

	async play(amount: number, fighterChoice: string): Promise<RGSPlayResult> {
		const { balance, round } = await this.client.Play({ amount, mode: fighterChoice });
		this.balance = { amount: balance.amount, currency: balance.currency };

		const rawState = round.state || {};
		const gameState = Array.isArray(rawState) ? rawState[0] : (rawState.events?.[0] || rawState);

		return {
			balance: this.balance,
			round: {
				seed: gameState.seed,
				fighterA: gameState.fighterA,
				fighterB: gameState.fighterB,
				winner: gameState.winner,
				playerBet: fighterChoice,
				tier: gameState.tier,
				narrative: gameState.narrative,
				payout: round.payout / 1_000_000,
				payoutMultiplier: round.payoutMultiplier
			},
			active: round.active
		};
	}

	async endRound() {
		const { balance } = await this.client.EndRound();
		this.balance = { amount: balance.amount, currency: balance.currency };
		return { balance: this.balance };
	}

	getBalance(): RGSBalance | null {
		return this.balance;
	}

	formatAmount(amount: number): string {
		if (!this.DisplayAmount || !this.balance) return `$${(amount / 1_000_000).toFixed(2)}`;
		return this.DisplayAmount({ amount, currency: this.balance.currency });
	}

	parseAmount(displayValue: number): number {
		return displayValue * 1_000_000;
	}
}
