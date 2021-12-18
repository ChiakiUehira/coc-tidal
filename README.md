# coc-tidal

coc.nvim extension for TidalCycles

## Install

`:CocInstall coc-tidal`

## Screenshot

![screenshot](https://user-images.githubusercontent.com/12339312/146631261-f29c3092-83f4-4f94-a1f3-a8cefd639f47.png)



## Features

- AutoCompletions
  - [x] sample name
  - [ ] synth name
  - [x] functions
- Searchs
  - [x] samples name
  - [ ] synth name
  - [ ] functions

### Search

search for sample name

```
:CocList samples
```

## Extension Settings

### Set samples path

Set the path of the samples directory to load

Examples:

```
"tidal.samplePath": "/Users/chiakiuehira/Library/Application Support/SuperCollider/downloaded-quarks/Dirt-Samples"
```

### Configuration options

- `tidal.enabled` Enable this plugin. default: `true`
- `tidal.samplePath` Set the path of the samples directory to load. default: `""`

## Please

The documentation for the basic functions is incomplete.

Please edit the following file and send a PullRequest.

[docs.json]: https://github.com/ChiakiUehira/coc-tidal/blob/main/docs.json

This definition was created using the following file as a reference. Thanks.

[https://gist.github.com/mxactvtd/bf3fb357a419c7f063b98dfd9a66cf78]: https://gist.github.com/mxactvtd/bf3fb357a419c7f063b98dfd9a66cf78

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
