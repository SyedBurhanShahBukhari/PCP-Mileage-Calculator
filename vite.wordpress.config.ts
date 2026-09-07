import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import prefixSelector from 'postcss-prefix-selector';

/**
 * WordPress plugin build.
 *
 * Two things differ from the standalone site build:
 *
 *  1. Output is a single self-contained IIFE bundle with stable filenames, so
 *     the PHP plugin can enqueue it without reading a manifest.
 *  2. Every CSS selector is scoped under `.pcp-mc`, and page-level selectors
 *     (`html`, `body`, `:root`) are rewritten to the wrapper itself. Without
 *     this the calculator's base styles would restyle the host theme.
 */
const SCOPE = '.pcp-mc.pcp-mc';

export default defineConfig({
  plugins: [react()],
  // The standalone site's public/ assets are not part of the plugin.
  publicDir: false,
  css: {
    postcss: {
      plugins: [
        prefixSelector({
          prefix: SCOPE,
          includeFiles: [/global\.css/, /app\.css/],
          transform(prefix, selector, prefixedSelector) {
            // Page-level selectors become the wrapper; everything else nests.
            if (selector === 'html' || selector === 'body' || selector === ':root') return prefix;
            if (selector === '*' || selector.startsWith('*,')) return `${prefix} *`;
            if (selector.startsWith(':focus-visible')) return `${prefix} :focus-visible`;
            if (selector.startsWith('::selection')) return `${prefix} ::selection`;
            return prefixedSelector;
          },
        }),
      ],
    },
  },
  build: {
    outDir: 'wordpress-plugin/pcp-mileage-calculator/assets',
    emptyOutDir: true,
    cssCodeSplit: false,
    // WordPress still supports browsers without top-level await; keep it simple.
    target: 'es2018',
    rollupOptions: {
      input: 'src/wordpress.tsx',
      output: {
        format: 'iife',
        entryFileNames: 'pcp-mileage-calculator.js',
        assetFileNames: 'pcp-mileage-calculator.[ext]',
        inlineDynamicImports: true,
      },
    },
  },
});
