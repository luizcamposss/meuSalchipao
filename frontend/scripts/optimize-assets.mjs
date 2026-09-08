/**
 * Gera as versões web (WebP) dos assets a partir dos originais em
 * src/assets/raw/ (que ficam fora do git). Rode uma vez sempre que
 * trocar um original:  node scripts/optimize-assets.mjs
 */
import { existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const raw = (name) => resolve(root, 'src/assets/raw', name)
const out = (name) => resolve(root, 'src/assets', name)

/** @type {{src: string, dest: string, width: number, height?: number}[]} */
const jobs = [
  // emblema circular — usado ~112px, gera 512 pra folga de retina
  { src: 'logo.png', dest: 'logo.webp', width: 512 },
  // lockup horizontal (emblema + texto)
  { src: 'logo-text-align.png', dest: 'logo-lockup.webp', width: 960 },
  // lockup empilhado (splash / marca grande)
  { src: 'logo-text.png', dest: 'logo-stacked.webp', width: 720 },
  // foto do produto — card do catálogo
  { src: 'kit-salchipao.png', dest: 'product.webp', width: 800 },
]

let ran = 0
for (const job of jobs) {
  if (!existsSync(raw(job.src))) {
    console.warn(`· pulei ${job.src} (não achei em src/assets/raw/)`)
    continue
  }
  await sharp(raw(job.src))
    .resize({ width: job.width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(out(job.dest))

  const { size } = statSync(out(job.dest))
  console.log(`✓ ${job.dest} (${job.width}px, ${(size / 1024).toFixed(0)} KB)`)
  ran++
}
console.log(`\n${ran} asset(s) gerado(s) em src/assets/`)
