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
const pub = (name) => resolve(root, 'public', name)

/** @type {{src: string, dest: (n: string) => string, width: number, format: 'webp' | 'png'}[]} */
const jobs = [
  // emblema circular — usado ~112px, gera 512 pra folga de retina
  { src: 'logo.png', dest: out, name: 'logo.webp', width: 512, format: 'webp' },
  // lockup horizontal (emblema + texto)
  { src: 'logo-text-align.png', dest: out, name: 'logo-lockup.webp', width: 960, format: 'webp' },
  // lockup empilhado (splash / marca grande)
  { src: 'logo-text.png', dest: out, name: 'logo-stacked.webp', width: 720, format: 'webp' },
  // foto do produto — card do catálogo
  { src: 'kit-salchipao.png', dest: out, name: 'product.webp', width: 800, format: 'webp' },
  // favicon (aba do navegador) + ícone iOS — a partir do emblema
  { src: 'logo.png', dest: pub, name: 'favicon.png', width: 256, format: 'png' },
  { src: 'logo.png', dest: pub, name: 'apple-touch-icon.png', width: 180, format: 'png' },
]

let ran = 0
for (const job of jobs) {
  if (!existsSync(raw(job.src))) {
    console.warn(`· pulei ${job.name} (não achei ${job.src} em src/assets/raw/)`)
    continue
  }
  const target = job.dest(job.name)
  const pipe = sharp(raw(job.src)).resize({
    width: job.width,
    withoutEnlargement: true,
  })
  await (job.format === 'png'
    ? pipe.png({ compressionLevel: 9 })
    : pipe.webp({ quality: 82, effort: 6 })
  ).toFile(target)

  const { size } = statSync(target)
  console.log(`✓ ${job.name} (${job.width}px, ${(size / 1024).toFixed(0)} KB)`)
  ran++
}
console.log(`\n${ran} asset(s) gerado(s)`)
