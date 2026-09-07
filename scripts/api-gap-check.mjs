import fs from 'fs'
import path from 'path'

const apiPath =
  'C:/Users/Javaxir/.cursor/projects/c-Users-Javaxir-Desktop-vue-tailwind-admin-dashboard-main/agent-tools/3181c5aa-4c75-4c1a-afd9-9e11b3002bfe.txt'
const srcRoot = 'C:/Users/Javaxir/Desktop/vue-tailwind-admin-dashboard-main/src'
const outPath =
  'C:/Users/Javaxir/.cursor/projects/c-Users-Javaxir-Desktop-vue-tailwind-admin-dashboard-main/agent-tools/api-gap-report.json'

const d = JSON.parse(fs.readFileSync(apiPath, 'utf8'))

const apiEndpoints = []
for (const [p, ops] of Object.entries(d.paths || {})) {
  for (const [method, op] of Object.entries(ops)) {
    if (!op || typeof op !== 'object') continue
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue
    apiEndpoints.push({
      method: method.toUpperCase(),
      path: p,
      tag: (op.tags && op.tags[0]) || 'untagged',
      summary: op.summary || op.operationId || '',
      description: op.description || '',
    })
  }
}

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, acc)
    else if (/\.(ts|vue|js)$/.test(name)) acc.push(full)
  }
  return acc
}

const files = walk(srcRoot)
const fePaths = new Set()
const pathRegex = /[`'"](\/api\/[^`'"]+)[`'"]/g

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8')
  let m
  while ((m = pathRegex.exec(text))) {
    const normalized = m[1]
      .replace(/\$\{[^}]+\}/g, '{param}')
      .replace(/\?.*$/, '')
    fePaths.add(normalized)
  }
}

function normalize(p) {
  return p
    .replace(/\{[^}]+\}/g, '{param}')
    .replace(/\/+$/, '')
}

const feNorm = new Set([...fePaths].map(normalize))

function covered(apiPath) {
  const n = normalize(apiPath)
  if (feNorm.has(n)) return true
  for (const f of feNorm) {
    const a = n.split('/')
    const b = f.split('/')
    if (a.length !== b.length) continue
    let ok = true
    for (let i = 0; i < a.length; i++) {
      if (a[i] === '{param}' || b[i] === '{param}') continue
      if (a[i] !== b[i]) {
        ok = false
        break
      }
    }
    if (ok) return true
  }
  return false
}

const missingByTag = {}
const presentByTag = {}
let miss = 0
let present = 0

for (const e of apiEndpoints) {
  if (covered(e.path)) {
    present++
    ;(presentByTag[e.tag] ||= []).push(e)
  } else {
    miss++
    ;(missingByTag[e.tag] ||= []).push(e)
  }
}

const byTag = {}
for (const e of apiEndpoints) {
  ;(byTag[e.tag] ||= []).push(e)
}

const fullyMissing = []
const partial = []
const complete = []

for (const tag of Object.keys(byTag).sort()) {
  const total = byTag[tag].length
  const missC = (missingByTag[tag] || []).length
  const item = { tag, total, missing: missC, present: total - missC }
  if (missC === total) fullyMissing.push(item)
  else if (missC === 0) complete.push(item)
  else partial.push(item)
}

const report = {
  generatedAt: new Date().toISOString(),
  apiTotal: apiEndpoints.length,
  frontendCovered: present,
  missingApprox: miss,
  fullyMissingControllers: fullyMissing,
  partialControllers: partial.sort((a, b) => b.missing - a.missing),
  completeControllers: complete,
  missingByTag,
  frontendPaths: [...fePaths].sort(),
}

fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

console.log(`API total: ${apiEndpoints.length}`)
console.log(`Covered: ${present}`)
console.log(`Missing: ${miss}`)
console.log('\n=== TO\'LIQ YO\'Q CONTROLLERLAR ===')
for (const x of fullyMissing) {
  console.log(`\n## ${x.tag} (${x.total})`)
  for (const e of missingByTag[x.tag]) {
    console.log(`  - ${e.method.padEnd(6)} ${e.path}  // ${e.summary}`)
  }
}

console.log('\n=== QISMAN YO\'Q (faqat haqiqiy gaplar, false positive emas) ===')
// Re-check partials: print only endpoints still missing after better match
for (const x of partial) {
  if (x.missing === 0) continue
  console.log(`\n## ${x.tag} — missing ${x.missing}/${x.total}`)
  for (const e of missingByTag[x.tag]) {
    console.log(`  - ${e.method.padEnd(6)} ${e.path}  // ${e.summary}`)
  }
}

console.log('\nFrontend path count:', fePaths.size)
