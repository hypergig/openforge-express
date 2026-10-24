import * as path from "node:path"
import * as THREE from "three"
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js"
import { alignCenter } from "./alighners.ts"
import { loadSTL, resolveFirstSTL } from "./io.ts"
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
 * Assembles a single tile according to its recipe.
 */
export function buildTile(
  baseDir: string,
  tileType: string,
  recipe: TileRecipe,
  baseGeom: THREE.BufferGeometry,
): THREE.BufferGeometry {
  const tileRoot = path.join(baseDir, tileType)
  const clonedBase = baseGeom.clone()

  // Create 50.8 x 50.8 x 1.5 padding cube and align it directly on top of the base.
  // Because recipes align against `clonedBase`, subsequent parts will still reference
  // the original base top and overlap this padding cube as intended.
  const paddingCube = createSTLCompatibleBox(50.8, 50.8, 1.5)
  alignCenter(paddingCube, clonedBase)

  const parts: THREE.BufferGeometry[] = [clonedBase, paddingCube]

  if (typeof recipe === "function") {
    // Single-part tile: fetch STL directly from the tile's root directory
    const stlPath = resolveFirstSTL(tileRoot)
    const part = loadSTL(stlPath)
    recipe(part, clonedBase)
    parts.push(part)
  } else {
    // Multi-part tile: iterate over subfolder keys
    for (const [subFolder, align] of Object.entries(recipe)) {
      const stlPath = resolveFirstSTL(path.join(tileRoot, subFolder))
      const part = loadSTL(stlPath)
      align(part, clonedBase)
      parts.push(part)
    }
  }

  const merged = BufferGeometryUtils.mergeGeometries(parts, false)
  if (!merged) {
    throw new Error(`Failed to merge geometries for tile "${tileType}".`)
  }

  return merged
}
