# Stock Market Scrapper
This repository scrapes Iran Stock Market website and collects data.
It uses [Puppeteer](https://github.com/puppeteer/puppeteer) for scraping.

## Add/Remove Symbol
Edit `/src/config/index.ts` file. Follow the interface given in the file.

## Install
1. Add desired symbols.
2. `yarn install`
3. `yarn start`
4. Enjoy the scrapped data :)

## Note
This script waits `3000ms` for fetching history and `1000ms` between each symbol. Feel free to change it based on your internet speed.