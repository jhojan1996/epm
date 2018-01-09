'use strict'

const agents = require('./agent')

const metric = {
  id: 1,
  agentId: 1,
  type: 'ram',
  value: '1064',
  createAt: new Date(),
  agent: agents.byId(1)
}

const metrics = [
  metric,
  extend(metric, { id: 2, type: 'temperature', value: '45C', agent: agents.byId(4)}),
  extend(metric, { id: 3, type: 'humidity', value: '45%' }),
  extend(metric, { id: 4, type: 'distance', value: '43m' })
]

function extend (obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}
function findByAgentUuid (uuid) {
  return metrics.filter(a => a.agent.uuid === uuid).map(b => {
    if(b.agent.uuid === uuid) return b.type
  })
}

function sortByCreated (prop) {
  return (a, b) => {
    let aProp = new Date(a[prop])
    let bProp = new Date(b[prop])

    return aProp - bProp
  }
}

function findByTypeAgentUuid (type, uuid) {
  return metrics.filter(element => element.agent.uuid === uuid && element.type === type).map(element => {
    return element
  }).sort(sortByCreated).reverse()
}
module.exports = {
  single: metric,
  all: metrics,
  findByAgentUuid,
  findByTypeAgentUuid
}
