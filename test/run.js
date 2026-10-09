// Loads an addon the way LX Music+ does and resolves one song with it:
//   node test/run.js addons/soundcloud.js sc <id> [page url]
// The YouTube addon needs yt-dlp on the PATH.
const fs = require('fs')
const { execFile } = require('child_process')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

const request = async(url, options = {}) => {
  const res = await fetch(url, { method: options.method || 'GET', headers: { 'User-Agent': UA, ...options.headers }, body: options.body })
  return { status: res.status, body: await res.text() }
}
const getText = async(url, options) => {
  const res = await request(url, options)
  if (res.status < 200 || res.status >= 300) throw new Error(`request failed: ${res.status}`)
  return res.body
}
const api = {
  apiVersion: 1,
  request,
  getText,
  getJson: async(url, options) => JSON.parse(await getText(url, options)),
  ytdlp: async(url, options) => new Promise((resolve, reject) => {
    execFile('yt-dlp', [...options, url], { maxBuffer: 64 * 1024 * 1024 }, (err, stdout) => { err ? reject(err) : resolve(stdout) })
  }),
  decodeHtml: text => text.replace(/&(#x?[0-9a-f]+|\w+);/gi, (match, code) => {
    if (/^#x/i.test(code)) return String.fromCodePoint(parseInt(code.slice(2), 16))
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10))
    return ENTITIES[code.toLowerCase()] ?? match
  }),
  log: (...args) => { console.log('[addon]', ...args) },
}

const [file, source, id, url = ''] = process.argv.slice(2)
const code = fs.readFileSync(file, 'utf8')
const mod = { exports: {} }
// eslint-disable-next-line no-new-func
new Function('module', 'exports', 'require', `'use strict';\n${code}\n`)(mod, mod.exports, () => { throw new Error('require is not available') })
const addon = mod.exports
if (!addon.sources.includes(source)) throw new Error(`${file} does not play ${source}`)
addon.resolve({ source, id, url, name: '', singer: '', albumName: '', interval: null, quality: process.env.QUALITY || '320k' }, api).then(stream => {
  console.log(stream.hls ? 'HLS' : 'file', stream.ext, stream.quality ?? '', stream.url.slice(0, 120))
}, err => {
  console.error('failed:', err.message)
  process.exitCode = 1
})
