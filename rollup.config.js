import typescript from 'rollup-plugin-typescript2'
import { uglify } from 'rollup-plugin-uglify'

import pkg from './package.json'

export default [
  {
    input: './src/index.ts',
    output: [{ file: pkg.main, format: 'cjs' }],
    plugins: [
      typescript({
        check: true,
        typescript: require('typescript'),
        tsconfig: './tsconfig.build.json'
      }),
      uglify()
    ],

    external: ['mobx', '@issues-beta/datx', 'datx-utils']
  },
  {
    input: './src/index.ts',
    output: [{ file: pkg.module, format: 'es' }],
    plugins: [
      typescript({
        check: true,
        typescript: require('typescript'),
        tsconfig: './tsconfig.build.json'
      })
    ],
    external: ['mobx', '@issues-beta/datx', 'datx-utils']
  }
]
