#!/usr/bin/env node
/**
 * Generate sprite animation frames via ComfyUI API
 * Then stitch them into a spritesheet.
 * 
 * Usage: node scripts/generate-spritesheet.js [fighter]
 * Requires: ComfyUI running on localhost:8188
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const COMFYUI_URL = 'http://127.0.0.1:8000';
const fighter = process.argv[2] || 'blaze';

const PROMPTS = {
  blaze: [
    'fiery ball character, flames flowing upward, dark background, game sprite, centered',
    'fiery ball character, flames swirling right, dark background, game sprite, centered',
    'fiery ball character, flames expanding outward, bright glow, dark background, game sprite, centered',
    'fiery ball character, flames swirling left, dark background, game sprite, centered',
    'fiery ball character, flames flowing upward intensely, dark background, game sprite, centered',
    'fiery ball character, flames contracting inward, dimmer glow, dark background, game sprite, centered',
  ],
  quake: [
    'rocky stone ball character, debris floating around, dark background, game sprite, centered',
    'rocky stone ball character, cracks glowing orange, dark background, game sprite, centered',
    'rocky stone ball character, rocks orbiting outward, dark background, game sprite, centered',
    'rocky stone ball character, ground impact dust, dark background, game sprite, centered',
    'rocky stone ball character, pulsing with earth energy, dark background, game sprite, centered',
    'rocky stone ball character, settling debris, dark background, game sprite, centered',
  ],
  spark: [
    'electric ball character, lightning arcs upward, dark background, game sprite, centered',
    'electric ball character, sparks flying right, dark background, game sprite, centered',
    'electric ball character, bright electric burst, dark background, game sprite, centered',
    'electric ball character, lightning arcs left, dark background, game sprite, centered',
    'electric ball character, intense crackling energy, dark background, game sprite, centered',
    'electric ball character, dimming between pulses, dark background, game sprite, centered',
  ],
  phantom: [
    'ghostly purple void ball character, wisps floating up, dark background, game sprite, centered',
    'ghostly purple void ball character, shadow tendrils reaching right, dark background, game sprite, centered',
    'ghostly purple void ball character, void energy expanding, dark background, game sprite, centered',
    'ghostly purple void ball character, tendrils reaching left, dark background, game sprite, centered',
    'ghostly purple void ball character, pulsing dark energy, dark background, game sprite, centered',
    'ghostly purple void ball character, fading ethereal wisps, dark background, game sprite, centered',
  ],
};

const workflow = JSON.parse(readFileSync('/Users/tolischristomanos/Downloads/BallFightersSDXL.json', 'utf8'));

async function submitPrompt(promptText, seed, prefix) {
  const wf = JSON.parse(JSON.stringify(workflow));
  wf['5'].inputs.text = promptText;
  wf['6'].inputs.seed = seed;
  wf['8'].inputs.filename_prefix = prefix;
  wf['4'].inputs.image = `${fighter}.png`;

  const res = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: wf }),
  });
  const data = await res.json();
  return data.prompt_id;
}

async function waitForCompletion(promptId) {
  while (true) {
    const res = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    const data = await res.json();
    if (data[promptId]?.outputs) return data[promptId].outputs;
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function main() {
  const frames = PROMPTS[fighter];
  if (!frames) { console.error(`Unknown fighter: ${fighter}`); process.exit(1); }

  console.log(`🎨 Generating ${frames.length} frames for ${fighter}...`);

  for (let i = 0; i < frames.length; i++) {
    const seed = Math.floor(Math.random() * 999999999999);
    const prefix = `${fighter}_frame${i}`;
    console.log(`  Frame ${i + 1}/${frames.length}: "${frames[i].slice(0, 50)}..."`);
    
    const promptId = await submitPrompt(frames[i], seed, prefix);
    console.log(`    Submitted: ${promptId}`);
    
    const outputs = await waitForCompletion(promptId);
    console.log(`    ✅ Done`);
  }

  console.log(`\n✅ All frames generated! Check ComfyUI output folder.`);
  console.log(`   Then run: node scripts/stitch-spritesheet.js ${fighter}`);
}

main().catch(console.error);
