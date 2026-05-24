import { setup, createActor, assign } from 'xstate';
import type { RGSRoundState } from '$rgs';

export interface GameContext {
	selectedFighter: string | null;
	stake: number;
	round: RGSRoundState | null;
	error: string | null;
}

export type GameEvent =
	| { type: 'SELECT_FIGHTER'; fighter: string }
	| { type: 'SET_STAKE'; amount: number }
	| { type: 'PLAY' }
	| { type: 'PLAY_SUCCESS'; round: RGSRoundState }
	| { type: 'PLAY_ERROR'; error: string }
	| { type: 'PLAYBACK_COMPLETE' }
	| { type: 'RESET' };

export const gameMachine = setup({
	types: {
		context: {} as GameContext,
		events: {} as GameEvent
	}
}).createMachine({
	id: 'game',
	initial: 'idle',
	context: {
		selectedFighter: null,
		stake: 2_000_000,
		round: null,
		error: null
	},
	states: {
		idle: {
			on: {
				SELECT_FIGHTER: { actions: assign({ selectedFighter: ({ event }) => event.fighter }) },
				SET_STAKE: { actions: assign({ stake: ({ event }) => event.amount }) },
				PLAY: { target: 'betting', guard: ({ context }) => context.selectedFighter !== null }
			}
		},
		betting: {
			on: {
				PLAY_SUCCESS: { target: 'playing', actions: assign({ round: ({ event }) => event.round, error: null }) },
				PLAY_ERROR: { target: 'idle', actions: assign({ error: ({ event }) => event.error }) }
			}
		},
		playing: {
			on: {
				PLAYBACK_COMPLETE: { target: 'result' }
			}
		},
		result: {
			on: {
				RESET: { target: 'idle', actions: assign({ round: null, selectedFighter: null, error: null }) },
				PLAY: { target: 'betting', guard: ({ context }) => context.selectedFighter !== null }
			}
		}
	}
});

export function createGameActor() {
	return createActor(gameMachine);
}
