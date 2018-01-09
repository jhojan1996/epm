# Platziverse-agent

## usage

```js
const PlaztiverseAgent = require('platziverse-agent')
const agent = new PlatziverseAgent({
    name: 'myapp',
    username: 'admin',
    interval: 2000
})

agent.addMetric('rss', function getRss(){
    process.memoryUsage().rss
})

agent.addMetric('promiseMetric', function getRandomePromise(){
    return Promise.resolve(Math.random())
})

agent.addMetric('callbackMetric', function getRandomCallback(callback){
    setTimeout(()=>{
        callback(null,Math.random())
    },1000)
})
agent.connect()

//this agent only
agent.on('connected', handler)
agent.on('disconnected', handler)
agent.on('message', handler)

//other agents
agent.on('agent/connected', handler)
agent.on('agent/disconnected', handler)
agent.on('agent/message', payload=>{
    console.log(payload)
})

function handler(payload) {
    console.log(payload)
}

setTimeout(()=> agent.disconnect(), 20000)
```