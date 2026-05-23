/**
 * RGS Factory
 * 
 * Detects which RGS adapter to use based on URL parameters.
 * - If `sessionID` and `rgs_url` are present → Stake Engine
 * - Otherwise → Local dev server
 */
import { StakeEngineAdapter } from './stake-engine-adapter.js';
import { LocalRGSAdapter } from './local-adapter.js';

export function createRGSAdapter(url = window.location.href) {
  const params = new URL(url).searchParams;

  if (params.has('sessionID') && params.has('rgs_url')) {
    return new StakeEngineAdapter({ url });
  }

  // Local dev mode
  const serverUrl = params.get('server') || 'http://localhost:3001';
  return new LocalRGSAdapter({ serverUrl });
}
