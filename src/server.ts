import fastify from 'fastify'
import { env } from './env'

const server = fastify()

server.get('/', async () => {
  return { hello: 'world' }
})

server
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('Server is running on port 3333')
  })
