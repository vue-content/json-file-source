import { defineConfig } from 'tsup'

export default defineConfig(() => ({
    entry: ['src/main.ts'],
    splitting: true,
    clean: true,
    dts: true,
    format: ['esm', 'cjs']
}))