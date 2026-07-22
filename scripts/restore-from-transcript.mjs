import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const transcriptDir =
  'C:/Users/Javaxir/.cursor/projects/c-Users-Javaxir-Desktop-vue-tailwind-admin-dashboard-main/agent-transcripts/dd03ed8d-829e-454a-ba12-994a3736036d'

const transcriptFiles = [
  path.join(transcriptDir, 'dd03ed8d-829e-454a-ba12-994a3736036d.jsonl'),
  path.join(transcriptDir, 'subagents', 'cdf52944-4b35-40ba-b763-6ac82656240c.jsonl'),
]

const files = new Map()

function normalizePath(p) {
  if (!p) return null
  const normalized = p.replace(/\\/g, '/')
  const marker = '/vue-tailwind-admin-dashboard-main/'
  const idx = normalized.toLowerCase().indexOf(marker)
  if (idx === -1) return null
  return normalized.slice(idx + marker.length)
}

function ensureParent(relPath) {
  const full = path.join(projectRoot, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  return full
}

function applyOps(lines, sourceName) {
  let count = { write: 0, replace: 0, skipped: 0 }

  for (const line of lines) {
    if (!line.trim()) continue
    let row
    try {
      row = JSON.parse(line)
    } catch {
      continue
    }

    const content = row.message?.content
    if (!Array.isArray(content)) continue

    for (const item of content) {
      if (item.type !== 'tool_use') continue
      const tool = item.name
      const input = item.input || {}

      if (tool === 'Write') {
        const rel = normalizePath(input.path)
        if (!rel || !rel.startsWith('src/')) {
          count.skipped++
          continue
        }
        if (typeof input.contents !== 'string') continue
        files.set(rel, input.contents)
        count.write++
      }

      if (tool === 'StrReplace') {
        const rel = normalizePath(input.path)
        if (!rel || !rel.startsWith('src/')) {
          count.skipped++
          continue
        }
        const oldStr = input.old_string
        const newStr = input.new_string
        if (typeof oldStr !== 'string' || typeof newStr !== 'string') continue

        let current = files.get(rel)
        if (current === undefined) {
          const full = path.join(projectRoot, rel)
          if (fs.existsSync(full)) {
            current = fs.readFileSync(full, 'utf8')
          } else {
            count.skipped++
            continue
          }
        }

        if (!current.includes(oldStr)) {
          count.skipped++
          continue
        }

        files.set(rel, current.replace(oldStr, newStr))
        count.replace++
      }
    }
  }

  console.log(`Processed ${sourceName}: writes=${count.write}, replaces=${count.replace}, skipped=${count.skipped}`)
}

for (const tf of transcriptFiles) {
  if (!fs.existsSync(tf)) {
    console.warn('Missing transcript:', tf)
    continue
  }
  const lines = fs.readFileSync(tf, 'utf8').split('\n')
  applyOps(lines, path.basename(tf))
}

let written = 0
for (const [rel, content] of files.entries()) {
  const full = ensureParent(rel)
  fs.writeFileSync(full, content, 'utf8')
  written++
}

console.log(`\nRestored ${written} files to ${projectRoot}`)
console.log('Files:')
for (const rel of [...files.keys()].sort()) {
  console.log(' -', rel)
}
