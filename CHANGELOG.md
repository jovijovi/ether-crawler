# Changelog

## [v0.3.0](https://github.com/jovijovi/ether-crawler/releases/tag/v0.3.0)

Features:

- Load module by module loader
- (crawler): progress bar

Build:

- Bump packages

## [v0.2.0](https://github.com/jovijovi/ether-crawler/releases/tag/v0.2.0)

Features:

- Add 'toBlock' and 'keepRunning' to config
- Save ether_value to database
- Random retry interval
- Load default values if not configured
- Force update database if the data already exists

Refactor:

- Init crawler with config
- Remove useless code

Fixes:

- (crawler/db): 'value' out of range error for MySQL
- (crawler): use strict equality operators

Build:

- Bump packages

## [v0.1.1](https://github.com/jovijovi/ether-crawler/releases/tag/v0.1.1)

Refactor:

- (handler): instead of 'eth' by @jovijovi/ether-core-api package

## [v0.1.0](https://github.com/jovijovi/ether-crawler/releases/tag/v0.1.0)

Features:

- (crawler): dump `transfer` transaction to database
