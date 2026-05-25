#!/bin/bash
# Download SDXL + IP-Adapter models for ComfyUI spritesheet generation
# Total: ~9.6 GB

MODELS_DIR="/Users/tolischristomanos/Documents/ComfyUI/models"

echo "📦 Downloading models for ComfyUI IP-Adapter (~9.6 GB total)"
echo ""

# 1. SDXL Base 1.0 checkpoint (~6.5 GB)
echo "⬇️  [1/3] SDXL Base 1.0 (6.5 GB)..."
curl -L -o "$MODELS_DIR/checkpoints/sd_xl_base_1.0.safetensors" \
  "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors" \
  --progress-bar

# 2. CLIP Vision ViT-H (for IP-Adapter) (~2.4 GB)
echo "⬇️  [2/3] CLIP Vision ViT-H (2.4 GB)..."
curl -L -o "$MODELS_DIR/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" \
  "https://huggingface.co/h94/IP-Adapter/resolve/main/models/image_encoder/model.safetensors" \
  --progress-bar

# 3. IP-Adapter SDXL (~700 MB)
echo "⬇️  [3/3] IP-Adapter SDXL (700 MB)..."
curl -L -o "$MODELS_DIR/ipadapter/ip-adapter-plus_sdxl_vit-h.safetensors" \
  "https://huggingface.co/h94/IP-Adapter/resolve/main/sdxl_models/ip-adapter-plus_sdxl_vit-h.safetensors" \
  --progress-bar

echo ""
echo "✅ All models downloaded!"
echo ""
echo "Next steps:"
echo "  1. Open ComfyUI app"
echo "  2. Load an IP-Adapter workflow"
echo "  3. Use your reference sprite as the IP-Adapter image input"
echo "  4. Change prompt for each animation frame (idle, attack, hit, death)"
