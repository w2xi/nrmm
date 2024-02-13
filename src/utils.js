const fs = require('fs')
const path = require('path')
const { exec, execSync } = require('child_process')

// execute command: npm config get registry
async function getRegistry() {
  const result = await execSync('npm config get registry', { encoding: 'utf-8' })
  return result.trim()
}

// execute command: npm config set registry
function setRegistry(value) {
  exec(`npm config set registry ${value}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    if (stderr) {
      console.error(stderr)
      return
    }
    console.success('Set registry successfully!')
  })
}

function writeSync(registries, action) {
  try {
    fs.writeFileSync(path.join(__dirname, '../registries.json'), JSON.stringify(registries, null, 2))
    console.success(`${capitalize(action)} successfully!`)
  } catch (err) {
    console.error(err)
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = {
  getRegistry,
  setRegistry,
  writeSync,
}
