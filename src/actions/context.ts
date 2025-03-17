import type { Task } from '@astrojs/cli-kit';

import { prompt } from '@astrojs/cli-kit';
import arg from 'arg';

export interface Context {
	help: boolean;
	prompt: typeof prompt;
	cwd: string;
	packageManager: string;
	projectName?: string;
	template?: string;
	install?: boolean;
	git?: boolean;
	stdin?: typeof process.stdin;
	stdout?: typeof process.stdout;
	exit(code: number): never;
	tasks: Task[];
}

export async function getContext(argv: string[]): Promise<Context> {
	const flags = arg(
		{
			'--template': String,
			'--install': Boolean,
			'--no-install': Boolean,
			'--git': Boolean,
			'--no-git': Boolean,
			'--help': Boolean,
			'-h': '--help',
			'-t': '--template',
		},
		{ argv, permissive: true },
	);

	const packageManager = detectPackageManager() ?? 'npm';
	let cwd = process.cwd();

	let {
		'--help': help = false,
		'--template': template,
		'--install': install,
		'--no-install': noInstall,
		'--git': git,
		'--no-git': noGit,
	} = flags;
	let projectName = cwd;

	const context: Context = {
		help,
		prompt,
		packageManager,
		projectName,
		template,
		install: install ?? (noInstall ? false : undefined),
		git: git ?? (noGit ? false : undefined),
		cwd,
		exit(code) {
			process.exit(code);
		},
		tasks: [],
	};
	return context;
}

function detectPackageManager() {
	if (!process.env.npm_config_user_agent) return;
	const specifier = process.env.npm_config_user_agent.split(' ')[0];
	const name = specifier.substring(0, specifier.lastIndexOf('/'));
	return name === 'npminstall' ? 'cnpm' : name;
}
