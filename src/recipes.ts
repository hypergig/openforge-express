import {
  alignCenter,
  alignCorner,
  alignerChain,
  offset,
  rotate,
} from "./alighners.ts"
import { TileRecipes } from "./types.ts"

export const recipes: TileRecipes = {
  floor: {
    floor: alignCenter,
  },

  wall: {
    floor: alignCorner("nw"),
    wall: alignerChain(alignCenter, offset(0, -19.05)),
  },

  corner: {
    floor: alignCorner("ne"),
    wall: alignCenter,
  },

  door: {
    floor: alignCorner("ne"),
    wall: alignerChain(rotate(0, 0, 180), alignCenter, offset(0, -19.05)),
  },
}
