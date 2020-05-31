# install-vapoursynth-action

![Run tests](https://github.com/Irrational-Encoding-Wizardry/install-vapoursynth-action/workflows/Run%20tests/badge.svg?branch=master)

This action installs vapoursynth on your CI by compiling and caching your compilation.

## Usage

Please always use a `v`-branch (e.g. `v0.1`) to automatically receive updated version definitions.

```yaml
      - name: Install VapourSynth
        uses: Irrational-Encoding-Wizardry/install-vapoursynth-action@v0.1
        with:
          version: 50
          cache: true
```

## Notes

### Unsupported stuff

Please note that the compiled result will not come with the following vapoursynth-plugins and tools.
* `core.ocr` (Tesseract)
* `core.imwri` (ImageMagick)
* `core.sub` (LibASS and FFmpeg)
* `vsrepo` (and associated tools)
* `vspipe`

### Supported Versions

Currently it is tested with these versions on Windows and Linux:

| VapourSynth | Python-Version | Notes |
| ----------- | --------- | ---- |
| R50 | Python 3.8 | |
| R49 | Python 3.8 | |
| R47.2 | Python 3.7 | |
| R47.1 | Python 3.7 | |
| R47.0 | Python 3.7 | Linux not supported for `R47.0` |
| R46 | Python 3.7 | |
| R45.1 | Python 3.7 | |
| R45.0 | Python 3.7 | |
| R44 | Python 3.6 | |

*Omitting the minor version will always install the newest minor version of the release.*
