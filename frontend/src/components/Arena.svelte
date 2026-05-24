<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Application, Graphics, Sprite, Texture, Rectangle, AnimatedSprite, Assets, Container, Text, TextStyle } from 'pixi.js';

	interface Props {
		frames: any[];
		playing: boolean;
		speed?: number;
		onComplete?: () => void;
		onFrame?: (index: number) => void;
	}

	let { frames, playing, speed = 0.4, onComplete, onFrame }: Props = $props();

	let canvas: HTMLCanvasElement;
	let app: Application;
	let animId: number;
	let frameIndex = 0;
	let accum = 0;

	const W = 600;
	const H = 600;

	const SPRITE_FRAMES = 8;
	const SPRITE_SIZE = 512;
	const FIGHTER_DISPLAY_SIZE = 50; // radius in game units

	const SPRITESHEET_MAP: Record<string, string> = {
		blaze: '/sprites/blaze_idle_v2.png',
		quake: '/sprites/quake_idle.png',
		spark: '/sprites/spark_idle.png',
		phantom: '/sprites/phantom_idle.png'
	};

	// Layers
	let trailLayer: Graphics;
	let projectileLayer: Graphics;
	let particleLayer: Graphics;
	let dangerLayer: Graphics;
	let bgLayer: Graphics;
	let hpLayer: Graphics;
	let damageLayer: Container;

	// Fighter sprites
	let fighterSprites: Map<string, AnimatedSprite> = new Map();

	async function loadFighterTextures(fighterId: string): Promise<Texture[]> {
		const path = SPRITESHEET_MAP[fighterId] || SPRITESHEET_MAP['blaze'];
		const baseTexture = await Assets.load(path);
		const textures: Texture[] = [];
		for (let i = 0; i < SPRITE_FRAMES; i++) {
			const frame = new Rectangle(i * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE);
			textures.push(new Texture({ source: baseTexture.source, frame }));
		}
		return textures;
	}

	onMount(async () => {
		app = new Application();
		await app.init({ canvas, width: W, height: H, background: '#1a1a2e', antialias: true });

		bgLayer = new Graphics();
		trailLayer = new Graphics();
		projectileLayer = new Graphics();
		hpLayer = new Graphics();
		particleLayer = new Graphics();
		dangerLayer = new Graphics();
		damageLayer = new Container();

		app.stage.addChild(bgLayer, trailLayer, projectileLayer, hpLayer, particleLayer, dangerLayer, damageLayer);
		drawBackground();
	});

	onDestroy(() => {
		if (animId) cancelAnimationFrame(animId);
		app?.destroy(true);
	});

	function drawBackground() {
		bgLayer.clear();
		bgLayer.rect(0, 0, W, H).fill({ color: 0x1a1a2e });
		bgLayer.setStrokeStyle({ width: 1, color: 0x2a2a4e, alpha: 0.3 });
		for (let x = 0; x < W; x += 40) bgLayer.moveTo(x, 0).lineTo(x, H).stroke();
		for (let y = 0; y < H; y += 40) bgLayer.moveTo(0, y).lineTo(W, y).stroke();
	}

	async function ensureFighterSprite(f: any): Promise<AnimatedSprite> {
		const id = f.id || f.type;
		if (fighterSprites.has(id)) return fighterSprites.get(id)!;

		const textures = await loadFighterTextures(f.type || id);
		const sprite = new AnimatedSprite(textures);
		sprite.anchor.set(0.5);
		sprite.animationSpeed = 0.15;
		sprite.play();
		app.stage.addChildAt(sprite, app.stage.getChildIndex(hpLayer));
		fighterSprites.set(id, sprite);
		return sprite;
	}

	// Floating damage numbers
	interface FloatingText { text: Text; life: number }
	let floatingTexts: FloatingText[] = [];

	function renderFrame(fd: any) {
		// Process damage events into floating texts
		if (fd.events) {
			for (const e of fd.events) {
				if (e.type === 'damage' && e.amount > 0) {
					const color = typeof e.color === 'string' ? parseInt(e.color.replace('#', ''), 16) : (e.color || 0xff4444);
					const t = new Text({ text: `-${e.amount}`, style: { fontSize: 24, fontFamily: 'Impact, "Arial Narrow", sans-serif', fontWeight: 'bold', fill: color, stroke: { color: 0x000000, width: 3 }, letterSpacing: 1 } });
					t.anchor.set(0.5);
					t.x = e.x;
					t.y = e.y;
					damageLayer.addChild(t);
					floatingTexts.push({ text: t, life: 40 });
				}
			}
		}

		// Update floating texts
		floatingTexts = floatingTexts.filter(ft => {
			ft.text.y -= 0.8;
			ft.text.alpha = ft.life / 40;
			ft.life--;
			if (ft.life <= 0) {
				damageLayer.removeChild(ft.text);
				ft.text.destroy();
				return false;
			}
			return true;
		});

		// Danger zone
		dangerLayer.clear();
		if (fd.dangerPad > 0) {
			dangerLayer.rect(0, 0, W, fd.dangerPad).fill({ color: 0xff0000, alpha: 0.15 });
			dangerLayer.rect(0, H - fd.dangerPad, W, fd.dangerPad).fill({ color: 0xff0000, alpha: 0.15 });
			dangerLayer.rect(0, 0, fd.dangerPad, H).fill({ color: 0xff0000, alpha: 0.15 });
			dangerLayer.rect(W - fd.dangerPad, 0, fd.dangerPad, H).fill({ color: 0xff0000, alpha: 0.15 });
		}

		// Fire trails
		trailLayer.clear();
		for (const t of fd.fireTrails) {
			const alpha = t.life / t.maxLife;
			trailLayer.circle(t.x, t.y, 4).fill({ color: 0xff4400, alpha: alpha * 0.6 });
		}

		// Projectiles
		projectileLayer.clear();
		for (const p of fd.projectiles) {
			const color = typeof p.color === 'string' ? parseInt(p.color.replace('#', ''), 16) : p.color;
			projectileLayer.circle(p.x, p.y, p.size || 4).fill({ color });
		}

		// Fighters (animated sprites)
		const activeFighters = new Set<string>();
		for (const f of fd.fighters) {
			const id = f.id || f.type;
			activeFighters.add(id);
			const sprite = fighterSprites.get(id);
			if (!sprite) continue;
			const radius = f.size || f.radius || 20;
			const scale = (radius * 4) / SPRITE_SIZE;
			sprite.scale.set(scale);
			sprite.x = f.x;
			sprite.y = f.y;
			sprite.visible = f.alive;
			sprite.alpha = f.phasing ? 0.4 : 1;
		}

		// Hide dead fighters
		for (const [id, sprite] of fighterSprites) {
			if (!activeFighters.has(id)) sprite.visible = false;
		}

		// HP rings - disabled, shown in UI instead
		hpLayer.clear();

		// Particles
		particleLayer.clear();
		for (const p of fd.particles) {
			const alpha = p.life / p.maxLife;
			const color = typeof p.color === 'string' ? parseInt(p.color.replace('#', ''), 16) : p.color;
			particleLayer.circle(p.x, p.y, p.size || 2).fill({ color, alpha });
		}
	}

	async function preloadFighters(fd: any) {
		for (const f of fd.fighters) {
			await ensureFighterSprite(f);
		}
	}

	$effect(() => {
		if (playing && frames.length > 0) {
			frameIndex = 0;
			accum = 0;
			// Preload sprites from first frame, then start playback
			preloadFighters(frames[0]).then(() => tick());
		} else {
			// Destroy all fighter sprites between matches
			for (const sprite of fighterSprites.values()) {
				sprite.stop();
				sprite.destroy();
			}
			fighterSprites.clear();
			// Clear floating texts
			for (const ft of floatingTexts) { ft.text.destroy(); }
			floatingTexts = [];
			// Clear graphics layers
			if (trailLayer) trailLayer.clear();
			if (projectileLayer) projectileLayer.clear();
			if (particleLayer) particleLayer.clear();
			if (dangerLayer) dangerLayer.clear();
			if (hpLayer) hpLayer.clear();
		}
	});

	function tick() {
		if (!playing || frameIndex >= frames.length) {
			if (frameIndex >= frames.length) onComplete?.();
			return;
		}

		accum += speed;
		const steps = Math.floor(accum);
		accum -= steps;

		for (let i = 0; i < steps && frameIndex < frames.length; i++) {
			frameIndex++;
		}

		const fd = frameIndex < frames.length ? frames[frameIndex] : frames[frames.length - 1];
		renderFrame(fd);
		onFrame?.(Math.min(frameIndex, frames.length - 1));

		animId = requestAnimationFrame(tick);
	}
</script>

<canvas bind:this={canvas} width={W} height={H} class="arena-canvas"></canvas>

<style>
	.arena-canvas {
		width: 100%;
		max-width: 600px;
		aspect-ratio: 1;
		border-radius: 8px;
		display: block;
		margin: 0 auto;
	}
</style>
