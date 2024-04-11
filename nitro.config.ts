// https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: 'server',
  experimental: {
    wasm: true,
  },

  typescript: {
    strict: true,
  },

  preset: 'cloudflare-pages',
})
