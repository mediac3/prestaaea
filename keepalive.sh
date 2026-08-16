#!/bin/bash
# Keepalive wrapper for PrestaAEA standalone server
cd /home/z/my-project/.next/standalone
while true; do
  echo "[$(date)] Starting PrestaAEA server..."
  node server.js 2>&1 | tee -a /tmp/prestaae.log
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done