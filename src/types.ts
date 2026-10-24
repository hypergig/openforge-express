import * as THREE from "three"

/**
 * An alignment function that positions `part` relative to `base` in-place.
 */
export type PartAligner = (
  part: THREE.BufferGeometry,
  base: THREE.BufferGeometry,
) => void

/**
 * A recipe can either be:
 *  - A single aligner function (STL is located directly in the tile folder)
 *  - A map of subfolder names -> aligner functions (for multi-part tiles)
 */
export type TileRecipe = PartAligner | Record<string, PartAligner>

export type TileRecipes = Record<string, TileRecipe>

/**
 * Cardinal corners in top-down (X/Y) space:
 * - "nw": min X, max Y (Top-Left)
 * - "ne": max X, max Y (Top-Right)
 * - "sw": min X, min Y (Bottom-Left)
 * - "se": max X, min Y (Bottom-Right)
 */
export type Corner = "nw" | "ne" | "sw" | "se"
