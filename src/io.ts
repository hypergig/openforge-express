import * as fs from "node:fs"
import * as path from "node:path"
import * as THREE from "three"
import { STLExporter } from "three/addons/exporters/STLExporter.js"
import { STLLoader } from "three/addons/loaders/STLLoader.js"

/**
 * Loads an STL file from disk into a Three.js BufferGeometry.
 */
export function loadSTL(filePath: string): THREE.BufferGeometry {
  const fileBuffer = fs.readFileSync(filePath)
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  )
  const loader = new STLLoader()
  return loader.parse(arrayBuffer)
}

/**
 * Exports a Three.js BufferGeometry to a binary STL on disk.
 */
export function saveSTL(
  geometry: THREE.BufferGeometry,
  outputPath: string,
  binary = true,
): void {
  const exporter = new STLExporter()
  const mesh = new THREE.Mesh(geometry)
  const result = exporter.parse(mesh, { binary })

  const buffer =
    typeof result === "string"
      ? Buffer.from(result)
      : Buffer.from(result.buffer, result.byteOffset, result.byteLength)

  fs.writeFileSync(outputPath, buffer)
}

/**
 * Finds the first STL file in a given directory.
 */
export function resolveFirstSTL(dirPath: string): string {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`)
  }

  const file = fs
    .readdirSync(dirPath)
    .find(f => !f.startsWith(".") && f.toLowerCase().endsWith(".stl"))

  if (!file) {
    throw new Error(`No STL found in directory: ${dirPath}`)
  }

  return path.join(dirPath, file)
}
