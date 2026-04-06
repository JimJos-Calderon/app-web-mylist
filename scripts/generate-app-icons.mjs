/**
 * Genera iconos en public/ desde assets/icon.png:
 * recorte centrado tipo "cover" (cuadrado) + maskable con margen seguro.
 * Además: pwa-64x64 (manifest) y logo-navbar.webp (navbar + preload, desde icon-sin-fondo si existe).
 */
import fs from 'fs'
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

async function writeNavbarWebp() {
  const candidates = [
    path.join(root, 'assets', 'icon-sin-fondo.png'),
    path.join(root, 'assets', 'icon.png'),
    path.join(outDir, 'pwa-512x512.png'),
  ]
  const src = candidates.find((p) => fs.existsSync(p))
  if (!src) {
    console.warn('skip logo-navbar.webp: no source found')
    return
  }
  const dest = path.join(outDir, 'logo-navbar.webp')
  await sharp(src)
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toFile(dest)
  console.log('written', 'logo-navbar.webp', '(from', path.basename(src) + ')')
}

async function main() {
  if (!fs.existsSync(input)) {
    console.error('Missing', input, '- coloca assets/icon.png para generar PWA icons.')
    process.exit(1)
  }

  const targets = [
    ['favicon.png', 48],
    ['pwa-64x64.png', 64],
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

  await writeNavbarWebp()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
