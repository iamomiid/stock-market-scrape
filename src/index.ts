import Puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import { symbols } from './config';

// interface;

class StockScrape {
	browser!: Puppeteer.Browser;
	async scrape(id: number, pageNumber = 1) {
		const page = await this.browser.newPage();
		await page.goto(`http://tsetmc.com/Loader.aspx?ParTree=151311&i=${id}`, { waitUntil: 'domcontentloaded' });
		const selector = 'a.torquoise';
		await page.evaluate((selector) => document.querySelectorAll(selector)[0].click(), selector);
		await new Promise((r) => setTimeout(r, 3000));
		const $ = cheerio.load(await page.content());
		$('.objbox .obj tr').each((_, i) => {
			const arr: CheerioElement[] = [];
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
			for (const element of arr) {
				console.log(element.data);
			}
		});
		const selector2 = '.pagingBlock a';
		await page.evaluate((selector) => document.querySelectorAll(selector)[1].click(), selector2);
		await page.screenshot({ path: 'example.png' });
	}

	async start() {
		this.browser = await Puppeteer.launch({ defaultViewport: { width: 1920, height: 2000 } });
		for await (const symbol of symbols) {
			await this.scrape(symbol.id);
			await new Promise((r) => setTimeout(r, 5000));
		}
		await this.browser.close();
	}
}

const scrapper = new StockScrape();
scrapper.start();
