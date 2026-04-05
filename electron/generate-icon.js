const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const SVG_PATH = path.join(__dirname, 'icon.svg')
const ASSETS   = path.join(__dirname, 'assets')
const ICO_PATH = path.join(ASSETS, 'icon.ico')
const PNG_PATH = path.join(ASSETS, 'icon.png')

// Build a valid .ico file that embeds PNG images (Windows Vista+)
function buildIco(pngBuffers, sizes) {
  const count  = pngBuffers.length
  const headerSize  = 6
  const dirEntrySize = 16
  const dirSize = headerSize + count * dirEntrySize

  let offset = dirSize
  const offsets = pngBuffers.map((buf) => { const o = offset; offset += buf.length; return o })

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type: ICO
  header.writeUInt16LE(count, 4)

  const dirs = pngBuffers.map((buf, i) => {
    const d = Buffer.alloc(16)
    const sz = sizes[i]
    d.writeUInt8(sz >= 256 ? 0 : sz, 0)   // width  (0 = 256)
    d.writeUInt8(sz >= 256 ? 0 : sz, 1)   // height (0 = 256)
    d.writeUInt8(0, 2)                     // colorCount
    d.writeUInt8(0, 3)                     // reserved
    d.writeUInt16LE(1, 4)                  // planes
    d.writeUInt16LE(32, 6)                 // bitCount
    d.writeUInt32LE(buf.length, 8)         // sizeInBytes
    d.writeUInt32LE(offsets[i], 12)        // offset
    return d
  })

  return Buffer.concat([header, ...dirs, ...pngBuffers])
}

async function main() {
  fs.mkdirSync(ASSETS, { recursive: true })

  const svgBuf = fs.readFileSync(SVG_PATH)
  const sizes  = [16, 32, 48, 64, 128, 256]

  console.log('Rendering icon sizes from SVG…')
  const pngs = await Promise.all(
    sizes.map((sz) => sharp(svgBuf).resize(sz, sz).png().toBuffer())
  )
  sizes.forEach((sz, i) => console.log(`  ${sz}x${sz}  ${pngs[i].length} bytes`))

  // Save 256px PNG for Electron icon option
  fs.writeFileSync(PNG_PATH, pngs[pngs.length - 1])
  console.log(`Saved PNG  → assets/icon.png`)

  // Build and save ICO
  const ico = buildIco(pngs, sizes)
  fs.writeFileSync(ICO_PATH, ico)
  console.log(`Saved ICO  → assets/icon.ico  (${ico.length} bytes)`)
}

main().catch((err) => { console.error(err); process.exit(1) })
