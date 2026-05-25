import type { RGSAdapter } from './types';
import { LocalAdapter } from './local-adapter';
import { StakeEngineAdapter } from './stake-engine-adapter';

export type { RGSAdapter, RGSBalance, RGSPlayResult, RGSRoundState } from './types';

export function createRGSAdapter(): RGSAdapter {
	const params = new URLSearchParams(window.location.search);
	let rgsUrl = params.get('rgs_url') || '';

	if (rgsUrl) {
		// Deployed on Stake Engine — use their SDK
		if (!rgsUrl.startsWith('http')) rgsUrl = `https://${rgsUrl}`;
		return new StakeEngineAdapter(window.location.href);
	}

	// Local dev — use our Express server
	return new LocalAdapter('');
}
