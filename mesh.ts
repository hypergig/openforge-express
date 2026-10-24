import * as fs from "node:fs"
import * as path from "node:path"
import { buildTile } from "./src/builder.ts"
import { loadSTL, saveSTL } from "./src/io.ts"
import { recipes } from "./src/recipes.ts"

async function main() {
  const rootDir = import.meta.dirname
  const partsDir = path.join(rootDir, "parts")
  const texturesDir = path.join(partsDir, "textures")
  const outputDir = path.join(rootDir, "tiles")
  const basePath = path.join(partsDir, "base", "bases-square-v6.stl")

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  if (!fs.existsSync(texturesDir)) {
    throw new Error(`Textures directory not found: ${texturesDir}`)
  }

  console.log(`Loading shared base mesh: ${basePath}`)
  const baseSTL = loadSTL(basePath)

  // Discover all texture folders dynamically inside parts/textures/
  const textures = fs
    .readdirSync(texturesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)

  console.log(`Found ${textures.length} texture set(s): ${textures.join(", ")}`)

  for (const texture of textures) {
    const textureDir = path.join(texturesDir, texture)
    console.log(`\n=== Processing Texture Set: ${texture} ===`)

    for (const [tileType, recipe] of Object.entries(recipes)) {
      try {
        console.log(` -> Assembling ${texture}/${tileType}...`)
        const finalTile = buildTile(textureDir, tileType, recipe, baseSTL)

        const outPath = path.join(outputDir, `${texture}_${tileType}.stl`)
        saveSTL(finalTile, outPath)
        console.log(`    Saved: ${outPath}`)
      } catch (err) {
        console.error(
          `    Error building ${texture}/${tileType}:`,
          (err as Error).message,
        )
      }
    }
  }

  console.log("\nPipeline finished.")
}

main().catch(console.error)
