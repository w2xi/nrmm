const chalk = require("chalk")

// log status:
const log = console.log
const info = console.info
const warn = console.warn
const error = console.error

// rewrite console's static method
function initLog() {
  console.success = (...args) => {
    log(chalk.hex('#67C23A')(...args))
  }
  console.info = (...args) => {
    info(chalk.bold.blue(...args))
  }
  console.warn = (...args) => {
    warn(chalk.hex('#E6A23C')(...args))
  }
  console.error = (...args) => {
    error(chalk.hex('#F56C6C')(...args))
  }
}

module.exports = initLog