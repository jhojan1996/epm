'use strict'

const http = require('http')
const express = require('express')
const asyncify = require('express-asyncify')
const socketio = require('socket.io')
const path = require('path')
const debug = require('debug')('platziverse:web')
const chalk = require('chalk')
const PlatziverseAgent = require('platziverse-agent')
const proxy = require('./proxy')
const { pipe } = require('./utils')
const app = asyncify(express())
const port = process.env.PORT || 8080
const server = http.createServer(app)
const io = socketio(server)
const agent = new PlatziverseAgent()

app.use(express.static(path.join(__dirname, 'public')))
app.use('/', proxy)

// Socket io / Websockets

io.on('connect', socket => {
  debug(`Connected ${socket.id}`)

  pipe(agent, socket)
})

app.use((err, req, res, next) => {
  debug(`Error ${err.message}`)
  if (err.message.match(/not found/)) {
    return res.status(404).send({error: err.message})
  }
  res.status(500).send({error: err.message})
})

function handleFatalError (err) {
  console.log(`${chalk.red('[fatal error]')} ${err.message}`)
  console.log(err.stack)
  process.exit(1)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

server.listen(port, () => {
  console.log(`$${chalk.green('[platziverse-web]')} server listening on port 8080`)
  agent.connect()
})
