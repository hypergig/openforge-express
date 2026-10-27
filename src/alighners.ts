import * as THREE from "three"
import { Corner, PartAligner } from "./types.js"

/**
 * Centers `part` directly on top of `base` in Z, matching (X, Y) centers.
 */
export const alignCenter: PartAligner = (part, base) => {
  part.computeBoundingBox()
  base.computeBoundingBox()

  const partBox = part.boundingBox!
  const baseBox = base.boundingBox!

  const dz = baseBox.max.z - partBox.min.z

  const partCenter = new THREE.Vector3()
  const baseCenter = new THREE.Vector3()
  partBox.getCenter(partCenter)
  baseBox.getCenter(baseCenter)

  const dx = baseCenter.x - partCenter.x
  const dy = baseCenter.y - partCenter.y

  part.translate(dx, dy, dz)
}

/**
 * Applies an (x, y) offset.
 */
export const offset =
  (x = 0, y = 0): PartAligner =>
  part =>
    part.translate(x, y, 0)

/**
 * Applies an (x, y, z) rotation.
 */
export const rotate =
  (x = 0, y = 0, z = 0): PartAligner =>
  part => {
    if (x) part.rotateX(THREE.MathUtils.degToRad(x))
    if (y) part.rotateY(THREE.MathUtils.degToRad(y))
    if (z) part.rotateZ(THREE.MathUtils.degToRad(z))
  }

/**
 * Snaps the specified bottom corner of `part` directly to the matching
 * top corner of `base`.
 */
export const alignCorner = (corner: Corner): PartAligner => {
  return (part, base) => {
    part.computeBoundingBox()
    base.computeBoundingBox()

    const partBox = part.boundingBox!
    const baseBox = base.boundingBox!

    // Bottom of part sits flush on top of base
    const dz = baseBox.max.z - partBox.min.z

    // East uses max.x, West uses min.x
    const isEast = corner === "ne" || corner === "se"
    const dx = isEast
      ? baseBox.max.x - partBox.max.x
      : baseBox.min.x - partBox.min.x

    // North uses max.y, South uses min.y
    const isNorth = corner === "nw" || corner === "ne"
    const dy = isNorth
      ? baseBox.max.y - partBox.max.y
      : baseBox.min.y - partBox.min.y

    part.translate(dx, dy, dz)
  }
}

/**
 * Chains a bunch of aligners.
 */
export const alignerChain =
  (...aligners: PartAligner[]): PartAligner =>
  (part, base) =>
    aligners.forEach(a => a(part, base))
