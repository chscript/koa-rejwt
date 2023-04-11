// import commonjs from '@rollup/plugin-commonjs'
// import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.cjs',
                format: 'cjs'
            },
            {
                file: 'dist/index.mjs',
                format: 'esm'
            }
        ],
        external: ['ms', 'jsonwebtoken', 'koa-unless'],
        plugins: [
            // resolve(),
            // commonjs(),
            typescript({
                tsconfig: 'tsconfig.json'
            })
        ]
    },
    {
        input: 'dist/types/index.d.ts',
        output: [
            {
                file: 'dist/types/index.d.ts',
                format: 'es'
            }
        ],
        plugins: [dts()]
    }
]
