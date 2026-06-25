// Builds the bundled sample book at public/books/kumo-no-ito.epub from its
// Aozora Bunko source. 芥川龍之介「蜘蛛の糸」(Akutagawa, d. 1927) is public
// domain, so the resulting epub is committed to the repo and ships with it.
//
// Run once (needs network) with:  node scripts/build-sample-epub.mjs
// It downloads the Shift_JIS source, strips Aozora-specific markup (keeping
// ruby/furigana — useful for N2 learners), splits the three sections into
// chapters, and zips a minimal EPUB 2 (NCX TOC, for broad epubjs support).

import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE = 'https://www.aozora.gr.jp/cards/000879/files/92_14545.html'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'books', 'kumo-no-ito.epub')
const UID = 'urn:uuid:aozora-kumo-no-ito-92'

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`Download failed: ${res.status}`)
const html = new TextDecoder('shift_jis').decode(await res.arrayBuffer())

const mainText = html.match(/<div class="main_text">([\s\S]*?)<\/div>\s*<div class="bibliographical_information">/)
if (!mainText) throw new Error('Could not locate main_text')
let body = mainText[1]

// Gaiji: the only one here is 1-87-71 = 犍 (the name 犍陀多, Kandata).
body = body.replace(/<img[^>]*1-87-71[^>]*\/?>/g, '犍')
body = body.replace(/<img[^>]*class="gaiji"[^>]*\/?>/g, '') // any stragglers

// Ruby: drop the <rp>（）</rp> paren fallbacks and unwrap <rb>, leaving valid
// EPUB3 ruby: <ruby>漢字<rt>かんじ</rt></ruby>.
body = body
  .replace(/<rp>[\s\S]*?<\/rp>/g, '')
  .replace(/<\/?rb>/g, '')

// Split on the three naka-midashi section headings (一 / 二 / 三).
const headingRe =
  /<div class="jisage_8"[^>]*><h4 class="naka-midashi"><a[^>]*>(.*?)<\/a><\/h4><\/div>/gs
const headings = [...body.matchAll(headingRe)]
const chapters = headings.map((m, i) => {
  const start = m.index + m[0].length
  const end = i + 1 < headings.length ? headings[i + 1].index : body.length
  return { label: stripTags(m[1]).trim(), html: toParagraphs(body.slice(start, end)) }
})

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '')
}

function toParagraphs(chunk) {
  return chunk
    .replace(/［＃[^］]*］/g, '') // editor annotations
    .replace(/<a [^>]*>|<\/a>|<\/?div[^>]*>|<\/?span[^>]*>/g, '')
    .split(/<br\s*\/?>/)
    .map((line) => line.replace(/^[\s　]+|[\s　]+$/g, ''))
    .filter((line) => line.length > 0)
    .map((line) => `    <p>　${line}</p>`)
    .join('\n')
}

function chapterDoc(label, inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>${label}</title>
  </head>
  <body>
    <h2>${label}</h2>
${inner}
  </body>
</html>
`
}

const manifestItems = chapters
  .map((_, i) => `    <item id="ch${i + 1}" href="ch${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
  .join('\n')
const spineItems = chapters
  .map((_, i) => `    <itemref idref="ch${i + 1}"/>`)
  .join('\n')
const navPoints = chapters
  .map(
    (c, i) =>
      `    <navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${c.label}</text></navLabel><content src="ch${i + 1}.xhtml"/></navPoint>`,
  )
  .join('\n')

const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>蜘蛛の糸</dc:title>
    <dc:creator opf:role="aut">芥川龍之介</dc:creator>
    <dc:language>ja</dc:language>
    <dc:identifier id="bookid">${UID}</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>
`

const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${UID}"/></head>
  <docTitle><text>蜘蛛の糸</text></docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>
`

const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`

// Assemble the epub in a temp dir, then zip with the mimetype stored first.
const work = mkdtempSync(join(tmpdir(), 'epub-'))
mkdirSync(join(work, 'META-INF'))
mkdirSync(join(work, 'OEBPS'))
writeFileSync(join(work, 'mimetype'), 'application/epub+zip')
writeFileSync(join(work, 'META-INF', 'container.xml'), container)
writeFileSync(join(work, 'OEBPS', 'content.opf'), opf)
writeFileSync(join(work, 'OEBPS', 'toc.ncx'), ncx)
chapters.forEach((c, i) =>
  writeFileSync(join(work, 'OEBPS', `ch${i + 1}.xhtml`), chapterDoc(c.label, c.html)),
)

mkdirSync(dirname(OUT), { recursive: true })
rmSync(OUT, { force: true })
execSync(`zip -X -0 "${OUT}" mimetype`, { cwd: work, stdio: 'ignore' })
execSync(`zip -X -rg "${OUT}" META-INF OEBPS`, { cwd: work, stdio: 'ignore' })
rmSync(work, { recursive: true, force: true })

console.log(`Built ${OUT} — ${chapters.length} chapters: ${chapters.map((c) => c.label).join(', ')}`)
