/**
 * Genera iconos en public/ desde assets/icon.png:
 * recorte centrado tipo "cover" (cuadrado) + maskable con margen seguro.
 */
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const input = path.join(root, 'assets', 'icon.png')
const outDir = path.join(root, 'public')

/** #0b0b12 */
const THEME = { r: 11, g: 11, b: 18, alpha: 1 }

function coverSquare(size) {
  return sharp(input).resize(size, size, { fit: 'cover', position: 'center' }).png()
}

/** Icono maskable: contenido ~80% centrado sobre fondo del tema */
async function maskable512() {
  const canvas = 512
  const inner = Math.round(canvas * 0.8)
  const buf = await sharp(input)
    .resize(inner, inner, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer()
  const left = Math.floor((canvas - inner) / 2)
  const top = Math.floor((canvas - inner) / 2)
  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: THEME,
    },
  }).composite([{ input: buf, left, top }]).png()
}

async function main() {
  const targets = [
    ['favicon.png', 48],
    ['apple-touch-icon.png', 180],
    ['pwa-192x192.png', 192],
    ['pwa-512x512.png', 512],
  ]

  for (const [name, size] of targets) {
    const dest = path.join(outDir, name)
    await coverSquare(size).toFile(dest)
    console.log('written', name, `${size}x${size}`)
  }

  const maskPath = path.join(outDir, 'pwa-512x512-maskable.png')
  await (await maskable512()).toFile(maskPath)
  console.log('written', 'pwa-512x512-maskable.png', '512x512 (safe zone)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
