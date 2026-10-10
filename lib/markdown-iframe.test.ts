import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import { parseArticle, parseMessage, parseMarkdown } from './markdown'

const embed =
  '<iframe src="https://www.youtube.com/embed/asKQbk7AcJU" width="713" height="401" title="Video" allowfullscreen></iframe>'

describe('article video embeds', () => {
  it('renders the exact fh post and keeps player attributes', async () => {
    const post = matter(readFileSync('posts/2026/fh.md', 'utf8')).content
    const html = await parseArticle(post)
    expect(html).toContain('<iframe')
    expect(html).toContain('src="https://www.youtube.com/embed/asKQbk7AcJU"')
    expect(html).toContain('allowfullscreen')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('sandbox="allow-scripts allow-same-origin allow-presentation"')
    expect(html).toContain('width="713"')
  })
  it('supports privacy-enhanced YouTube embeds', async () => {
    expect(
      await parseArticle(embed.replace('www.youtube.com', 'www.youtube-nocookie.com')),
    ).toContain('<iframe')
  })
  it('does not enable iframes in messages or short content', async () => {
    expect(await parseMessage(embed)).not.toContain('<iframe')
    expect(await parseMarkdown(embed)).not.toContain('<iframe')
  })
  it('rejects other hosts, insecure URLs, lookalike hosts and script URLs', async () => {
    for (const src of [
      'https://evil.example/embed/x',
      'http://www.youtube.com/embed/x',
      'https://www.youtube.com.evil.example/embed/x',
      'javascript:alert(1)',
      'data:text/html,evil',
      '//www.youtube.com/embed/x',
      'https://www.youtube.com/watch?v=x',
    ]) {
      expect(await parseArticle(`<iframe src="${src}"></iframe>`)).not.toContain('<iframe')
    }
  })
  it('strips scripts, event handlers and iframe srcdoc', async () => {
    const html = await parseArticle(
      embed.replace(' title=', ' onload="alert(1)" srcdoc="evil" title=') +
        '<script>alert(1)</script>',
    )
    expect(html).not.toMatch(/onload|srcdoc|<script/)
    expect(html).toContain('<iframe')
  })
  it('keeps ordinary markdown and fenced iframe code working', async () => {
    expect(await parseArticle('# Heading\n\n**Bold**')).toContain('<strong>Bold</strong>')
    const html = await parseArticle('```html\n' + embed + '\n```')
    expect(html).toContain('<pre')
    expect(html).not.toContain('<iframe')
  })
})
