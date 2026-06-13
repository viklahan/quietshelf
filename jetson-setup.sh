#!/usr/bin/env bash
# One-time Jetson setup: pull the model into the Ollama container.
# Run this AFTER `docker compose -f docker-compose.jetson.yml up -d ollama`
# and BEFORE starting the qfc service.
set -euo pipefail

MODEL="${MODEL_NAME:-llama3.1:8b}"
echo "Pulling model: $MODEL"
echo "This downloads ~5 GB the first time. Subsequent starts use the cached volume."
echo ""

docker compose -f docker-compose.jetson.yml exec ollama ollama pull "$MODEL"

echo ""
echo "Model ready. Start the full stack with:"
echo "  docker compose -f docker-compose.jetson.yml up -d"
