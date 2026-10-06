import { fileURLToPath } from 'node:url'
import { defineConfig, type PluginOption, type UserConfig } from 'vite'
import { lingui } from '@lingui/vite-plugin'
import { viteSingleFile } from 'vite-plugin-singlefile'

const plugins: PluginOption[] = [
  ...lingui({
    configPath: fileURLToPath(new URL('./lingui.config.ts', import.meta.url)),
    failOnMissing: 'catalog',
    failOnCompileError: true,
  }),
  viteSingleFile({ useRecommendedBuildConfig: false }),
]

const config: UserConfig = {
  plugins,
  root: 'src/pages',
  publicDir: '../../public',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: false,
    modulePreload: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    rolldownOptions: { output: { codeSplitting: false } },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '/src': fileURLToPath(new URL('./src', import.meta.url)),
    },
    tsconfigPaths: true,
  },
}

export default defineConfig(config)
