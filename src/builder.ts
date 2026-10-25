import * as THREE from "three"
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js"
import { alignCenter } from "./alighners.ts"
import { loadSTL } from "./io.ts"
import { resolvePartPath, TilePartsManifest } from "./parts-manifest.ts"
import { TileRecipe } from "./types.ts"

/**
 * Creates an STL-compatible primitive box with matching vertex attributes.
 */
function createSTLCompatibleBox(
  width: number,
  height: number,
  depth: number,
): THREE.BufferGeometry {
  const box = new THREE.BoxGeometry(width, height, depth)
  const nonIndexedBox = box.toNonIndexed()
  box.dispose()

  if (nonIndexedBox.hasAttribute("uv")) {
    nonIndexedBox.deleteAttribute("uv")
  }

  nonIndexedBox.computeVertexNormals()
  return nonIndexedBox
}

/**
 * Assembles a single tile according to its recipe and YAML manifest entries.
 */
export function buildTile(
  partsDir: string,
  textureKey: string,
  tileType: string,
  tileManifest: TilePartsManifest,
  recipe: TileRecipe,
  baseGeom: THREE.BufferGeometry,
): THREE.BufferGeometry {
  const clonedBase = baseGeom.clone()

  // Create 50.8 x 50.8 x 1.5 padding cube and align it directly on top of the base.
  const paddingCube = createSTLCompatibleBox(50.8, 50.8, 1.5)
  alignCenter(paddingCube, clonedBase)

  const parts: THREE.BufferGeometry[] = [clonedBase, paddingCube]

  for (const [partRole, align] of Object.entries(recipe)) {
    const fileEntry = tileManifest[partRole]
    if (!fileEntry) {
      throw new Error(
        `Missing part "${partRole}" in parts.yaml for ${textureKey}/${tileType}`,
      )
    }

    const stlPath = resolvePartPath(
      partsDir,
      textureKey,
      tileType,
      partRole,
      fileEntry,
    )
    const part = loadSTL(stlPath)
    align(part, clonedBase)
    parts.push(part)
  }

  const merged = BufferGeometryUtils.mergeGeometries(parts, false)
  if (!merged) {
    throw new Error(`Failed to merge geometries for tile "${tileType}".`)
  }

  // Clean up intermediate geometries after merging
  for (const part of parts) {
    part.dispose()
  }

  return merged
}
