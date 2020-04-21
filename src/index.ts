import Puppeteer from 'puppeteer';
import moment from 'moment-jalaali';
import fs from 'fs';
import path from 'path';
import * as csv from 'fast-csv';
import cheerio from 'cheerio';
import { symbols, Symbol } from './config';

moment.loadPersian();

enum Keys {
	HighestPrice,
	LowestPrice,
	FinalPricePercent,
	FinalPriceDiff,
	FinalPrice,
	LastTransactionPercent,
	LastTransactionDiff,
	LastTransaction,
	FirstPrice,
	YesterdayPrice,
	Value,
	Volume,
	Count,
	DateJalaali,
	PreviousDate,
	DayOfWeek,
	WeekOfYear,
}

type RowKey = keyof typeof Keys;

type DateObject = { [key in RowKey]?: Number | string };

function getEnumKeyByEnumValue(enumValue: number) {
	let keys = Object.keys(Keys).filter((x) => Keys[x as RowKey] == enumValue) as RowKey[];
	return keys[0]!;
}

function toNumber(input: string) {
	return Number(input.trim().replace(/,/g, ''));
}

function getDayOfWeek(input: string) {
	return moment(input, 'jYYYY/jMM/jDD').weekday();
}

function getWeekOfYear(input: string) {
	return moment(input, 'jYYYY/jMM/jDD').jWeek();
}

class SymbolScrape {
	data: DateObject[];
	dest: string;

	constructor(private browser: Puppeteer.Browser, private symbol: Symbol) {
		console.log(`Scraping: ${symbol.code}`);
		this.data = [];
		this.dest = path.resolve(__dirname, '..', 'output', `${this.symbol.code}.csv`);
	}

	public async start() {
		await this.scrape();
		return await this.save();
	}

	private async scrape(count = 200) {
		const page = await this.browser.newPage();
		console.log('Fetching main page');
		await page.goto(`http://tsetmc.com/Loader.aspx?ParTree=151311&i=${this.symbol.id}`, {
			waitUntil: 'domcontentloaded',
		});
		const selector = 'a.torquoise';
		console.log('Fetching history');
		await page.evaluate((selector) => document.querySelectorAll(selector)[0].click(), selector);
		await new Promise((r) => setTimeout(r, 3000));
		let current = 0;
		let pageNumber = 0;
		while (current < count) {
			const selector2 = '.pagingBlock a';
			await page.evaluate(
				(selector, page) => document.querySelectorAll(selector)[page].click(),
				selector2,
				pageNumber++
			);
			const $ = cheerio.load(await page.content());
			const arr: CheerioElement[] = [];
			$('.objbox .obj tr').each((_, i) => {
				i.children
					.filter((v) => v.name == 'td')
					.forEach((v) =>
						v.children.forEach((vi) => {
							if (vi.type == 'text') {
								arr.push(vi);
							} else if (vi.name == 'span') {
								arr.push(...vi.children);
							}
						})
					);
			});
			current = this.transform(arr);
			console.log('Checking next page');
		}
		console.log(`Fetched ${this.data.length} days`);
	}

	private transform(input: CheerioElement[]) {
		let obj: DateObject = {};
		let i = 0;
		for (const element of input) {
			if (element.data!.trim().length == 0) {
				if (obj.Volume) {
					this.add(obj);
				}
				i = 0;
				obj = {};
			} else {
				const enumKey = getEnumKeyByEnumValue(i++);
				if (enumKey == 'PreviousDate') continue;
				if (enumKey == 'DateJalaali') {
					obj[enumKey] = element.data!;
					obj['DayOfWeek'] = getDayOfWeek(element.data!);
					obj['WeekOfYear'] = getWeekOfYear(element.data!);
				} else {
					obj[enumKey] = toNumber(element.data!);
				}
			}
		}
		return this.data.length;
	}

	private add(row: DateObject) {
		const dupp = this.data.filter((v) => v.DateJalaali == row.DateJalaali);
		if (dupp.length == 0) {
			this.data.push(row);
		}
	}

	private async save() {
		console.log('Saving');
		const csvStream = csv.format({ headers: true });
		csvStream.pipe(fs.createWriteStream(this.dest));
		for (const row of this.data) {
			csvStream.write(row);
		}
		csvStream.end();
		console.log(`Saved to ${this.dest}`);
	}
}

async function start() {
	const browser = await Puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 } });
	console.log('Starting to scrape');
	for await (const symbol of symbols) {
		const symbolScrape = new SymbolScrape(browser, symbol);
		await symbolScrape.start();
		await new Promise((r) => setTimeout(r, 1000));
	}
	await browser.close();
}

start();
