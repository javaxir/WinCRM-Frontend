import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const BASE = 'http://localhost:5173'
const USER = process.env.WINCRM_USER || 'admin'
const PASS = process.env.WINCRM_PASS || ''
const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const outDir = path.resolve('tmp-ui-test')
fs.mkdirSync(outDir, { recursive: true })

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log('SHOT', file)
}

async function setVueInput(page, selector, value) {
  await page.evaluate(
    ({ selector, value }) => {
      const el = document.querySelector(selector)
      if (!el) throw new Error('Missing ' + selector)
      const proto =
        el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      const desc = Object.getOwnPropertyDescriptor(proto, 'value')
      desc?.set?.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { selector, value },
  )
}

async function setVueSelectByIndex(page, formSelectIndex, value) {
  await page.evaluate(
    ({ formSelectIndex, value }) => {
      const forms = Array.from(document.querySelectorAll('form'))
      const form = forms[forms.length - 1]
      const sel = form?.querySelectorAll('select')?.[formSelectIndex]
      if (!sel) throw new Error('select missing at ' + formSelectIndex)
      sel.value = String(value)
      sel.dispatchEvent(new Event('input', { bubbles: true }))
      sel.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { formSelectIndex, value },
  )
}

async function clickCreateByTitle(page, hints) {
  const ok = await page.evaluate((hints) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const btn = buttons.find((b) => {
      const t = (b.getAttribute('title') || b.getAttribute('aria-label') || '').toLowerCase()
      return hints.some((h) => t.includes(h.toLowerCase()))
    })
    if (!btn) return false
    btn.click()
    return true
  }, hints)
  if (!ok) throw new Error('Create button not found for ' + hints.join('|'))
}

async function main() {
  if (!PASS) throw new Error('WINCRM_PASS required')

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(30000)
  const apiLog = []
  page.on('response', async (res) => {
    const url = res.url()
    if (!url.includes('/api/')) return
    if (!/warehouses|clients|users|sale-orders/.test(url)) return
    let snippet = ''
    try {
      snippet = (await res.text()).slice(0, 180)
    } catch {}
    apiLog.push({ status: res.status(), method: res.request().method(), url: url.replace(/^https?:\/\/[^/]+/, ''), snippet })
  })

  try {
    console.log('1) Login...')
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0', timeout: 45000 })
    await page.waitForSelector('#username', { timeout: 20000 })
    await page.click('#username', { clickCount: 3 })
    await page.type('#username', USER, { delay: 10 })
    await page.click('#password', { clickCount: 3 })
    await page.type('#password', PASS, { delay: 10 })
    await page.click('button[type="submit"]')
    await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 30000 })
    await new Promise((r) => setTimeout(r, 500))
    if (page.url().includes('/login')) {
      const err = await page.evaluate(() => document.body?.innerText?.slice(0, 400) || '')
      await shot(page, '01-login-fail')
      throw new Error('Login failed. body=' + err.replace(/\s+/g, ' ').slice(0, 300))
    }
    console.log('   OK ->', page.url())
    await shot(page, '01-after-login')

    console.log('2) Ensure warehouse exists...')
    await page.goto(`${BASE}/warehouses`, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 800))
    const hasWarehouse = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'))
      return rows.some((tr) => !/Topilmadi|Yuklanmoqda|Не найдено|Loading/i.test(tr.textContent || ''))
    })
    if (!hasWarehouse) {
      console.log('   creating warehouse via UI...')
      await clickCreateByTitle(page, ['yangi ombor', 'новый склад', 'new warehouse'])
      await page.waitForFunction(() => document.body.innerText.includes('Yangi ombor'), { timeout: 10000 })
      const whName = `UI-test ombor ${Date.now()}`
      await setVueInput(page, 'form input[type="text"]', whName)
      const [whResp] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/warehouses') && r.request().method() === 'POST',
          { timeout: 20000 },
        ),
        page.click('form button[type="submit"]'),
      ])
      console.log('   warehouse create status=', whResp.status())
      if (whResp.status() >= 400) throw new Error('Warehouse create failed: ' + (await whResp.text()).slice(0, 200))
      await new Promise((r) => setTimeout(r, 1000))
      await shot(page, '02-warehouse-created')
    } else {
      console.log('   warehouse already exists')
      await shot(page, '02-warehouse-exists')
    }

    console.log('3) Open sale orders + create...')
    await page.goto(`${BASE}/sale-orders`, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 1000))
    await clickCreateByTitle(page, ['yangi buyurtma', 'новый заказ', 'new order'])
    await page.waitForFunction(() => document.body.innerText.includes('Yangi sotuv buyurtmasi'), {
      timeout: 10000,
    })
    await page.waitForFunction(() => {
      const forms = document.querySelectorAll('form')
      const form = forms[forms.length - 1]
      const wh = form?.querySelectorAll('select')?.[1]
      return !!wh && Array.from(wh.options).some((o) => o.value && o.value !== '0')
    }, { timeout: 15000 })
    await shot(page, '03-create-modal')

    const whValue = await page.evaluate(() => {
      const forms = document.querySelectorAll('form')
      const form = forms[forms.length - 1]
      const wh = form?.querySelectorAll('select')?.[1]
      const opt = Array.from(wh?.options || []).find((o) => o.value && o.value !== '0')
      return opt?.value || ''
    })
    if (!whValue) throw new Error('Warehouse still empty after create')
    await setVueSelectByIndex(page, 1, whValue)
    // seller = Super Admin if present
    await setVueSelectByIndex(page, 2, '1')

    const now = new Date()
    const p = (n) => String(n).padStart(2, '0')
    const local = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`
    await setVueInput(page, 'input[type="datetime-local"]', local)
    await setVueInput(page, 'form input[type="number"]', '1000')
    const marker = `UI-test ${now.toISOString()}`
    await setVueInput(page, 'form textarea', marker)
    console.log('   warehouseId=', whValue, 'marker=', marker)

    console.log('4) Submit sale order...')
    const [createResp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/sale-orders/create') && r.request().method() === 'POST',
        { timeout: 25000 },
      ),
      page.click('form button[type="submit"]'),
    ])
    const status = createResp.status()
    const bodyText = await createResp.text()
    console.log('   create status=', status)
    console.log('   create body=', bodyText.slice(0, 400))
    if (status >= 400) {
      await shot(page, '04-create-error')
      throw new Error(`Create failed HTTP ${status}`)
    }

    await new Promise((r) => setTimeout(r, 1500))
    // broaden date filter: click reset then maybe clear won't help if default today
    // navigate without date constraint by resetting filters
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const reset = buttons.find((b) => {
        const t = (b.getAttribute('title') || b.getAttribute('aria-label') || '').toLowerCase()
        return t.includes('tozalash') || t.includes('reset') || t.includes('сброс')
      })
      reset?.click()
    })
    await new Promise((r) => setTimeout(r, 1500))
    await shot(page, '05-after-create')

    const pageText = await page.evaluate(() => document.body.innerText)
    const hasMarker = pageText.includes(marker) || pageText.includes('NEW') || /\b#?\d+\b/.test(pageText)
    console.log('   page contains marker:', pageText.includes(marker))
    console.log('SUCCESS: sale order create UI flow completed')
    console.log('API creates:', JSON.stringify(apiLog.filter((x) => x.method === 'POST'), null, 2))
  } catch (e) {
    console.log('API log:', JSON.stringify(apiLog.slice(-12), null, 2))
    await shot(page, '99-failure').catch(() => {})
    console.error('FAIL:', e?.message || e)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
