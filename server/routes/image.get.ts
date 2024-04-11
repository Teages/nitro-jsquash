import { z } from 'zod'

const querySchema = z.object({
  url: z.string().url(),

  width: z.coerce.number().int()
    .min(1)
    .optional(),

  height: z.coerce.number().int()
    .min(1)
    .optional(),

  format: z.enum(['jpg', 'png', 'webp'])
    .optional(),

  quality: z.coerce.number().int()
    .min(1).max(100)
    .optional(),
})

export default eventHandler(async (event) => {
  const query = await getValidatedQuery(event, q => querySchema.safeParse(q))
  if (query.success !== true) {
    throw createError({
      statusCode: 400,
      message: query.error.message,
    })
  }

  const { url, width, height, format, quality } = query.data

  const raw = await $fetch<ArrayBuffer>(url, {
    responseType: 'arrayBuffer',
  })

  if (!width && !height && !format) {
    return new Response(raw)
  }

  const data = await decodeImage(raw)
  const { type } = data
  let { image } = data

  if (width || height) {
    image = await resizeImage(image, { width, height } as any)
  }

  return new Response(
    await encodeImage(image, format ?? type, quality),
  )
})
