const cac = require('cac')
const inquirer = require('inquirer')
const chalk = require('chalk')
const pkg = require('../package.json')
const registries = require('../registries.json')
const ping = require('node-http-ping')
const {
  getCurrentMirrorOrigin,
  setMirrorOrigin,
  writeSync
} = require('./utils')
const initLog = require('./log')

// built-in origin
const whiteList = ['npm', 'yarn', 'tencent', 'cnpm', 'taobao', 'npmMirror']

const cli = cac()

initLog()

cli.version(pkg.version)

cli
  .command('ls [list]', 'list all registries')
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
        outputString += chalk.bold.green('*', line)
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
  .command('use [registry]', 'change current registry')
  .action((registry) => {
    if (registry) {
      const url = registries[registry].registry
      if (url) {
        setMirrorOrigin(url)
      } else {
        console.warn('registry not found')
      }
    } else {
      inquirer.prompt({
        type: 'list',
        name: 'value',
        message: 'Select a registry',
        choices: Object.keys(registries)
      }).then(res => {
        setMirrorOrigin(registries[res.value].registry)
      })
    }
  })

cli
  .command('current', 'show current registry url')
  .action(async () => {
    const registrySource = await getCurrentMirrorOrigin()
    console.info(registrySource)
  })

cli.command('ping [registry]', 'show response time for specific registry').action((registry) => {
  const startPing = (registry) => {
    ping(registry)
      .then(time => console.info((`Response time: ${time}ms`)))
      .catch((err) => console.error(err))
  }
  if (registry) {
    if (registries[registry]) {
      const url = registries[registry].ping
      startPing(url)
    } else {
      console.warn('registry not found')
    }
  } else {
    inquirer.prompt({
      type: 'list',
      name: 'value',
      message: 'Select a registry',
      choices: Object.keys(registries)
    }).then(res => {
      const pingOrigin = registries[res.value].ping
      startPing(pingOrigin)
    })
  }
})

cli.command('add', 'add a custom registry').action(() => {
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
    writeSync(registries, 'add')
  })
})

cli.command('del', 'delete a custom registry').action(() => {
  const keys = Object.keys(registries)
  if (keys.length === whiteList.length) {
    return console.warn('current has no custom registry to be deleted')
  }
  const customOrigins = keys.filter(key => !whiteList.includes(key))
  inquirer.prompt({
    type: 'list',
    name: 'name',
    message: 'Please select a registry to be deleted',
    choices: customOrigins,
  }).then(async res => {
    const name = res.name.trim()
    const currentOrigin = await getCurrentMirrorOrigin()
    const selectedOrigin = registries[name].registry
    if (currentOrigin === selectedOrigin) {
      console.warn('current registry is using, please select other')
    } else {
      delete registries[name]
      writeSync(registries, 'delete')
    }
  })
})

cli.command('rename', 'rename a custom registry').action(() => {
  const keys = Object.keys(registries)
  if (keys.length === whiteList.length) {
    return console.warn('current has no custom registry to be renamed')
  }
  const customOrigins = keys.filter(key => !whiteList.includes(key))
  inquirer.prompt([
    {
      type: 'list',
      name: 'name',
      message: 'Please select the registry',
      choices: customOrigins,
    },
    {
      type: 'input',
      name: 'newName',
      message: 'Please input a new registry',
      validate(value) {
        if (!value.trim()) {
          return 'the new registry cannot be empty'
        }
        if (keys.includes(value)) {
          return 'the registry already exists, please input another'
        }
        return true
      },
    }
  ]).then(res => {
    const name = res.name.trim()
    const newName = res.newName.trim()

    registries[newName] = registries[name]
    delete registries[name]

    writeSync(registries, 'rename')
  })
})

cli.command('edit', 'edit custom registry url').action(async () => {
  const keys = Object.keys(registries)

  if (keys.length === whiteList.length) {
    console.warn('current has no custom registry')
    return
  }
  const customOrigins = keys.filter(key => !whiteList.includes(key))

  const { name } = await inquirer.prompt([
    {
      type: 'list',
      name: 'name',
      message: 'Please select a registry',
      choices: customOrigins,
    },
  ])
  inquirer.prompt([{
      type: 'input',
      name: 'url',
      message: 'Please input registry url:',
      default() {
        return registries[name].registry
      },
      validate(url) {
        if (!url.trim()) {
          return 'registry url cannot be empty'
        }
        if (!url.startsWith('http')) {
          return 'registry url must be a valid url'
        }
        return true
      },
    }
  ]).then(res => {
    const { url } = res

    registries[name] = {
      home: url,
      registry: url,
      ping: url,
    }
    writeSync(registries, 'edit')
  })
})

cli.help()

// 解析参数 (注意: 这里一定要写，否则 action 里面的回调不会被执行)
cli.parse()
