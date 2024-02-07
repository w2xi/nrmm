const prompts = require('prompts')
const cac = require('cac')
const chalk = require('chalk')
const ping = require('ping');

;(async () => {
    const { execa } = (await import('execa'));

    const registrySourceMap = {
        npm: 'https://registry.npmjs.org/',
        yarn: 'https://registry.yarnpkg.com/',
        tencent: 'https://mirrors.cloud.tencent.com/npm/',
        cnpm: 'https://r.cnpmjs.org/',
        taobao: 'https://registry.npmmirror.com/',
        npmMirror: 'https://skimdb.npmjs.com/registry/',
    };

    const choices = Object
                    .keys(registrySourceMap)
                    .map(key => ({ title: key, value: key, description: key }));
    
    const questions = {
        choices,
        type: 'select',
        name: 'value',
        message: 'Select a registry mirror source',
        initial: 0,
    };
    
    const cli = cac();

    cli
        .command('ls [list]', 'list registry mirror source')
        .action(() => {
            handleListCommand()
        });
    cli
        .command('use [source]', 'use a registry mirror source')
        .action(async (source) => {
            if (source) {
                if (registrySourceMap[source]) {
                    handleSetCommand(registrySourceMap[source])
                } else {
                    console.log(chalk.red('registry source not found'));
                }
            } else {
                const { value } = await prompts(questions)
                if (value) {
                    handleSetCommand(registrySourceMap[value])
                }
            }
        });
    cli
        .command('current', 'check out current registry mirror source')
        .action(async () => {
            const currentRegistrySource = await getCurrentRegistrySource()
            console.log(chalk.blue(currentRegistrySource));
        });

    cli
        .command('ping [source]', 'ping')
        .action(async (source) => {
            let pingSource
            if (source) {
                if (registrySourceMap[source]) {
                    pingSource = registrySourceMap[source]
                } else {
                    console.log(chalk.red('ping source not found'))
                }
            } else {
                const { value } = await prompts(questions)
                if (value) {
                    pingSource = registrySourceMap[value]
                }
            }
            if (pingSource) {
                ping.promise.probe('registry.npmmirror.com', {
                    timeout: 10,
                    extra: ['-i', '2']
                }).then(res => {
                    console.log(res)
                })
            }
        });
    
    cli.help();

    // 解析参数 (注意: 这里一定要写，否则 action 里面的回调不会被执行)
    cli.parse();
    
    async function handleListCommand() {
        const sourceKeys = Object.keys(registrySourceMap)
        const registrySource = await getCurrentRegistrySource()

        let outputString = ''
        
        sourceKeys.forEach((key, index) => {
            const line = `${key} ${'-'.repeat(10)} ${registrySourceMap[key]}`
            if (registrySource === registrySourceMap[key]) {
                outputString += chalk.blue('*', line)
            } else {
                outputString += '  ' + line
            }
            if (index !== sourceKeys.length - 1) {
                outputString += '\n'
            }
        })
        
        console.log(chalk(outputString))
    }

    async function handleSetCommand(value) {
        // execute command: npm config set registry ...
        const { stderr } = await execa('npm', ['config', 'set', 'registry', value])
        if (stderr) {
            console.log(chalk.red(stderr));
        } else {
            console.log(chalk.green('set registry source successfully'));
        }
    }

    async function getCurrentRegistrySource() {
        const { stdout } = await execa('npm', ['config', 'get', 'registry'])
        return stdout.trim()
    }
})();

