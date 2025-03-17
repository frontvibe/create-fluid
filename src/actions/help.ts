import { printHelp } from '../messages.js';

export function help() {
	printHelp({
		commandName: 'npm create fluid',
		usage: '[dir] [...flags]',
		headline: 'Scaffold Fluid projects.',
		tables: {
			Flags: [
				['--help (-h)', 'See all available flags.'],
				['--install / --no-install', 'Install dependencies (or not).'],
				['--git / --no-git', 'Initialize git repo (or not).'],
			],
		},
	});
}
