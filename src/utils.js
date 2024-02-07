const { exec, execSync } = require('child_process')
const chalk = require('chalk')

async function getCurrentMirrorOrigin() {
  const result = await execSync('npm config get registry', { encoding: 'utf-8' })
  return result.trim()
}

// execute command: npm config set registry
function setMirrorOrigin(value) {
  exec(`npm config set registry ${value}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      return
    }
    if (stderr) {
      console.log(chalk.red(stderr))
      return
    }
    // success
    console.log(chalk.green('Set registry origin successfully!'))
  })
}

module.exports = {
  getCurrentMirrorOrigin,
  setMirrorOrigin,
}
