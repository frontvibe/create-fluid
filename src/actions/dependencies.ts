import fs from 'node:fs';
import path from 'node:path';
import { color } from '@astrojs/cli-kit';
import { error, info, title } from '../messages.js';

import type { Context } from './context.js';
import { shell } from '../shell.js';

export async function dependencies(
	ctx: Pick<Context, 'install' | 'prompt' | 'packageManager' | 'cwd' | 'tasks'>,
) {
	let deps = ctx.install;
	if (deps === undefined) {
		({ deps } = await ctx.prompt({
			name: 'deps',
			type: 'confirm',
			label: title('deps'),
			message: `Install dependencies?`,
			hint: 'recommended',
			initial: true,
		}));
		ctx.install = deps;
	}

	if (deps) {
		ctx.tasks.push({
			pending: 'Dependencies',
			start: `Dependencies installing with ${ctx.packageManager}...`,
			end: 'Dependencies installed',
			onError: (e) => {
				error('error', e);
				error(
					'error',
					`Dependencies failed to install, please run ${color.bold(
						ctx.packageManager + ' install',
					)} to install them manually after setup.`,
				);
			},
			while: () => install({ packageManager: ctx.packageManager, cwd: ctx.cwd }),
		});
	} else {
		await info('No problem!', 'Remember to install dependencies after setup.');
	}
}

async function install({ packageManager, cwd }: { packageManager: string; cwd: string }) {
	if (packageManager === 'yarn') await ensureYarnLock({ cwd });
	return shell(packageManager, ['install'], {
		cwd,
		timeout: 90_000,
		stdio: 'ignore',
	});
}

/**
 * Yarn Berry (PnP) versions will throw an error if there isn't an existing `yarn.lock` file
 * If a `yarn.lock` file doesn't exist, this function writes an empty `yarn.lock` one.
 * Unfortunately this hack is required to run `yarn install`.
 *
 * The empty `yarn.lock` file is immediately overwritten by the installation process.
 * See https://github.com/withastro/astro/pull/8028
 */
async function ensureYarnLock({ cwd }: { cwd: string }) {
	const yarnLock = path.join(cwd, 'yarn.lock');
	if (fs.existsSync(yarnLock)) return;
	return fs.promises.writeFile(yarnLock, '', { encoding: 'utf-8' });
}
