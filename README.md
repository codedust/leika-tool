<!--
SPDX-FileCopyrightText: 2021 codedust

SPDX-License-Identifier: EUPL-1.2
-->

# Leika-Tool

## Update leika.csv
First, update `web/leika.csv` by executing the download script:

```console
$ poetry install
$ poetry run python download-leika.py
```

The script will download the LeiKa from FIM Repository and convert it to UTF-8.

## Serving static contents
The contents of the 'web/' directory can now be statically served.

```console
$ cd web
$ python -m http.server
```

## License
Licensed under the [EUPL](./LICENSE.txt).
