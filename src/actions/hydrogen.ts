import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

import type { Context } from './context.js';

import { error, info, title } from '../messages.js';
import { color } from '@astrojs/cli-kit';

export async function hydrogen(
	ctx: Pick<Context, 'cwd' | 'hydrogen' | 'confirmHydrogen' | 'prompt' | 'tasks' | 'install'>,
) {
	let _hydrogen = ctx.hydrogen;
	let _confirmHydrogen = ctx.confirmHydrogen;

	if (_hydrogen === undefined) {
		({ hydrogen: _hydrogen } = await ctx.prompt({
			name: 'hydrogen',
			type: 'confirm',
			label: title('hydrogen'),
			message: `Initialize or link an existing Hydrogen storefront?`,
			hint: 'optional',
			initial: true,
		}));
	}

	if (_hydrogen && _confirmHydrogen === undefined) {
		({ confirmHydrogen: _confirmHydrogen } = await ctx.prompt({
			name: 'confirmHydrogen',
			type: 'confirm',
			label: title('hydrogen'),
			message: `Do you have the Hydrogen channel installed on your Shopify store?`,
			initial: true,
		}));
	}

	if (_hydrogen && _confirmHydrogen) {
		ctx.tasks.push({
			pending: 'Hydrogen',
			start: `Linking Hydrogen storefront and pulling environment variables...`,
			end: 'Hydrogen linked and environment variables pulled',
			onError: (e) => {
				error(
					'error',
					`Error linking Hydrogen, make sure you have installed the Shopify Hydrogen channel.`,
				);
			},
			while: () => linkAndPullEnv({ cwd: ctx.cwd, install: ctx.install }),
		});
	} else if (_hydrogen && !_confirmHydrogen) {
		await info(
			'Sounds good!',
			`You can install the Hydrogen channel here: ${color.reset('https://apps.shopify.com/hydrogen')}`,
		);
	} else {
		await info(
			'Sounds good!',
			`You can always run ${color.reset('shopify hydrogen link')}${color.dim(' manually.')} And run ${color.reset('shopify hydrogen env pull')}${color.dim(' to pull the environment variables.')}`,
		);
	}
}

async function linkAndPullEnv({ cwd, install }: { cwd: string; install?: boolean }) {
	let linked = false;

	try {
		const command = install ? 'npm exec shopify hydrogen link' : 'npx shopify@latest hydrogen link';
		execSync(command, {
			cwd,
			stdio: 'inherit',
		});
		linked = validateLink(cwd);
	} catch (e) {
		throw new Error(`Error linking Hydrogen`);
	}

	if (linked) {
		const command = install
			? 'npm exec shopify hydrogen env pull'
			: 'npx shopify@latest hydrogen env pull';
		try {
			execSync(command, {
				cwd,
				stdio: 'inherit',
			});
			updateEnv(cwd);
		} catch (e) {
			throw new Error(`Error pulling environment variables`);
		}
	} else {
		throw new Error(`Error linking Hydrogen`);
	}
}

function validateLink(cwd: string) {
	const pathToShopifyProjectFile = path.join(cwd, '.shopify/project.json');

	if (!fs.existsSync(pathToShopifyProjectFile)) {
		return false;
	}

	const shopifyProjectFile = fs.readFileSync(pathToShopifyProjectFile, 'utf8');

	try {
		const storefrontId = JSON.parse(shopifyProjectFile)?.storefront?.id;
		if (!storefrontId) {
			return false;
		} else if (storefrontId.startsWith('gid://shopify/HydrogenStorefront')) {
			return true;
		}
		return false;
	} catch (e) {
		return false;
	}
}

function updateEnv(cwd: string) {
	const env = fs.readFileSync(path.join(cwd, '.env'), 'utf8');
	const PUBLIC_STORE_DOMAIN = env.split('PUBLIC_STORE_DOMAIN=')[1].split('\n')[0];
	fs.writeFileSync(path.join(cwd, '.env'), `${env}\nPUBLIC_CHECKOUT_DOMAIN=${PUBLIC_STORE_DOMAIN}`);
}
