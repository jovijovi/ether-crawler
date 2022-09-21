# Ether Crawler

[![GitHub Actions](https://github.com/jovijovi/ether-crawler/workflows/Test/badge.svg)](https://github.com/jovijovi/ether-crawler)

A transaction crawler for the Ethereum ecosystem.

## Features

- Dump `transfer` transaction to database

## Supported Chains

- [Ethereum](https://ethereum.org/)
- [Polygon](https://polygon.technology/)

## Development Environment

- typescript `4.8.3`
- node `v16.17.0`
- ts-node `v10.9.1`
- yarn `v1.22.19`


## Quick Guide

- Install dependency

  ```shell
  yarn
  ```

- Build code

  Install all dependencies and compile code.

  ```shell
  make build
  ```

- Build docker image

  ```shell
  make docker
  ```

- Run

    - Params

        - `--config` Config filepath. Example:

          ```shell
          ts-node ./src/main/index.ts --config ./conf/app.config.yaml
          ```

    - Run code directly by `ts-node`

      ```shell
      yarn dev-run --config ./conf/app.config.yaml
      ```

    - Run compiled code by `node`

      ```shell
      yarn dist-run --config ./conf/app.config.yaml
      ```

- Clean

  ```shell
  make clean
  ```

## Roadmap

- Support more transaction type

## License

[MIT](LICENSE)
