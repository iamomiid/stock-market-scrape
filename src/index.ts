import Puppeteer from 'puppeteer';
import moment from 'moment-jalaali';
import cheerio from 'cheerio';
import { symbols } from './config';

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

function toDate(input: string) {
	return input;
}

class StockScrape {
	browser!: Puppeteer.Browser;

	async scrape(id: number, pageNumber = 1) {
		const page = await this.browser.newPage();
		await page.goto(`http://tsetmc.com/Loader.aspx?ParTree=151311&i=${id}`, {
			waitUntil: 'domcontentloaded',
		});
		const selector = 'a.torquoise';
		await page.evaluate((selector) => document.querySelectorAll(selector)[0].click(), selector);
		await new Promise((r) => setTimeout(r, 3000));
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
		const total: DateObject[] = [];
		let obj: DateObject = {};
		let i = 0;
		for (const element of arr) {
			if (element.data!.trim().length == 0) {
				console.log(obj);
				total.push(obj);
				i = 0;
				obj = {};
			} else {
				const enumKey = getEnumKeyByEnumValue(i++);
				if (enumKey == 'PreviousDate') continue;
				if (enumKey == 'DateJalaali') {
					obj[enumKey] = toDate(element.data!);
				} else {
					obj[enumKey] = toNumber(element.data!);
				}
			}
		}
		const selector2 = '.pagingBlock a';
		await page.evaluate((selector) => document.querySelectorAll(selector)[1].click(), selector2);
		await page.screenshot({ path: 'example.png' });
	}

	async start() {
		this.browser = await Puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 } });
		for await (const symbol of symbols) {
			await this.scrape(symbol.id);
			await new Promise((r) => setTimeout(r, 5000));
		}
		await this.browser.close();
	}
}

const scrapper = new StockScrape();
scrapper.start();
