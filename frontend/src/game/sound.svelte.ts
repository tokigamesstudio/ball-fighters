/** Procedural sound system using Web Audio API — no external files needed */

let ctx: AudioContext | null = null;
let muted = $state(false);

function getCtx(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === 'suspended') ctx.resume();
	return ctx;
}

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }
export function setMuted(v: boolean) { muted = v; }

function play(fn: (ctx: AudioContext) => void) {
	if (muted) return;
	try { fn(getCtx()); } catch { /* ignore audio errors */ }
}

export function playHit() {
	play((c) => {
		const osc = c.createOscillator();
		const gain = c.createGain();
		osc.type = 'square';
		osc.frequency.setValueAtTime(200, c.currentTime);
		osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.1);
		gain.gain.setValueAtTime(0.3, c.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.1);
		osc.connect(gain).connect(c.destination);
		osc.start();
		osc.stop(c.currentTime + 0.1);
	});
}

export function playBigHit() {
	play((c) => {
		const osc = c.createOscillator();
		const gain = c.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(150, c.currentTime);
		osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.2);
		gain.gain.setValueAtTime(0.4, c.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2);
		osc.connect(gain).connect(c.destination);
		osc.start();
		osc.stop(c.currentTime + 0.2);
	});
}

export function playWin() {
	play((c) => {
		const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
		notes.forEach((freq, i) => {
			const osc = c.createOscillator();
			const gain = c.createGain();
			osc.type = 'sine';
			osc.frequency.value = freq;
			const t = c.currentTime + i * 0.12;
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
			osc.connect(gain).connect(c.destination);
			osc.start(t);
			osc.stop(t + 0.3);
		});
	});
}

export function playLose() {
	play((c) => {
		const osc = c.createOscillator();
		const gain = c.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(300, c.currentTime);
		osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.4);
		gain.gain.setValueAtTime(0.25, c.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
		osc.connect(gain).connect(c.destination);
		osc.start();
		osc.stop(c.currentTime + 0.4);
	});
}

export function playBet() {
	play((c) => {
		const osc = c.createOscillator();
		const gain = c.createGain();
		osc.type = 'sine';
		osc.frequency.value = 880;
		gain.gain.setValueAtTime(0.15, c.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.08);
		osc.connect(gain).connect(c.destination);
		osc.start();
		osc.stop(c.currentTime + 0.08);
	});
}
