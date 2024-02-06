const prompts = require('prompts')
const cac = require('cac')
const chalk = require('chalk')

;(async () => {
    const { execa } = (await import('execa'));

    const registrySourceMap = {
        npm: 'https://registry.npmjs.org/',
        yarn: 'https://registry.yarnpkg.com/',
    }
    
    // npm registry sources
    const questions = {
        type: 'select',
        name: 'value',
        message: 'Select a register source',
        choices: [
          { title: 'npm', value: registrySourceMap.npm, description: 'xxx' },
          { title: 'yarn', value: registrySourceMap.yarn, description: 'xxx' },
        ],
        initial: 1
      }
    
    const cli = cac()
    
    cli
        .command('ls [list]', 'list register source')
        .action(async (list) => {
            handleListCommand()
        })
    cli
        .command('use [source]', 'list register source')
        .action(async (source) => {
            if (source) {
                // const response = await prompts(questions)
                console.log('source', source);
        
                if (registrySourceMap[source]) {
                    // execute command: npm config set registry ...
                    const { stderr } = await execa('npm', ['config', 'set', 'registry', registrySourceMap[source]])
                    if (stderr) {
                        console.log(chalk.red(stderr));
                    } else {
                        console.log(chalk.green('set registry source successfully'));
                    }
                } else {
                    console.log(chalk.red('registry source not found'));
                }
            }
        })
    
    const options = cli.parse()
    
    // console.log(chalk.green('Hello world!'));
    
    function handleListCommand() {
        let outputString = ''
        const sourceKeys = Object.keys(registrySourceMap)
        
        sourceKeys.forEach((key, index) => {
            const line = `${key} ${'-'.repeat(10)} ${registrySourceMap[key]}`
            if (key === 'npm') {
                outputString += chalk.green('*', line)
            } else {
                outputString += '  ' + line
            }
            if (index !== sourceKeys.length - 1) {
                outputString += '\n'
            }
        })
        
        console.log(chalk(outputString))
    }
})();

