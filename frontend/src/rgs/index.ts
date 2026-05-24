import type { RGSAdapter } from './types';
import { LocalAdapter } from './local-adapter';

export type { RGSAdapter, RGSBalance, RGSPlayResult, RGSRoundState } from './types';

export function createRGSAdapter(): RGSAdapter {
	const params = new URLSearchParams(window.location.search);
	const rgsUrl = params.get('rgs_url') || '';
	return new LocalAdapter(rgsUrl);
}
