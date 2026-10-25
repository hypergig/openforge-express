import * as fs from "node:fs"
import * as path from "node:path"
import { buildTile } from "./src/builder.ts"
import { loadSTL, saveSTL } from "./src/io.ts"
import { loadPartsManifest, resolveBasePath } from "./src/parts-manifest.ts"
import { recipes } from "./src/recipes.ts"

async function main() {
  const rootDir = import.meta.dirname
  const partsDir = path.join(rootDir, "parts")
  const outputDir = path.join(rootDir, "tiles")
  const yamlPath = path.join(rootDir, "parts.yaml")

  const { parts } = loadPartsManifest(yamlPath)
  const bases = Object.entries(parts.bases)
  const textures = Object.entries(parts.textures)

  console.log(
    `Loaded manifest: ${bases.length} base(s) [${bases.map(([k]) => k).join(", ")}], ` +
      `${textures.length} texture set(s) [${textures.map(([k]) => k).join(", ")}]`,
  )

  for (const [baseKey, baseEntry] of bases) {
    const basePath = resolveBasePath(partsDir, baseKey, baseEntry)
    console.log(`\n=== Loading Base [${baseKey}]: ${basePath} ===`)
    const baseSTL = loadSTL(basePath)

    for (const [textureKey, textureManifest] of textures) {
      console.log(
        `\n  --- Processing Texture Set: ${textureKey} (Base: ${baseKey}) ---`,
      )

      // Ensure output directory exists: tiles/<bases>/<textures>/
      const tileOutDir = path.join(outputDir, baseKey, textureKey)
      fs.mkdirSync(tileOutDir, { recursive: true })

      for (const [tileType, recipe] of Object.entries(recipes)) {
        const tileManifest = textureManifest[tileType]
        if (!tileManifest) {
          console.warn(
            `   -> Skipping ${textureKey}/${tileType}: not defined in parts.yaml`,
          )
          continue
        }

        try {
          console.log(
            `   -> Assembling ${baseKey}/${textureKey}/${tileType}...`,
          )
          const finalTile = buildTile(
            partsDir,
            textureKey,
            tileType,
            tileManifest,
            recipe,
            baseSTL,
          )

          // Output path: tiles/<bases>/<textures>/<tiles>.stl
          const outPath = path.join(tileOutDir, `${tileType}.stl`)
          saveSTL(finalTile, outPath)
          finalTile.dispose()

          console.log(`      Saved: ${outPath}`)
        } catch (err) {
          console.error(
            `      Error building ${baseKey}/${textureKey}/${tileType}:`,
            (err as Error).message,
          )
        }
      }
    }

    baseSTL.dispose()
  }

  console.log("\nPipeline finished.")
}

main().catch(console.error)
