import { imageMeta } from 'image-meta'

import decodeJpeg, { init as initJpegDecode } from '@jsquash/jpeg/decode'
import decodePng, { init as initPngDecode } from '@jsquash/png/decode'
import decodeWebp, { init as initWebpDecode } from '@jsquash/webp/decode'

import encodeWebp, { init as initWebpEncode } from '@jsquash/webp/encode'
import encodeJpeg, { init as initJpegEncode } from '@jsquash/jpeg/encode'
import encodePng, { init as initPngEncode } from '@jsquash/png/encode'

import _resize, { initResize } from '@jsquash/resize'
import type { WorkerResizeOptions } from '@jsquash/resize/meta'

export async function decodeImage(raw: ArrayBuffer) {
  const { type } = imageMeta(new Uint8Array(raw))

  if (type === 'jpeg' || type === 'jpg') {
    await initJpegDecode(await wasm(
      // @ts-expect-error wasm module
      import('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm?module'),
    ))
    const image = await decodeJpeg(raw)

    return {
      image,
      type: 'jpg' as const,
    }
  }

  if (type === 'png') {
    await initPngDecode(await wasm(
      // @ts-expect-error wasm module
      import('@jsquash/png/codec/pkg/squoosh_png_bg.wasm?module'),
    ))
    const image = await decodePng(raw)

    return {
      image,
      type: 'png' as const,
    }
  }

  if (type === 'webp') {
    await initWebpDecode(await wasm(
      // @ts-expect-error wasm module
      import('@jsquash/webp/codec/dec/webp_dec.wasm?module'),
    ))
    const image = await decodeWebp(raw)

    return {
      image,
      type: 'webp' as const,
    }
  }

  throw new Error('Unsupported image type')
}

export async function encodeImage(
  image: ImageData,
  format: 'jpg' | 'png' | 'webp',
  quality?: number,
) {
  if (format === 'jpg') {
    await initJpegEncode(await wasm(
      // @ts-expect-error wasm module
      import('@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm?module'),
    ))
    const jpg = await encodeJpeg(image, {
      quality: quality || 80,
    })
    return jpg
  }

  if (format === 'png') {
    await initPngEncode(await wasm(
      // @ts-expect-error wasm module
      import('@jsquash/png/codec/pkg/squoosh_png_bg.wasm?module'),
    ))
    const png = await encodePng(image)
    return png
  }

  if (format === 'webp') {
    await initWebpEncode(await wasm(
      // @ts-expect-error wasm module
      import('@jsquash/webp/codec/enc/webp_enc.wasm?module'),
    ))
    const webp = await encodeWebp(image, {
      quality: quality || 80,
    })
    return webp
  }
}

export async function resizeImage(
  image: ImageData,
  overrideOptions: Partial<WorkerResizeOptions> & SizeOptions,
) {
  await initResize(await wasm(
    // @ts-expect-error wasm module
    import('@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm?module'),
  ))

  const { width, height } = autoSize(image, overrideOptions)

  return await _resize(image, {
    ...overrideOptions,
    width,
    height,
  })
}

function autoSize(
  from: { width: number, height: number },
  to: SizeOptions,
): { width: number, height: number } {
  const { width, height } = to

  if (width && height) {
    return { width, height }
  }

  if (width) {
    return {
      width,
      height: Math.round((width / from.width) * from.height),
    }
  }

  return {
    height: height!,
    width: Math.round((height! / from.height) * from.width),
  }
}

type SizeOptions = {
  width: number
  height?: number
} | {
  width?: number
  height: number
}

async function wasm(entity: Promise<any>): Promise<WebAssembly.Module> {
  const res = await entity
  return res.default || res
}
