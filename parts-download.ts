import { hash } from "node:crypto"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { z } from "zod"
import {
  type FileEntry,
  isFileEntry,
  loadPartsManifest,
  type ManifestNode,
} from "./src/parts-manifest.ts"

const concurrencyLimit = 5

interface DownloadTask {
  entry: FileEntry
  targetDir: string
}

function collectTasks(
  node: ManifestNode,
  targetDir = process.cwd(),
): DownloadTask[] {
  if (isFileEntry(node)) {
    return [{ entry: node, targetDir }]
  }
  return Object.entries(node).flatMap(([key, child]) =>
    collectTasks(child, path.join(targetDir, key)),
  )
}

async function isFileValid(
  filePath: string,
  expectedMd5: string,
): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath)
    return hash("md5", content) === expectedMd5
  } catch {
    return false
  }
}

async function processDownload({
  entry,
  targetDir,
}: DownloadTask): Promise<void> {
  const destinationPath = path.join(targetDir, entry.name)
  const expectedMd5 = entry.md5.toLowerCase()

  if (await isFileValid(destinationPath, expectedMd5)) {
    console.log(`[Skipped]  ${entry.name} (already verified)`)
    return
  }

  console.log(`[Fetching] ${entry.name} -> ${targetDir}`)
  const response = await fetch(entry.url)
  if (!response.ok) {
    throw new Error(
      `Failed to download ${entry.url}: ${response.status} ${response.statusText}`,
    )
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  if (hash("md5", bytes) !== expectedMd5) {
    throw new Error(
      `Fatal: MD5 mismatch for "${destinationPath}". Expected ${entry.md5}`,
    )
  }

  await fs.mkdir(targetDir, { recursive: true })
  await fs.writeFile(destinationPath, bytes)
  console.log(`[Verified] ${entry.name}`)
}

async function main(): Promise<void> {
  const yamlFilePath = process.argv[2] ?? "parts.yaml"
  console.log(`Reading: ${yamlFilePath}`)

  const manifest = loadPartsManifest(yamlFilePath)
  const tasks = collectTasks(manifest)

  console.log(
    `Discovered ${tasks.length} file(s). Running with concurrency of ${concurrencyLimit}...\n`,
  )

  const queue = tasks.values()
  await Promise.all(
    Array.from({ length: concurrencyLimit }, async () => {
      for (const task of queue) {
        await processDownload(task)
      }
    }),
  )

  console.log("\nAll files processed successfully!")
}

main().catch((err: unknown) => {
  const message =
    err instanceof z.ZodError
      ? z.prettifyError(err)
      : err instanceof Error
        ? err.message
        : String(err)
  console.error("\nProcess terminated with error:\n", message)
  process.exit(1)
})
