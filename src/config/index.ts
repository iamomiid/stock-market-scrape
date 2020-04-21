export interface Symbol {
	id: BigInt;
	code: string;
	days: number;
}

export const symbols: Symbol[] = [
	{ id: BigInt('20562694899904339'), code: 'PRDZ1', days: 200 },
	{ id: BigInt('7711282667602555'), code: 'PARK1', days: 200 },
	{ id: BigInt('46348559193224090'), code: 'FOLD1', days: 200 },
	{ id: BigInt('44013656953678055'), code: 'NOLZ1', days: 200 },
	{ id: BigInt('1625149423498289'), code: 'SMBZ1', days: 200 },
];
