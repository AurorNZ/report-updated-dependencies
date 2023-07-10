// @ts-check
import {build} from 'esbuild'
import {copy} from 'esbuild-plugin-copy'
import {readFileSync} from 'fs'

/** @type {import('esbuild').Plugin} */
const fixHcl2jsonDirnamePlugin = {
  name: 'fixHcl2jsonDirname',
  setup(build) {
    build.onLoad({filter: /bridge.js/}, ({path: filePath}) => {
      // trying to fix the issue with file paths when loading main.wasm.gz from @cdktf/hcl2json
      let contents = readFileSync(filePath, 'utf8')
      const loader = 'js'
      contents = contents.replace('"..", "main.wasm.gz"', `".", "main.wasm.gz"`)
      return {
        contents,
        loader
      }
    })
  }
}

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node16',
  external: ['re2', 'dtrace-provider', 'performance'],
  outdir: 'dist',
  minify: true,

  plugins: [
    copy({
      // this is equal to process.cwd(), which means we use cwd path as base path to resolve `to` path
      // if not specified, this plugin uses ESBuild.build outdir/outfile options as base path.
      resolveFrom: 'cwd',
      assets: [
        {
          from: ['./node_modules/@cdktf/hcl2json/*.gz'],
          to: ['./dist']
        },
        {
          from: ['./node_modules/@one-ini/wasm/*.wasm'],
          to: ['./dist']
        }
      ]
    }),
    fixHcl2jsonDirnamePlugin
  ],
  legalComments: 'linked',
  logLevel: 'info'
})
