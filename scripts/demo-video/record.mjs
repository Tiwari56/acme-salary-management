// Records the ACME Pay product demo with Playwright.
//
// Playwright videos have no cursor and no audio, so this script injects a visible cursor and a
// caption bar, and can optionally add a voiceover built from the same caption text with macOS
// `say`, timed to when each caption appeared. Output: output/acme-pay-demo.mp4
//
//   npm install && npx playwright-core install ffmpeg   # once; uses your installed Google Chrome
//   node record.mjs                                     # against production, captions only
//   BASE_URL=http://localhost:4173 node record.mjs      # against a local build
//   VOICE=Samantha node record.mjs                      # add a voiceover (macOS only)
//
// The demo edits data (gives one employee a raise, adds and deletes another), so re-seed the
// database afterwards to restore the original state.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import ffmpegPath from 'ffmpeg-static'
import { chromium } from 'playwright-core'

const BASE = (process.env.BASE_URL ?? 'https://acme-salary-management-amber.vercel.app').replace(/\/$/, '')
const LIVE_URL = 'https://acme-salary-management-amber.vercel.app'
const REPO = 'https://github.com/Tiwari56/acme-salary-management'
const VOICE = process.env.VOICE ?? 'none'
const OUT = join(import.meta.dirname, 'output')
const AUDIO = join(OUT, 'audio')
const SIZE = { width: 1440, height: 900 }

// Demo data (deterministic seed, see backend/app/seed.py).
const PRIYA = { code: 'EMP002386', salary: 5_858_200, raise: '6200000' }
const DEMO_EMAIL = 'demo.candidate@acme.example'

// ---------------------------------------------------------------- narration

const SCRIPT = {
  intro:
    "This is ACME Pay, salary management for ACME's HR team: ten thousand employees across eight countries, built with FastAPI, Postgres and React.",
  directory: 'The employee directory. All ten thousand employees are searched, filtered and paged on the server.',
  search: 'Search matches every word, across name, email and employee code.',
  filters: 'Filter by country, and by department.',
  sort: 'Sorting by salary uses the U.S. dollar equivalent, so mixed currencies still order correctly.',
  salaryCell: 'Salaries are shown in local currency, with the dollar equivalent underneath.',
  openRow: 'Opening an employee shows their details and full salary history.',
  edit: "Let's give Priya a raise.",
  reasonFields: 'Changing a salary reveals two required fields: a reason, and an effective date.',
  blocked: 'Saving without a reason is blocked. Every salary change needs an audit trail.',
  saved: 'With a reason, the change is saved,',
  history: 'and it appears in her history, with the percentage change.',
  add: 'Adding an employee. Job titles come from a fixed catalog for each department, which keeps reports consistent.',
  added: 'The new hire is paid in euros, with the dollar equivalent alongside.',
  delete: 'Deleting asks for confirmation first.',
  insights: 'The insights page answers how ACME pays people.',
  tiles: "Mean pay is above the median, so pay is right-skewed, and the median is the better measure of what's typical.",
  countries: 'Pay by country, in local currency and in dollars, sorted by total payroll.',
  charts: 'Median salary by department, and the overall salary distribution.',
  scope: 'Every view can be scoped to a single country.',
  bands: 'Within a country, pay by job title shows the minimum, median and maximum: the view HR uses to set pay bands.',
  repo: 'The code, documentation and tests are on GitHub.',
  requirements: 'A one-page requirements document came first, including what was deliberately left out, and why.',
  aiUsage: 'The AI usage log records how AI tools were used, and the problems that testing caught in their output.',
  commits: 'The commit history shows how the solution evolved, with CI checks on every push.',
  outro: 'Thanks for watching.',
}

/** Pre-render each line with macOS `say` so we know its duration before recording. */
function prepareNarration() {
  const clips = {}
  if (VOICE === 'none') return clips
  mkdirSync(AUDIO, { recursive: true })
  for (const [key, text] of Object.entries(SCRIPT)) {
    const file = join(AUDIO, `${key}.aiff`)
    execFileSync('say', ['-v', VOICE, '-r', '178', '-o', file, text])
    const info = execFileSync('afinfo', [file]).toString()
    const seconds = Number(/estimated duration: ([\d.]+)/.exec(info)?.[1] ?? 3)
    clips[key] = { file, seconds }
  }
  return clips
}

// ---------------------------------------------------------------- page overlay

// Injected into every page: a cursor dot, a caption bar and a full-screen title card.
const OVERLAY = () => {
  const install = () => {
    if (document.getElementById('__demo_cursor')) return
    const style = document.createElement('style')
    style.textContent = `
      #__demo_cursor { position: fixed; z-index: 2147483647; width: 22px; height: 22px; margin: -11px 0 0 -11px;
        border-radius: 50%; background: rgba(42,120,214,.35); border: 2px solid #2a78d6; pointer-events: none;
        left: 50vw; top: 50vh; transition: left .55s cubic-bezier(.4,0,.2,1), top .55s cubic-bezier(.4,0,.2,1); }
      #__demo_cursor.click { animation: __demo_click .35s ease-out; }
      @keyframes __demo_click { 0% { transform: scale(1) } 50% { transform: scale(.6) } 100% { transform: scale(1) } }
      #__demo_caption { position: fixed; z-index: 2147483646; left: 50%; bottom: 28px; transform: translateX(-50%);
        max-width: 78%; padding: 12px 22px; border-radius: 12px; background: rgba(15,15,15,.86); color: #fff;
        font: 500 21px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-align: center;
        box-shadow: 0 6px 24px rgba(0,0,0,.25); pointer-events: none; transition: opacity .25s; opacity: 0; }
      /* Text lives in a pseudo-element so it never matches the demo's own getByText() lookups. */
      #__demo_caption::after { content: attr(data-text); }
      #__demo_card { position: fixed; inset: 0; z-index: 2147483645; display: none; align-items: center;
        justify-content: center; flex-direction: column; gap: 14px; background: #0f1115; color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; text-align: center; }
      #__demo_card h1 { font-size: 56px; margin: 0; letter-spacing: -.02em; }
      #__demo_card p { margin: 0; font-size: 22px; color: #c3c2b7; }
      #__demo_card code { font-size: 20px; color: #7fb3f0; }`
    document.head.appendChild(style)
    for (const id of ['__demo_cursor', '__demo_caption', '__demo_card']) {
      const el = document.createElement('div')
      el.id = id
      document.body.appendChild(el)
    }
  }
  if (document.body) install()
  else document.addEventListener('DOMContentLoaded', install)
}

// ---------------------------------------------------------------- demo helpers

class Demo {
  constructor(page, clips) {
    this.page = page
    this.clips = clips
    this.t0 = Date.now()
    this.narrationEnd = 0 // ms since t0 when the current line finishes
    this.timeline = [] // [{ key, at }] for the audio track
  }

  pause = (ms) => this.page.waitForTimeout(ms)

  /** Show a caption and start its narration; waits for the previous line to finish first. */
  async say(key) {
    const wait = this.narrationEnd - (Date.now() - this.t0)
    if (wait > 0) await this.pause(wait)
    await this.page.evaluate((text) => {
      const el = document.getElementById('__demo_caption')
      if (!el) return
      el.dataset.text = text
      el.style.opacity = '1'
    }, SCRIPT[key])
    const at = Date.now() - this.t0
    const seconds = this.clips[key]?.seconds ?? Math.max(2.5, SCRIPT[key].split(' ').length / 2.8)
    this.timeline.push({ key, at })
    this.narrationEnd = at + seconds * 1000 + 350
  }

  /** Wait until the current narration line has finished. */
  async settle(extra = 300) {
    const wait = this.narrationEnd - (Date.now() - this.t0)
    await this.pause(Math.max(wait, 0) + extra)
  }

  async card(html) {
    await this.page.evaluate((h) => {
      const el = document.getElementById('__demo_card')
      el.innerHTML = h
      el.style.display = 'flex'
    }, html)
  }

  async hideCard() {
    await this.page.evaluate(() => {
      const el = document.getElementById('__demo_card')
      el.style.display = 'none'
      el.innerHTML = ''
    })
  }

  async moveTo(locator) {
    await locator.waitFor({ state: 'visible' })
    await locator.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }))
    await this.pause(450)
    const box = await locator.boundingBox()
    await this.page.evaluate(({ x, y }) => {
      const c = document.getElementById('__demo_cursor')
      c.style.left = `${x}px`
      c.style.top = `${y}px`
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
    await this.pause(650)
  }

  async click(locator) {
    await this.moveTo(locator)
    await this.page.evaluate(() => {
      const c = document.getElementById('__demo_cursor')
      c.classList.remove('click')
      void c.offsetWidth
      c.classList.add('click')
    })
    await locator.click()
    await this.pause(350)
  }

  async type(locator, text, { clear = false } = {}) {
    await this.click(locator)
    if (clear) await this.page.keyboard.press('ControlOrMeta+A')
    await locator.pressSequentially(text, { delay: 70 })
    await this.pause(400)
  }

  /** Mantine Select: target the combobox (its listbox shares the same aria-label). */
  async choose(locator, option) {
    await this.click(locator)
    await this.click(this.page.getByRole('option', { name: option, exact: true }))
  }

  async scrollTo(locator) {
    await locator.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'smooth' }))
    await this.pause(900)
  }

  async scrollBy(dy) {
    await this.page.evaluate((y) => window.scrollBy({ top: y, behavior: 'smooth' }), dy)
    await this.pause(900)
  }
}

// ---------------------------------------------------------------- preflight

async function api(path, init) {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok && res.status !== 204) throw new Error(`${init?.method ?? 'GET'} ${path} -> ${res.status}`)
  return res.status === 204 ? null : res.json()
}

async function preflight() {
  const [priya] = (await api(`/api/employees?q=${PRIYA.code}`)).items
  if (!priya || priya.salary !== PRIYA.salary) {
    throw new Error(
      `${PRIYA.code} salary is ${priya?.salary}, expected ${PRIYA.salary}. Re-seed the database first.`,
    )
  }
  for (const e of (await api(`/api/employees?q=${encodeURIComponent(DEMO_EMAIL)}`)).items) {
    await api(`/api/employees/${e.id}`, { method: 'DELETE' }) // leftover from an aborted run
  }
}

// ---------------------------------------------------------------- the demo

async function run(demo) {
  const { page } = demo

  // Title card
  await page.goto(`${BASE}/employees`)
  await demo.card(`<h1>ACME Pay</h1><p>Salary management for ACME's HR team</p>
    <p>10,000 employees · 8 countries · FastAPI + Postgres + React</p><code>${LIVE_URL}</code>`)
  await demo.say('intro')
  await demo.settle(200)
  await demo.hideCard()

  // Directory, search, filters, sort
  await demo.say('directory')
  await demo.moveTo(page.getByText(/10,000 total/))
  await demo.settle()

  await demo.say('search')
  await demo.type(page.getByLabel('Search employees'), 'priya sharma')
  await demo.settle()

  await demo.say('filters')
  await demo.choose(page.getByRole('combobox', { name: 'Filter by country' }), 'India (INR)')
  await demo.choose(page.getByRole('combobox', { name: 'Filter by department' }), 'Engineering')
  await demo.settle()

  await demo.say('sort')
  await demo.click(page.getByRole('button', { name: 'Sort by Salary' }))
  const priyaRow = page.getByRole('row').filter({ hasText: PRIYA.code })
  await priyaRow.waitFor()
  await demo.settle()

  await demo.say('salaryCell')
  await demo.moveTo(priyaRow.getByText('₹58,58,200'))
  await demo.settle()

  // Salary change with audit trail
  await demo.say('openRow')
  await demo.click(priyaRow.getByText('Priya Sharma'))
  await page.getByText('Salary history').waitFor()
  await demo.settle(700)

  await demo.say('edit')
  await demo.click(page.getByRole('button', { name: 'Edit employee' }))
  const modal = page.getByRole('dialog', { name: /Edit Priya Sharma/ })
  await demo.type(modal.getByLabel(/Annual salary/), PRIYA.raise, { clear: true })
  await demo.settle()

  await demo.say('reasonFields')
  await demo.moveTo(modal.getByLabel(/Reason for salary change/))
  await demo.moveTo(modal.getByLabel(/Effective date/))
  await demo.settle()

  await demo.say('blocked')
  await demo.click(modal.getByRole('button', { name: 'Save changes' }))
  await demo.moveTo(modal.getByText('Required for audit trail'))
  await demo.settle()

  await demo.say('saved')
  await demo.type(modal.getByLabel(/Reason for salary change/), 'Annual review')
  await demo.click(modal.getByRole('button', { name: 'Save changes' }))
  await modal.waitFor({ state: 'hidden' })
  await demo.settle(0)

  await demo.say('history')
  await demo.click(priyaRow.getByText('Priya Sharma'))
  const badge = page.getByText('+5.8%')
  await demo.moveTo(badge)
  await demo.settle(800)
  await page.keyboard.press('Escape')

  // Add and delete an employee
  await page.goto(`${BASE}/employees`)
  await demo.say('add')
  await demo.click(page.getByRole('button', { name: 'Add employee' }).first())
  const form = page.getByRole('dialog', { name: 'Add employee' })
  await demo.type(form.getByLabel('First name'), 'Demo')
  await demo.type(form.getByLabel('Last name'), 'Candidate')
  await demo.type(form.getByLabel('Work email'), DEMO_EMAIL)
  await demo.choose(form.getByRole('combobox', { name: /^Department/ }), 'Engineering')
  await demo.choose(form.getByRole('combobox', { name: /^Job title/ }), 'Software Engineer')
  await demo.choose(form.getByRole('combobox', { name: /^Country/ }), 'Germany (EUR)')
  await demo.type(form.getByLabel(/Annual salary/), '75000')
  await demo.settle()
  await demo.click(form.getByRole('button', { name: 'Add employee' }))
  await form.waitFor({ state: 'hidden' })

  await demo.say('added')
  await demo.type(page.getByLabel('Search employees'), 'demo candidate')
  const demoRow = page.getByRole('row').filter({ hasText: 'Demo Candidate' })
  await demo.moveTo(demoRow.getByText('€75,000'))
  await demo.settle()

  await demo.say('delete')
  await demo.click(page.getByRole('button', { name: 'Delete Demo Candidate' }))
  await demo.click(page.getByRole('button', { name: 'Delete', exact: true }))
  await page.getByText('No employees match these filters.').waitFor()
  await demo.settle()

  // Insights
  await demo.say('insights')
  await demo.click(page.getByText('Pay insights', { exact: true }).first())
  await page.getByText('Median salary', { exact: true }).waitFor()
  await demo.settle()

  await demo.say('tiles')
  await demo.moveTo(page.getByText('Median salary', { exact: true }))
  await demo.moveTo(page.getByText('Above median: pay is right-skewed'))
  await demo.settle()

  await demo.say('countries')
  await demo.moveTo(page.getByRole('heading', { name: 'Pay by country' }))
  await demo.moveTo(page.getByRole('cell', { name: 'India' }))
  await demo.settle()

  await demo.say('charts')
  await demo.scrollTo(page.getByRole('heading', { name: 'Median salary by department' }))
  await demo.moveTo(page.getByRole('heading', { name: 'Salary distribution' }))
  await demo.settle()

  await demo.say('scope')
  await demo.scrollBy(-2000)
  await demo.choose(page.getByRole('combobox', { name: 'Scope insights to a country' }), 'India (INR)')
  await demo.settle()

  await demo.say('bands')
  await demo.scrollTo(page.getByRole('heading', { name: 'Pay by job title' }))
  await demo.moveTo(page.getByRole('cell', { name: 'Engineering Manager' }))
  await demo.settle(800)

  // Repository
  await page.goto(REPO)
  await demo.say('repo')
  await demo.scrollTo(page.locator('article').first())
  await demo.scrollBy(500)
  await demo.settle()

  await page.goto(`${REPO}/blob/main/docs/REQUIREMENTS.md`)
  await demo.say('requirements')
  await demo.scrollTo(page.getByRole('heading', { name: /Deliberately out of scope/ }))
  await demo.settle(600)

  await page.goto(`${REPO}/blob/main/docs/AI_USAGE.md`)
  await demo.say('aiUsage')
  await demo.scrollTo(page.getByRole('heading', { name: /Where AI output was wrong/ }))
  await demo.settle(600)

  await page.goto(`${REPO}/commits/main`)
  await demo.say('commits')
  await demo.scrollBy(400)
  await demo.settle(600)

  // End card
  await demo.card(`<h1>ACME Pay</h1><p>Live: <code>${LIVE_URL}</code></p>
    <p>Code: <code>${REPO}</code></p><p style="font-size:16px;margin-top:18px">
    Demo recorded automatically with a Playwright script (scripts/demo-video)</p>`)
  await demo.say('outro')
  await demo.settle(1200)
}

// ---------------------------------------------------------------- main

async function main() {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
  await preflight()
  const clips = prepareNarration()

  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({
    viewport: SIZE,
    colorScheme: 'light',
    bypassCSP: true, // GitHub's CSP would otherwise block the injected overlay styles
    recordVideo: { dir: OUT, size: SIZE },
  })
  await context.addInitScript(OVERLAY)
  const page = await context.newPage()
  page.setDefaultTimeout(20_000)
  const demo = new Demo(page, clips)

  try {
    await run(demo)
  } finally {
    await context.close() // flushes the video
    await browser.close()
  }

  const webm = readdirSync(OUT).find((f) => f.endsWith('.webm'))
  const raw = join(OUT, 'raw.webm')
  renameSync(join(OUT, webm), raw)
  writeFileSync(join(OUT, 'timeline.json'), JSON.stringify(demo.timeline, null, 2))
  encode(raw, demo.timeline, clips)
}

/** webm -> H.264 mp4, mixing each narration clip in at the moment its caption appeared. */
function encode(raw, timeline, clips) {
  const out = join(OUT, 'acme-pay-demo.mp4')
  const voiced = timeline.filter((t) => clips[t.key])
  const args = ['-y', '-loglevel', 'error', '-i', raw]
  for (const t of voiced) args.push('-i', clips[t.key].file)
  if (voiced.length) {
    const delays = voiced.map((t, i) => `[${i + 1}:a]adelay=${t.at}|${t.at}[a${i}]`).join(';')
    const inputs = voiced.map((_, i) => `[a${i}]`).join('')
    args.push(
      '-filter_complex', `${delays};${inputs}amix=inputs=${voiced.length}:normalize=0[aout]`,
      '-map', '0:v', '-map', '[aout]', '-c:a', 'aac', '-b:a', '160k',
    )
  }
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-shortest', out)
  execFileSync(ffmpegPath, args, { stdio: 'inherit' })
  if (!existsSync(out)) throw new Error('encoding failed')
  console.log(`Demo video: ${out}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
