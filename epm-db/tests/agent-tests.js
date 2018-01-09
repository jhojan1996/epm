'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const agentFixtures = require('./fixtures/agent')

let config = {
  logging: function () {}
}
let MetricStub = {
  belongsTo: sinon.spy()
}
let single = Object.assign({}, agentFixtures.single)
let id = 1
let uuid = 'yyy-yyy-yyy'
let AgentStub = null
let db = null
let sandbox = null
let connectedArgs = {
  where: {
    connected: true
  }
}
let usernameArgs = {
  where: {
    username: 'platzi',
    connected: true
  }
}
let uuidArgs = {
  where: {
    uuid
  }
}

let newAgent = {
  uuid: '123-123-123',
  name: 'test',
  username: 'test',
  hostname: 'test',
  pid: 0,
  connected: false
}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  AgentStub = {
    hasMany: sandbox.spy()
  }

    // model create
  AgentStub.create = sandbox.stub()
  AgentStub.create.withArgs(newAgent).returns(Promise.resolve({
    toJSON () { return newAgent }
  }))

    // model findOne
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

    // model update
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

    // Model findById
  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

    // Model findAll
  AgentStub.findAll = sandbox.stub()
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixtures.all))
  AgentStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixtures.connected))
  AgentStub.findAll.withArgs(usernameArgs).returns(Promise.resolve(agentFixtures.platzi))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exist')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be MetricStub')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be AgentStub')
})

test.serial('Agent#findById', async t => {
  let agent = await db.Agent.findById(id)

  t.true(AgentStub.findById.called, 'FindById should be called on model')
  t.true(AgentStub.findById.calledOnce, 'FindById should be called once')
  t.true(AgentStub.findById.calledWith(id), 'FindById should be called with specified id')
  t.deepEqual(agent, agentFixtures.byId(id), 'Should be the same')
})

test.serial('Agent#findByUuid', async t => {
  let agent = await db.Agent.findByUuid(uuid)

  t.true(AgentStub.findOne.called, 'FindById should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'FindById should be called once')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'FindById should be called with uuidArgs')
  t.deepEqual(agent, agentFixtures.byUuid(uuid), 'Should be the same')
})

test.serial('Agent#createOrUpdate - exists', async t => {
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'FindOne should be called on model')
  t.true(AgentStub.findOne.calledTwice, 'FindOne should be called twice')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'FindOne should be called width uuidArgs')
  t.true(AgentStub.update.called, 'Update should be called on model')
  t.true(AgentStub.update.calledOnce, 'Update should be called once')
  t.true(AgentStub.update.calledWith(single), 'Update should be called width single args')
  t.deepEqual(agent, single, 'Agent should be the same')
})

test.serial('Agent#findAll', async t => {
  let agents = await db.Agent.findAll()

  t.true(AgentStub.findAll.called, 'findAll should be called on model')
  t.true(AgentStub.findAll.calledOnce, 'FindALl should be called once')
  t.true(AgentStub.findAll.calledWith(), 'FindAll should be called without args')

  t.is(agents.length, agentFixtures.all.length, 'Agents should be the same length')
  t.deepEqual(agents, agentFixtures.all, 'Agent should be the same')
})

test.serial('Agent#findByUsername', async t => {
  let agent = await db.Agent.findByUsername('platzi')

  t.true(AgentStub.findAll.called, 'findAll should be called on model')
  t.true(AgentStub.findAll.calledOnce, 'FindALl should be called once')
  t.true(AgentStub.findAll.calledWith(usernameArgs), 'FindAll should be called with usernameArgs')

  t.is(agent.length, agentFixtures.platzi.length, 'Agents should be the same length')
  t.deepEqual(agent, agentFixtures.platzi, 'Agent should be the same')
})

test.serial('Agent#findConnected', async t => {
  let agents = await db.Agent.findConnected()

  t.true(AgentStub.findAll.called, 'findAll should be called on model')
  t.true(AgentStub.findAll.calledOnce, 'FindALl should be called once')
  t.true(AgentStub.findAll.calledWith(connectedArgs), 'FindAll should be called with connectedArgs')

  t.is(agents.length, agentFixtures.connected.length, 'Agents should be the same length')
  t.deepEqual(agents, agentFixtures.connected, 'Agent should be the same connected')
})

test.serial('Agent#createOrUpdate - new', async t => {
  let agent = await db.Agent.createOrUpdate(newAgent)

  t.true(AgentStub.findOne.called, 'FindOne should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'FindOne should be called twice')
  t.true(AgentStub.findOne.calledWith({
    where: {uuid: newAgent.uuid}
  }), 'FindOne should be called with uuid args')
  t.true(AgentStub.create.called, 'create should be called on model')
  t.true(AgentStub.create.calledOnce, 'create should be called once')
  t.true(AgentStub.create.calledWith(newAgent), 'create should be called with newAgent args')
  t.deepEqual(agent, newAgent, 'Agent should be the same')
})
