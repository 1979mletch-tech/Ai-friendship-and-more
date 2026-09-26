import { createApp } from './app.mjs'

const port = Number(process.env.PORT ?? 3001)
const app = createApp({ databasePath: process.env.DATABASE_PATH ?? './data/ai-friendship.sqlite', secureCookies: process.env.NODE_ENV === 'production' })
app.listen(port, '127.0.0.1', () => console.log(`AI Friendship API listening on ${port}`))
