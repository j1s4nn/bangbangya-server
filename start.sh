#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "===================================="
echo "  帮帮鸭 后端服务 v2.0"
echo "===================================="
echo ""

if [ ! -d "node_modules" ]; then
  echo "[1/2] Installing dependencies (first time only)..."
  npm install
  if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed. Make sure Node.js is installed: https://nodejs.org"
    exit 1
  fi
  echo "[1/2] Done!"
  echo ""
else
  echo "[1/2] Dependencies already installed."
fi

echo "[2/2] Starting server..."
echo ""
echo "===================================="
echo " Server:  http://localhost:3000"
echo " Admin:   http://localhost:3000/admin"
echo "===================================="
echo ""
echo "Press Ctrl+C to stop."
echo ""
node index.js
