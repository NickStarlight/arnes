import { i18n } from '@/i18n.ts'

/** Creates presentation-only content that never becomes part of the conversation history. */
export function createChatWelcome(): HTMLElement {
  const welcome = document.createElement('section')
  welcome.className = 'chat-welcome'
  welcome.innerHTML = `<h1>${i18n._('Welcome')}</h1>
    <p>${i18n._('Ask a question, explore an idea, or start with whatever is on your mind.')}</p>`

  return welcome
}
