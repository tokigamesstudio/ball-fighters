/** Abstract RGS adapter — all platform-specific logic lives behind this interface */

export interface RGSBalance {
	amount: number;
	currency: string;
}

export interface RGSConfig {
	minBet: number;
	maxBet: number;
	defaultBet: number;
	stepBet: number;
	betLevels: number[];
}

export interface JurisdictionFlags {
	disabledAutoplay: boolean;
	disabledSpacebar: boolean;
	minimumRoundDuration: number;
}

export interface RGSAuthResult {
	balance: RGSBalance;
	config: RGSConfig;
	jurisdictionFlags: JurisdictionFlags;
	activeRound: RGSRoundState | null;
}

export interface RGSRoundState {
	seed: string;
	fighterA: string;
	fighterB: string;
	winner: string | null;
	playerBet: string;
	tier: string | null;
	narrative: string | null;
	payout: number;
	payoutMultiplier: number;
}

export interface RGSPlayResult {
	balance: RGSBalance;
	round: RGSRoundState;
	active: boolean;
}

export interface RGSAdapter {
	authenticate(): Promise<RGSAuthResult>;
	play(amount: number, fighterChoice: string): Promise<RGSPlayResult>;
	endRound(): Promise<{ balance: RGSBalance }>;
	getBalance(): RGSBalance | null;
	formatAmount(amount: number): string;
	parseAmount(displayValue: number): number;
}
