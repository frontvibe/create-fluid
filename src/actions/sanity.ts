import fs from 'node:fs';

import type { Context } from './context.js';

import { error, info, log, title } from '../messages.js';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { color } from '@astrojs/cli-kit';

export async function sanity(
	ctx: Pick<Context, 'cwd' | 'sanity' | 'prompt' | 'tasks' | 'install'>,
) {
	let _sanity = ctx.sanity;
	if (_sanity === undefined) {
		({ sanity: _sanity } = await ctx.prompt({
			name: 'sanity',
			type: 'confirm',
			label: title('sanity'),
			message: `Initialize or link a Sanity project?`,
			hint: 'optional',
			initial: true,
		}));
	}

	if (_sanity) {
		ctx.tasks.push({
			pending: 'Sanity',
			start: `Linking Sanity project and pulling environment variables...`,
			end: 'Sanity linked and environment variables pulled',
			onError: (e) => {
				error('error', e);
			},
			while: () => linkAndPullEnv({ cwd: ctx.cwd, install: ctx.install }),
		});
	} else {
		await info(
			'Sounds good!',
			`You can always run ${color.reset('sanity init --env .env.sanity')}${color.dim(' manually.')}`,
		);
	}
}

async function linkAndPullEnv({ cwd, install }: { cwd: string; install?: boolean }) {
	let linked = false;
	let envUpdated = false;

	function checkFileExists(filePath: string) {
		return fs.existsSync(path.join(cwd, filePath));
	}

	try {
		const command = install
			? 'npm exec -- sanity init --env .env.sanity'
			: 'npx sanity@latest init --env .env.sanity';
		execSync(command, {
			cwd,
			stdio: 'inherit',
		});
		linked = true;
	} catch (e) {
		throw new Error(`Error linking Sanity`);
	}

	if (linked) {
		try {
			if (checkFileExists('.env.sanity')) {
				const env = checkFileExists('.env') ? fs.readFileSync(path.join(cwd, '.env'), 'utf8') : '';
				const sanityEnv = fs.readFileSync(path.join(cwd, '.env.sanity'), 'utf8');
				const DATASET = sanityEnv.split('PUBLIC_SANITY_DATASET=')[1].split('\n')[0];
				const PROJECT_ID = sanityEnv.split('PUBLIC_SANITY_PROJECT_ID=')[1].split('\n')[0];

				fs.writeFileSync(
					path.join(cwd, '.env'),
					`${env}\nPUBLIC_SANITY_STUDIO_DATASET=${DATASET}\nPUBLIC_SANITY_STUDIO_PROJECT_ID=${PROJECT_ID}\nSANITY_STUDIO_USE_PREVIEW_MODE=true`,
				);

				fs.rmSync(path.join(cwd, '.env.sanity'));

				envUpdated = true;
			} else {
				throw new Error(`Error pulling environment variables`);
			}
		} catch (e) {
			throw new Error(`Error pulling environment variables`);
		}
	}

	if (envUpdated && install) {
		try {
			log(`\nCreating CORS...\n`);
			execSync('npm run create:cors', {
				cwd,
				stdio: 'ignore',
			});
		} catch (e) {
			log(`${e}`);
			throw new Error(`Error creating CORS`);
		}

		try {
			log(`Creating token...\n`);
			execSync('npm run create:token', {
				cwd,
				stdio: 'ignore',
			});
		} catch (e) {
			throw new Error(`Error creating token`);
		}
	} else {
		log(`\nSkipping CORS and token creation as dependencies are not installed...\n`);
	}
}
