#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
rm -rf ./dist
mkdir -vp ./dist

for base_dir in tiles/*; do
    for texture_dir in "${base_dir}"/*; do
        zip="./dist/${base_dir##*/}-${texture_dir##*/}.zip"
        echo "creating ${zip}..."
        zip -vrj "${zip}" "${texture_dir}"/*.stl LICENSE* README.md parts.yaml
    done
done

echo "creating sha256sum.txt..."
cd dist
sha256sum *.zip | tee sha256sum.txt
