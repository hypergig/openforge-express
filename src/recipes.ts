import { alignCenter, alignCorner, offset } from "./alighners.ts"
import { TileRecipes } from "./types.ts"

export const recipes: TileRecipes = {
  floor: alignCenter,

  wall: {
    floor: alignCorner("nw"),
    wall: offset(0, -19.05),
  },

  corner: {
    floor: alignCorner("ne"),
    wall: alignCenter,
  },
}
