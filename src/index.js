const { exec, execSync } = require('child_process')
const prompts = require('prompts')
const cac = require('cac')
const chalk = require('chalk')
const pkg = require('../package.json')
const registries = require('../registries.json')
const ping = require('node-http-ping')
const {
  getCurrentMirrorOrigin,
  setMirrorOrigin,
} = require('./utils')

// built-in origin
const whitelist = ['npm', 'yarn', 'tencent', 'cnpm', 'taobao', 'npmMirror']

const cli = cac()

cli
  .command('ls [list]', 'list registry mirror origins')
  .action(async () => {
    let outputString = ''
    const registryKeys = Object.keys(registries)
    const currentOrigin = await getCurrentMirrorOrigin()

    let maxLength = Math.max(...registryKeys.map((key) => key.length))

    registryKeys.forEach((key, index) => {
      const registryOrigin = registries[key].registry
      const placeholderString = `${' '.repeat(maxLength - key.length)}${'-'.repeat(10)}`
      const line = `${key} ${placeholderString} ${registryOrigin}`
      if (currentOrigin === registryOrigin) {
        outputString += chalk.blue('*', line)
      } else {
        outputString += '  ' + line
      }
      if (index !== registryKeys.length - 1) {
        outputString += '\n'
      }
    })
    console.log(chalk(outputString))
  })

cli
  .command('use [origin]', 'use a registry mirror origin')
  .action((origin) => {
    if (origin) {
      const registryOrigin = registries[origin].registry
      if (registryOrigin) {
        setMirrorOrigin(registryOrigin)
      } else {
        console.log(chalk.red('registry mirror origin not found'))
      }
    } else {
      prompts({
        type: 'select',
        name: 'value',
        message: 'Select a mirror origin',
        initial: 0,
        choices: Object.keys(registries).map(key => ({ title: key, value: key }))
      }).then(res => {
        setMirrorOrigin(registries[res.value].registry)
      })
    }
  })

cli
  .command('current', 'check out current registry mirror origin')
  .action(async () => {
    const registrySource = await getCurrentMirrorOrigin()
    console.log(chalk.blue(registrySource))
  })

cli.command('ping [origin]', 'ping mirror origin to test...').action((origin) => {
  const startPing = (pingOrigin) => {
    ping(pingOrigin)
      .then(time => console.log(chalk.blue(`Response time: ${time}ms`)))
      .catch(() => console.log(chalk.red('Failed to ping google.com')))
  }
  if (origin) {
    if (registries[origin]) {
      const pingOrigin = registries[origin].ping
      startPing(pingOrigin)
    } else {
      console.log(chalk.red('ping origin not found'))
    }
  } else {
    prompts({
      type: 'select',
      name: 'value',
      message: 'select a mirror origin',
      choices: Object.keys(registries).map(key => ({ title: key, value: key }))
    }).then(res => {
      const pingOrigin = registries[res.value].ping
      startPing(pingOrigin)
    })
  }
})

cli.help()

// 解析参数 (注意: 这里一定要写，否则 action 里面的回调不会被执行)
cli.parse()
