import { defineConfig, type ConfigEnv, type PluginOption } from 'vite'
import { lingui } from '@lingui/vite-plugin'
import { viteSingleFile } from 'vite-plugin-singlefile'

const plugins: PluginOption[] = [
  ...lingui({
    configPath: `${import.meta.dirname}/lingui.config.ts`,
    failOnMissing: 'catalog',
    failOnCompileError: true,
  }),
  viteSingleFile({ useRecommendedBuildConfig: false }),
]

/** Adds hosted installation assets only to Pages builds, keeping portable releases self-contained. */
function createConfig({ mode }: ConfigEnv) {
  const isPages = mode === 'pages'

  return {
    plugins,
    root: 'src/pages',
    publicDir: isPages ? `${import.meta.dirname}/src/pwa/public` : '../../public',
    build: {
      outDir: '../../dist',
      emptyOutDir: true,
      copyPublicDir: isPages,
      cssCodeSplit: false,
      modulePreload: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      rolldownOptions: { output: { codeSplitting: false } },
    },
    resolve: {
      alias: {
        '@': `${import.meta.dirname}/src`,
        '/src': `${import.meta.dirname}/src`,
      },
      tsconfigPaths: true,
    },
  }
}

export default defineConfig(createConfig)
