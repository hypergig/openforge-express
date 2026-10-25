import * as THREE from "three"

/**
 * An alignment function that positions `part` relative to `base` in-place.
 */
export type PartAligner = (
  part: THREE.BufferGeometry,
  base: THREE.BufferGeometry,
) => void

/**
 * A map of part roles (subfolder names) -> aligner functions.
 */
export type TileRecipe = Record<string, PartAligner>
export type TileRecipes = Record<string, TileRecipe>

/**
 * Cardinal corners in top-down (X/Y) space:
 * - "nw": min X, max Y (Top-Left)
 * - "ne": max X, max Y (Top-Right)
 * - "sw": min X, min Y (Bottom-Left)
 * - "se": max X, min Y (Bottom-Right)
 */
export type Corner = "nw" | "ne" | "sw" | "se"
