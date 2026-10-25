import * as fs from "node:fs"
import * as path from "node:path"
import { parse as parseYaml } from "yaml"
import { z } from "zod"

export const fileEntrySchema = z.object({
  name: z.string().nonempty(),
  url: z.url(),
  homepage: z.url(),
  md5: z.hash("md5"),
})

export type FileEntry = z.infer<typeof fileEntrySchema>

// Recursive schema for generic tree traversal (e.g., in the downloader script)
export type ManifestNode = FileEntry | { [key: string]: ManifestNode }

export const manifestNodeSchema: z.ZodType<ManifestNode> = z.lazy(() =>
  z.union([fileEntrySchema, z.record(z.string(), manifestNodeSchema)]),
)

// Structured schema for the tile assembler
// parts.textures.<texture>.<tileType>.<partRole> -> FileEntry
export const tilePartsSchema = z.record(z.string(), fileEntrySchema)
export const textureSchema = z.record(z.string(), tilePartsSchema)

export const partsManifestSchema = z.object({
  parts: z.object({
    bases: z.record(z.string(), fileEntrySchema),
    textures: z.record(z.string(), textureSchema),
  }),
})

export type TilePartsManifest = z.infer<typeof tilePartsSchema>
export type TextureManifest = z.infer<typeof textureSchema>
export type PartsManifest = z.infer<typeof partsManifestSchema>

/**
 * Type guard for recursive tree walkers (like the downloader script).
 */
export function isFileEntry(node: ManifestNode): node is FileEntry {
  return (
    typeof node === "object" &&
    node !== null &&
    typeof (node as FileEntry).name === "string" &&
    typeof (node as FileEntry).url === "string" &&
    typeof (node as FileEntry).md5 === "string"
  )
}

/**
 * Loads, parses, and validates parts.yaml.
 */
export function loadPartsManifest(yamlPath: string): PartsManifest {
  const rawYaml = fs.readFileSync(yamlPath, "utf8")
  const parsed = parseYaml(rawYaml)
  return partsManifestSchema.parse(parsed)
}

/**
 * Resolves the on-disk path for a base STL:
 * parts/bases/<baseKey>/<entry.name>
 */
export function resolveBasePath(
  partsDir: string,
  baseKey: string,
  entry: FileEntry,
): string {
  return path.join(partsDir, "bases", baseKey, entry.name)
}

/**
 * Resolves the on-disk path for a texture part STL:
 * parts/textures/<textureKey>/<tileType>/<partRole>/<entry.name>
 */
export function resolvePartPath(
  partsDir: string,
  textureKey: string,
  tileType: string,
  partRole: string,
  entry: FileEntry,
): string {
  return path.join(
    partsDir,
    "textures",
    textureKey,
    tileType,
    partRole,
    entry.name,
  )
}
