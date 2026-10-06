import { defineConfig } from '@lingui/cli'

export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'pt-BR'],
  catalogs: [{
    path: '<rootDir>/src/locales/{locale}/messages',
    include: ['<rootDir>/src/components', '<rootDir>/src/pages', '<rootDir>/src/stores'],
  }],
})
