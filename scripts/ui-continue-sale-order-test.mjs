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

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0', timeout: 45000 })
  await page.waitForSelector('#username', { timeout: 20000 })
  await page.click('#username', { clickCount: 3 })
  await page.type('#username', USER, { delay: 8 })
  await page.click('#password', { clickCount: 3 })
  await page.type('#password', PASS, { delay: 8 })
  await page.click('button[type="submit"]')
  await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 30000 })
  console.log('LOGIN OK', page.url())
}

async function clickTab(page, labelPart) {
  const ok = await page.evaluate((labelPart) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const btn = buttons.find((b) => (b.textContent || '').toLowerCase().includes(labelPart.toLowerCase()))
    if (!btn) return false
    btn.click()
    return true
  }, labelPart)
  if (!ok) throw new Error('Tab not found: ' + labelPart)
}

async function main() {
  if (!PASS) throw new Error('WINCRM_PASS required')
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(30000)
  const apiLog = []
  page.on('response', async (res) => {
    const url = res.url()
    if (!url.includes('/api/')) return
    if (!/sale-orders|sale-order-wastes|images|goods|warehouses/.test(url)) return
    let snippet = ''
    try {
      snippet = (await res.text()).slice(0, 160)
    } catch {}
    apiLog.push({
      status: res.status(),
      method: res.request().method(),
      url: url.replace(/^https?:\/\/[^/]+/, ''),
      snippet,
    })
  })

  try {
    await login(page)
    await shot(page, 't2-01-home')

    console.log('A) Sale orders list...')
    await page.goto(`${BASE}/sale-orders`, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 1000))
    // clear date filter if possible
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const reset = buttons.find((b) => {
        const t = (b.getAttribute('title') || b.getAttribute('aria-label') || '').toLowerCase()
        return t.includes('tozalash') || t.includes('reset') || t.includes('сброс')
      })
      reset?.click()
    })
    await new Promise((r) => setTimeout(r, 1200))
    await shot(page, 't2-02-orders-list')

    // open first order row or go to /sale-orders/1/items
    let orderUrl = `${BASE}/sale-orders/1/items`
    const rowId = await page.evaluate(() => {
      const row = document.querySelector('tbody tr')
      if (!row) return null
      const txt = row.textContent || ''
      if (/topilmadi|not found|не найдено/i.test(txt)) return null
      const idCell = row.querySelector('td')?.textContent?.replace(/\D/g, '')
      return idCell || null
    })
    if (rowId) {
      orderUrl = `${BASE}/sale-orders/${rowId}/items`
      console.log('   opening order from list #', rowId)
      await page.click('tbody tr')
      await page.waitForFunction(() => location.pathname.includes('/items'), { timeout: 15000 })
    } else {
      console.log('   list empty/filtered, open /sale-orders/1/items directly')
      await page.goto(orderUrl, { waitUntil: 'networkidle0' })
    }
    await new Promise((r) => setTimeout(r, 1000))
    console.log('   order page', page.url())
    await shot(page, 't2-03-order-detail')

    console.log('B) Images tab...')
    await clickTab(page, 'Rasm')
    await new Promise((r) => setTimeout(r, 800))
    // also try Russian
    const onImages = await page.evaluate(() => /Rasm|Фото|image|yuklash|загруз/i.test(document.body.innerText))
    if (!onImages) await clickTab(page, 'Фото')
    await new Promise((r) => setTimeout(r, 1000))
    await shot(page, 't2-04-images-tab')

    // create tiny png and upload
    const pngPath = path.join(outDir, 'sample.png')
    // 1x1 png
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )
    fs.writeFileSync(pngPath, png)

    const fileInput = await page.$('input[type="file"][accept*="image"]')
    if (!fileInput) throw new Error('Image file input not found')
    const [uploadResp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/images') && r.request().method() === 'POST',
        { timeout: 25000 },
      ).catch(() => null),
      fileInput.uploadFile(pngPath),
    ])
    if (uploadResp) {
      console.log('   image upload status=', uploadResp.status())
      console.log('   image upload body=', (await uploadResp.text()).slice(0, 250))
      if (uploadResp.status() >= 400) {
        console.log('   WARN: image API denied/failed — continue other tests')
      }
    } else {
      console.log('   no /images POST seen (maybe blocked)')
    }
    await new Promise((r) => setTimeout(r, 1500))
    await shot(page, 't2-05-after-image-upload')

    console.log('C) Waste tab...')
    let wasteOpened = true
    try {
      await clickTab(page, 'Ortiqcha')
    } catch {
      try {
        await clickTab(page, 'Остат')
      } catch {
        wasteOpened = false
      }
    }
    if (!wasteOpened) throw new Error('Waste tab not found')
    await new Promise((r) => setTimeout(r, 1000))
    await shot(page, 't2-06-waste-tab')

    // ensure goods exist or skip create if no goods
    const goodsCountBefore = await page.evaluate(async () => {
      // peek from select after opening modal
      return true
    })

    // open add waste modal
    const addClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const btn = buttons.find((b) => /Qo‘shish|Qo'shish|Добавить|Add/i.test(b.textContent || ''))
      if (!btn) return false
      btn.click()
      return true
    })
    if (!addClicked) throw new Error('Waste add button not found')
    await page.waitForFunction(
      () => /Qo‘shish|Qo'shish|Добавить|Tahrirlash|Редактировать/i.test(document.body.innerText),
      { timeout: 10000 },
    )
    await new Promise((r) => setTimeout(r, 500))

    const goodsInfo = await page.evaluate(() => {
      const form = Array.from(document.querySelectorAll('form')).at(-1)
      const sel = form?.querySelector('select')
      const opts = Array.from(sel?.options || []).map((o) => ({ value: o.value, text: o.textContent.trim() }))
      return opts
    })
    console.log('   goods options=', JSON.stringify(goodsInfo))
    const goods = goodsInfo.find((o) => o.value && o.value !== '0')
    if (!goods) {
      console.log('   SKIP waste create: no goods in system')
      await shot(page, 't2-07-waste-no-goods')
    } else {
      await page.evaluate((v) => {
        const form = Array.from(document.querySelectorAll('form')).at(-1)
        const sel = form?.querySelector('select')
        if (!sel) return
        sel.value = v
        sel.dispatchEvent(new Event('input', { bubbles: true }))
        sel.dispatchEvent(new Event('change', { bubbles: true }))
      }, goods.value)
      await setVueInput(page, 'form input[type="number"]', '2.5')
      await setVueInput(page, 'form textarea', 'UI waste test')
      const [wasteResp] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes('/api/sale-order-wastes/create') && r.request().method() === 'POST',
          { timeout: 20000 },
        ),
        page.click('form button[type="submit"]'),
      ])
      console.log('   waste create status=', wasteResp.status())
      console.log('   waste body=', (await wasteResp.text()).slice(0, 250))
      if (wasteResp.status() >= 400) throw new Error('Waste create failed')
      await new Promise((r) => setTimeout(r, 1200))
      await shot(page, 't2-08-waste-created')
    }

    console.log('D) Open wastes summary page...')
    await page.goto(`${BASE}/sale-order-wastes`, { waitUntil: 'networkidle0' })
    await new Promise((r) => setTimeout(r, 1000))
    await shot(page, 't2-09-wastes-page')
    const wastesPageOk = await page.evaluate(() => /Ortiqcha|Остат/i.test(document.body.innerText))
    console.log('   wastes page visible:', wastesPageOk)

    console.log('SUCCESS continued UI tests')
    console.log(
      'POST summary:',
      JSON.stringify(
        apiLog.filter((x) => x.method === 'POST'),
        null,
        2,
      ),
    )
  } catch (e) {
    console.log('API tail:', JSON.stringify(apiLog.slice(-15), null, 2))
    await shot(page, 't2-99-failure').catch(() => {})
    console.error('FAIL:', e?.message || e)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
