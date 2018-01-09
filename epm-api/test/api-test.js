'use strict'

const test = require('ava')
const util = require('util')
const request = require('supertest')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const agentFixtures = require('./fixtures/agent')
const metricFixtures = require('./fixtures/metric')
const auth = require('../auth')
const config = require('../config')

const sign = util.promisify(auth.sign)

let sandbox = null
let server = null
let dbStub = null
let token = null
let tokenNoAuth = null
let AgentStub = {}
let MetricStub = {}
let uuid = "xxx"
let uuidNotFound = "swdf"
let type = "temperature"
let typeNotFound = "whatever"

test.beforeEach(async() => {
  sandbox = sinon.sandbox.create()
  dbStub = sandbox.stub()
  dbStub.returns(Promise.resolve({
    Agent: AgentStub,
    Metric: MetricStub
  }))

  AgentStub.findConnected = sandbox.stub()
  AgentStub.findConnected.returns(Promise.resolve(agentFixtures.connected))

  //Agent Find by Uuid
  AgentStub.findByUuid = sandbox.stub()
  AgentStub.findByUuid.withArgs(uuid).returns(Promise.resolve(agentFixtures.findByUuid(uuid)))
  AgentStub.findByUuid.withArgs(uuidNotFound).returns(Promise.resolve())

  //Metric find by agent uuid
  MetricStub.findByAgentUuid = sandbox.stub()
  MetricStub.findByAgentUuid.withArgs(uuid).returns(Promise.resolve(metricFixtures.findByAgentUuid(uuid)))

  //Metric find by type agent uuid
  MetricStub.findByTypeAgentUuid = sandbox.stub();
  MetricStub.findByTypeAgentUuid.withArgs(type, uuid).returns(Promise.resolve(metricFixtures.findByTypeAgentUuid(type,uuid)))
  MetricStub.findByTypeAgentUuid.withArgs(typeNotFound, uuidNotFound).returns(Promise.resolve(null))

  token = await sign({admin: true, username: 'platzi'}, config.auth.secret)

  const api = proxyquire('../api', {
    'platziverse-db': dbStub
  })

  server = proxyquire('../server', {
    './api': api
  })
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test.serial.cb('/api/agents', t => {
  request(server)
        .get('/api/agents')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          t.falsy(err, 'should not return error')
          let body = JSON.stringify(res.body)
          let expected = JSON.stringify(agentFixtures.connected)
          t.deepEqual(body, expected, 'response body should be the expected')
          t.end()
        })
})

test.serial.cb('/api/agents - no authorized', t=>{
  request(server)
        .get('/api/agents')
        .expect(500)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          t.is(res.statusCode, 500, 'Must be unautorized user')
          t.end()
        })
})

test.serial.cb('/api/agent/:uuid', t=>{
  request(server)
    .get(`/api/agent/${uuid}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res)=>{
      t.falsy(err, 'should not return error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(agentFixtures.findByUuid(uuid))
      t.deepEqual(body, expected, 'response body should be the expected (existing uuid)')
      t.end()
    })
})

test.serial.cb('/api/agents/:uuid - no authorized', t=>{
  request(server)
        .get(`/api/agent/${uuid}`)
        .expect(500)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          t.is(res.statusCode, 500, 'Must be unautorized user')
          t.end()
        })
})

test.serial.cb('/api/agent/:uuid - not found', t=>{
  request(server)
    .get(`/api/agent/${uuidNotFound}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res)=>{
      t.falsy(err, 'should not return unknown error')
      let body = res.body
      t.regex(body.error, /not found/, 'Must be 404 error')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid', t=>{
  request(server)
    .get(`/api/metrics/${uuid}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res)=>{
      t.falsy(err, 'should not return unknown error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.findByAgentUuid(uuid))
      t.deepEqual(body, expected, 'response body should be the expected (existing agent uuid)')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid - no authorized', t=>{
  request(server)
        .get(`/api/metrics/${uuid}`)
        .expect(500)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          t.is(res.statusCode, 500, 'Must be unautorized user')
          t.end()
        })
})

test.serial.cb('/api/metrics/:uuid - not found', t=>{
  request(server)
    .get(`/api/metrics/${uuidNotFound}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res)=>{
      t.falsy(err, 'should not return unknown error')
      let body = res.body
      t.regex(body.error, /not found/, 'Must be 404 error (Metric uuid not found)')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid/:type', t=>{
  request(server)
    .get(`/api/metrics/${uuid}/${type}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res)=>{
      t.falsy(err, 'should not return unknown error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.findByTypeAgentUuid(type, uuid))
      t.deepEqual(body, expected, 'response body should be the expected (existing agent uuid)')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid/:type - no authorized', t=>{
  request(server)
        .get(`/api/metrics/${uuid}/${type}`)
        .expect(500)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          t.is(res.statusCode, 500, 'Must be unautorized user')
          t.end()
        })
})

test.serial.cb('/api/metrics/:uuid/:type - not found', t=>{
  request(server)
    .get(`/api/metrics/${uuidNotFound}/${typeNotFound}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res)=>{
      t.falsy(err, 'should not return unknown error')
      let body = res.body
      t.regex(body.error, /not found/, 'Must be 404 error (Metric type uuid not found)')
      t.end()
    })
})
