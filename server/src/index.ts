import 'dotenv/config'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import tokenRouter from './routes/token.js'

const app = express()
const port = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 4000

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers['origin'] ?? '*'
  console.log(`[${req.method}] ${req.path} — origin: ${origin}`)
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})

app.use(express.json())
app.use('/', tokenRouter)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
