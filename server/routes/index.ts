import { withQuery } from 'ufo'

export default eventHandler((event) => {
  const host = event.headers.get('host')

  sendRedirect(event, withQuery(`http://${host}/image`, {
    url: `http://${host}/teages.tatatarte.jpg`,
    width: 300,
    height: 171,
    format: 'webp',
    quality: 80,
  }))
})
