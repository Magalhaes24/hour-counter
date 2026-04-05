import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Compute a relative path from the frontend folder to a cache dir outside OneDrive.
// Next.js uses path.join(projectRoot, distDir) internally, so distDir must be relative.
const cacheDir = path.join(os.homedir(), '.cache', 'hours-counter-next')
const relativeDistDir = path.relative(__dirname, cacheDir)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: relativeDistDir,
}

export default nextConfig
