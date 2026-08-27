#!/bin/bash
# Cluster-Init-Script: stellt Playwright und Chromium auf jedem Knoten bereit.
#
# In Databricks hinterlegen unter:
#   Compute -> Cluster -> Advanced options -> Init Scripts
#   (Datei vorher in ein Unity-Catalog-Volume legen)
#
# Ohne dieses Script installiert das Notebook Chromium bei jedem Lauf neu -
# das kostet jedes Mal ein paar Minuten.
set -euo pipefail

echo "Installiere Playwright ..."
/databricks/python/bin/pip install --quiet playwright==1.49.0

# Browser einmal zentral ablegen, damit alle Läufe ihn finden.
export PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"
/databricks/python/bin/playwright install --with-deps chromium

echo "PLAYWRIGHT_BROWSERS_PATH=/opt/playwright" >> /etc/environment
echo "Chromium bereit unter $PLAYWRIGHT_BROWSERS_PATH"
