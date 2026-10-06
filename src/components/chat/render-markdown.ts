import DOMPurify from 'dompurify'
import { Marked } from 'marked'
import markedFootnote from 'marked-footnote'

/** Isolates footnote state per render and scopes links to a stable message ID before sanitizing HTML. */
export function renderMarkdown(text: string, messageId: string): string {
  const parser = new Marked(markedFootnote({ prefixId: `${messageId}-footnote-` }))
  const html = parser.parse(text, { async: false, gfm: true })

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style'],
    FORBID_ATTR: ['style'],
  })
}
