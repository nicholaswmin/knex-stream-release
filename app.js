'use strict'

const path = require('path')
const express = require('express')
const knex = require('knex')
const bodyParser = require('body-parser')
const compression = require('compression')
const JSONStream = require('JSONStream')

const app = express()
const db = knex({
  client: 'pg',
  connection: {
    host: 'REDACTED',
    user: 'REDACTED',
    password: 'REDACTED',
    database: 'REDACTED',
    ssl: {
      rejectUnauthorized: false
    }
  },
  acquireConnectionTimeout: 5000,
  pool: {
    min: 1,
    max: 5
  }
})

setInterval(() => {
  console.log(
    'DB connections:',
    db.client.pool.used.length,
    'Heap:', `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100} MB`
  )
}, 1000)

app.set('port', process.env.PORT || 3000)
app.use(compression())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ limit: '50mb' }))

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './index.html'))
})

app.get('/events', (req, res) => {
  try {
    const stream = db('event_v3').select('*').where({ id_session: 'D2g845BN-' }).stream()

    return stream.pipe(JSONStream.stringify()).pipe(res)
  } catch (err) {
    res.status(500).json(err)
  }
})

app.listen(app.get('port'), () => {
  console.log(`Listening at http://localhost:${app.get('port')}`)
})
