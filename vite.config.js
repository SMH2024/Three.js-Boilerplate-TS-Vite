import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [
    topLevelAwait(),
    glsl({
      include: [
        '**/*.glsl', '**/*.wgsl',
        '**/*.vert', '**/*.frag',
        '**/*.vs', '**/*.fs'
      ],
      defaultExtension: 'glsl',
      watch: true
    })
  ],
  base: './',
})