# nrmm - NPM registry manager mirror

Another version of [nrm](https://github.com/Pana/nrm), just for learning something interesting.

## Install

```bash
npm i -g nrmm
```

## Usage

List all available registries:

```bash
$ nrmm ls
  npm       ---------- https://registry.npmjs.org/
  yarn      ---------- https://registry.yarnpkg.com/
  tencent   ---------- https://mirrors.cloud.tencent.com/npm/
  cnpm      ---------- https://r.cnpmjs.org/
* taobao    ---------- https://registry.npmmirror.com/
  npmMirror ---------- https://skimdb.npmjs.com/registry/
```

Show current registry:

```bash
nrmm current
```

Switch registry:

```bash
$ nrmm use # or npm use <registry>
? Select a registry (Use arrow keys)
> npm 
  yarn 
  tencent 
  cnpm 
  taobao 
  npmMirror 
```

Add custom registry:

```bash
nrmm add
```

Delete custom registry:
```bash
nrmm del
```

Edit custom registry:

```bash
nrmm edit
```

Rename registry:

```bash
nrmm rename
```

Test the response time of registry:

```bash
nrmm ping [registry]
```

## References

- [nrm](https://github.com/Pana/nrm)
- [xmzs mmp](https://github.com/message163/mmp)

## License

MIT