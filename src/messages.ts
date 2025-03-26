import { color, say as houston, label } from '@astrojs/cli-kit';
import { align, sleep } from '@astrojs/cli-kit/utils';
import fs from 'node:fs';
import path from 'node:path';
import stripAnsi from 'strip-ansi';

let stdout = process.stdout;

export const title = (text: string) => align(label(text), 'end', 7) + ' ';

export const log = (message: string) => stdout.write(message + '\n');

export async function say(messages: string | string[], { clear = false, hat = '', tie = '' } = {}) {
	return houston(messages, { clear, hat, tie, stdout });
}

export const banner = () => {
	const prefix = `frontvibe`;
	const suffix = `Launch sequence initiated.`;
	log(`${label(prefix, color.bgGreen, color.black)}  ${suffix}`);
};

export const bannerAbort = () =>
	log(`\n${label('fluid', color.bgRed)} ${color.bold('Launch sequence aborted.')}`);

export const info = async (prefix: string, text: string) => {
	await sleep(100);
	if (stdout.columns < 80) {
		log(`${' '.repeat(5)} ${color.cyan('◼')}  ${color.cyan(prefix)}`);
		log(`${' '.repeat(9)}${color.dim(text)}`);
	} else {
		log(`${' '.repeat(5)} ${color.cyan('◼')}  ${color.cyan(prefix)} ${color.dim(text)}`);
	}
};
export const error = async (prefix: string, text: string) => {
	if (stdout.columns < 80) {
		log(`${' '.repeat(5)} ${color.red('▲')}  ${color.red(prefix)}`);
		log(`${' '.repeat(9)}${color.dim(text)}`);
	} else {
		log(`${' '.repeat(5)} ${color.red('▲')}  ${color.red(prefix)} ${color.dim(text)}`);
	}
};

export const nextSteps = async ({
	projectDir,
	devCmd,
	cwd,
}: {
	projectDir: string;
	devCmd: string;
	cwd: string;
}) => {
	const max = stdout.columns;
	const prefix = max < 80 ? ' ' : ' '.repeat(9);

	log(`\n ${color.bgCyan(` ${color.black('next')} `)}  ${color.bold('Explore your project!')}`);

	await sleep(100);

	if (projectDir !== '') {
		projectDir = projectDir.includes(' ') ? `"./${projectDir}"` : `./${projectDir}`;
		const enter = [
			`\n${prefix}Enter your project directory using`,
			color.cyan(`cd ${projectDir}.`, ''),
		];
		const len = enter[0].length + stripAnsi(enter[1]).length;
		log(enter.join(len > max ? '\n' + prefix : ' '));
	}

	if (!fs.existsSync(path.join(cwd, '.env'))) {
		log(
			`${prefix}Don't forget to create a ${color.cyan(
				'.env',
			)} file based on ${color.cyan('.env.template')}.`,
		);
	}

	log(
		`${prefix}To automatically synchronize your Shopify products and collections with your Sanity project,\n${prefix}add the Sanity Connect app in your Shopify store: ${color.cyan('https://apps.shopify.com/sanity-connect')}.`,
	);

	log(
		`${prefix}Run ${color.cyan(devCmd)} to start the dev server. ${color.cyan('CTRL+C')} to stop.`,
	);

	await sleep(200);
};

export function printHelp({
	commandName,
	headline,
	usage,
	tables,
	description,
}: {
	commandName: string;
	headline?: string;
	usage?: string;
	tables?: Record<string, [command: string, help: string][]>;
	description?: string;
}) {
	const linebreak = () => '';
	const table = (rows: [string, string][], { padding }: { padding: number }) => {
		const split = stdout.columns < 60;
		let raw = '';

		for (const row of rows) {
			if (split) {
				raw += `    ${row[0]}\n    `;
			} else {
				raw += `${`${row[0]}`.padStart(padding)}`;
			}
			raw += '  ' + color.dim(row[1]) + '\n';
		}

		return raw.slice(0, -1); // remove latest \n
	};

	let message = [];

	if (headline) {
		message.push(
			linebreak(),
			`${title(commandName)} ${color.green(`v${process.env.PACKAGE_VERSION ?? ''}`)} ${headline}`,
		);
	}

	if (usage) {
		message.push(linebreak(), `${color.green(commandName)} ${color.bold(usage)}`);
	}

	if (tables) {
		function calculateTablePadding(rows: [string, string][]) {
			return rows.reduce((val, [first]) => Math.max(val, first.length), 0);
		}
		const tableEntries = Object.entries(tables);
		const padding = Math.max(...tableEntries.map(([, rows]) => calculateTablePadding(rows)));
		for (const [, tableRows] of tableEntries) {
			message.push(linebreak(), table(tableRows, { padding }));
		}
	}

	if (description) {
		message.push(linebreak(), `${description}`);
	}

	log(message.join('\n') + '\n');
}
