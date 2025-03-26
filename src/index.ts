import { tasks } from '@astrojs/cli-kit';
import { getContext } from './actions/context.js';
import { help } from './actions/help.js';
import { next } from './actions/next-steps.js';
import { projectName } from './actions/project-name.js';
import { verify } from './actions/verify.js';
import { template } from './actions/template.js';
import { dependencies } from './actions/dependencies.js';
import { git } from './actions/git.js';
import { hydrogen } from './actions/hydrogen.js';
import { sanity } from './actions/sanity.js';

const exit = () => process.exit(0);
process.on('SIGINT', exit);
process.on('SIGTERM', exit);

export async function main() {
	// Add some extra spacing from the noisy npm/pnpm init output
	// eslint-disable-next-line no-console
	console.log('');

	const ctx = await getContext(process.argv);

	if (ctx.help) {
		help();
		return;
	}

	const steps = [verify, projectName, template, dependencies, hydrogen, sanity, git];

	for (const step of steps) {
		await step(ctx);
	}

	// eslint-disable-next-line no-console
	console.log('');

	const labels = {
		start: 'Project initializing...',
		end: 'Project initialized!',
	};
	await tasks(labels, ctx.tasks);

	await next(ctx);

	process.exit(0);
}
