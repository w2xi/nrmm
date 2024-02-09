const { exec, execSync } = require('child_process')
const inquirer = require('inquirer');
const cac = require('cac')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const pkg = require('../package.json')
const registries = require('../registries.json')
const ping = require('node-http-ping')
const {
  getCurrentMirrorOrigin,
  setMirrorOrigin,
} = require('./utils')

// built-in origin
const whiteList = ['npm', 'yarn', 'tencent', 'cnpm', 'taobao', 'npmMirror']

const cli = cac()

cli.version(pkg.version)

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
      inquirer.prompt({
        type: 'list',
        name: 'value',
        message: 'Select a mirror origin',
        choices: Object.keys(registries)
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
    inquirer.prompt({
      type: 'list',
      name: 'value',
      message: 'Select a mirror origin',
      choices: Object.keys(registries)
    }).then(res => {
      const pingOrigin = registries[res.value].ping
      startPing(pingOrigin)
    })
  }
})

cli.command('add', 'add mirror origin').action(() => {
  inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Please input registry name:',
      validate(name) {
        if (registries[name]) {
          return 'registry name already exists'
        }
        if (!name.trim()) {
          return 'registry name cannot be empty'
        }
        return true
      },
    },
    {
      type: 'input',
      name: 'url',
      message: 'Please input registry url:',
      validate(url) {
        if (!url.trim()) {
          return 'registry url cannot be empty'
        }
        if (!url.startsWith('http')) {
          return 'registry url must be a valid url'
        }
        return true
      }
    }
  ]).then(res => {
    let { name, url } = res
    url = url.trim()

    registries[name] = {
      home: url,
      registry: url,
      ping: url,
    }
    // save new mirror info into registries.json
    try {
      fs.writeFileSync(path.join(__dirname, '../registries.json'), JSON.stringify(registries, null, 2))
      console.log(chalk.blue('add mirror origin successfully'))
    } catch (err) {
      console.log(chalk.red(err))
    }
  })
})

cli.command('del', 'delete a custom origin').action(() => {
  const keys = Object.keys(registries)
  if (keys.length === whiteList.length) {
    return console.log(chalk.red('current has no custom origin to be deleted'))
  }
  const customOrigins = keys.filter(key => !whiteList.includes(key))
  inquirer.prompt({
    type: 'list',
    name: 'name',
    message: 'Please select the origin to be deleted:',
    choices: customOrigins,
  }).then(async res => {
    const name = res.name.trim()
    const currentOrigin = await getCurrentMirrorOrigin()
    const selectedOrigin = registries[name].registry
    if (currentOrigin === selectedOrigin) {
      console.log(chalk.red('current origin is using, please select other origin'))
    } else {
      delete registries[name]
      try {
        fs.writeFileSync(path.join(__dirname, '../registries.json'), JSON.stringify(registries, null, 2)) 
        console.log(chalk.blue('delete mirror origin successfully'))
      } catch (err) {
        console.log(chalk.red(err))
      }
    }
  })
})

cli.command('rename', 'rename a custom origin').action(() => {
  const keys = Object.keys(registries)
  if (keys.length === whiteList.length) {
    return console.log(chalk.red('current has no custom origin to be renamed'))
  }
  const customOrigins = keys.filter(key => !whiteList.includes(key))
  inquirer.prompt([
    {
      type: 'list',
      name: 'name',
      message: 'Please select the origin name',
      choices: customOrigins,
    },
    {
      type: 'input',
      name: 'newName',
      message: 'Please input the new origin name',
      validate(value) {
        if (!value.trim()) {
          return 'the new origin name cannot be empty'
        }
        if (keys.includes(value)) {
          return 'the origin name already exists, please input another one'
        }
        return true
      },
    }
  ]).then(res => {
    const name = res.name.trim()
    const newName = res.newName.trim()

    registries[newName] = registries[name]
    delete registries[name]

    try {
      fs.writeFileSync(path.join(__dirname, '../registries.json'), JSON.stringify(registries, null, 2))
      console.log(chalk.green('rename successfully'))
    } catch (err) {
      console.log(chalk.red(err))
    }
  })
})

cli.help()

// 解析参数 (注意: 这里一定要写，否则 action 里面的回调不会被执行)
cli.parse()
