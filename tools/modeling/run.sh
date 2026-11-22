#!/usr/bin/env bash
# Rebuilds every model file from the original BodyParts3D release.
#   tools/modeling/run.sh
# Needs Python 3 with tools/modeling/requirements.txt installed, curl and unzip.
# The raw archive is downloaded once into data/raw (not committed) and checked against the
# checksum recorded in ASSETS.md, so a changed upstream file stops the build instead of slipping in.
set -euo pipefail
cd "$(dirname "$0")/../.."

URL="https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip"
SHA256="40665852c49f218326590e204db91064a1ecfc3c6f8cbd7bbbcaac62c7cd409e"
RAW="data/raw"
ZIP="$RAW/isa_BP3D_4.0_obj_99.zip"
OBJ="$RAW/isa_BP3D_4.0_obj_99"

mkdir -p "$RAW" models/generated apps/miniprogram/models
if [ ! -f "$ZIP" ]; then
  echo "downloading BodyParts3D 4.0 (136 MB)..."
  curl -fsS -o "$ZIP.part" "$URL" && mv "$ZIP.part" "$ZIP"
fi
echo "$SHA256  $ZIP" | sha256sum -c -
[ -d "$OBJ" ] || unzip -q -o "$ZIP" -d "$RAW"
# concept table: which meshes are bones and which are muscles (used for the whole-body overview)
[ -f "$RAW/isa_element_parts.txt" ] || curl -fsS -o "$RAW/isa_element_parts.txt" "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_element_parts.txt"

# -I keeps Python from importing anything out of the downloaded data's directories.
python3 -I tools/modeling/inventory.py "$OBJ" "$RAW/inventory.json"
python3 -I tools/modeling/pulleys.py "$RAW/inventory.json" "$OBJ" tools/modeling/pulley_params.json models/generated/hand_pulleys_right.glb
python3 -I tools/modeling/build_app_model.py "$RAW/inventory.json" "$OBJ" models/generated/hand_pulleys_right.glb models/generated/hand_right apps/miniprogram/models/hand_right
python3 -I tools/modeling/build_overview.py "$RAW/inventory.json" "$RAW/isa_element_parts.txt" "$OBJ" models/generated/body_overview
echo "done. Run 'npm run check' to confirm the app and content still agree with the new model."
