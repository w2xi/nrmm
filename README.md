# nrmm - NPM registry manager mirror

Another version of [nrm](https://github.com/Pana/nrm), just for learning something interesting.

## Install

```bash
npm i -g nrmm
```

## Usage

List all available registries:

```bash
nrmm ls
```

Show current registry:
```bash
nrmm current
```

Switch registry:

```bash
nrmm use [registry]
```

Add a new registry:

```bash
nrmm add
```

Delete a registry:
```bash
nrmm del
```

Edit a registry:

```bash
nrmm edit
```

Rename a registry:

```bash
nrmm rename
```

Test the response time of registry:

```bash
nrmm ping [registry]
```

## License

MIT