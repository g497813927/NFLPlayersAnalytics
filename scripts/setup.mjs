/** First-time or repeat setup; requires only Node/npm and uv on PATH. */
import { spawnSync } from 'node:child_process';
import { constants, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function runStep(label, command, args) {
  console.log(`\n[setup] ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw new Error(
      `${label} could not start. Check that the required tool is installed and on PATH.`,
    );
  }
  if (result.signal || result.status !== 0) {
    throw new Error(
      `${label} did not finish successfully. Resolve the message above and run npm run setup again.`,
    );
  }
}

function createMissingEnvironment(service) {
  const source = resolve(root, service, '.env.example');
  const destination = resolve(root, service, '.env');

  try {
    // Exclusive creation protects existing files even if another setup runs.
    copyFileSync(source, destination, constants.COPYFILE_EXCL);
    console.log(`[setup] Created ${service}/.env from its example.`);
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.log(`[setup] Preserved existing ${service}/.env.`);
      return;
    }
    throw new Error(
      `Could not create ${service}/.env. Check the example file and directory permissions.`,
    );
  }
}

function setup() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) {
    throw new Error(
      'Node.js 22.12 or newer is required. Upgrade Node, then run npm run setup again.',
    );
  }

  // npm supplies its CLI path to scripts. Running it with Node avoids Windows
  // .cmd shell quoting and works when the checkout or Node path contains spaces.
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    throw new Error('Start setup with npm run setup from the repository root.');
  }

  console.log('[setup] Stop running development servers before installing dependencies.');
  runStep(
    'Checking uv (install it from https://docs.astral.sh/uv/ if missing)',
    'uv',
    ['--version'],
  );
  runStep('Installing launcher dependencies', process.execPath, [npmCli, 'ci']);
  runStep('Installing frontend dependencies', process.execPath, [npmCli, '--prefix', 'frontend', 'ci']);
  runStep('Installing backend dependencies', 'uv', [
    'sync',
    '--directory', 'backend',
    '--frozen',
    '--python', '3.12',
  ]);

  createMissingEnvironment('backend');
  createMissingEnvironment('frontend');

  runStep('Preparing the configured database without replacing existing data', 'uv', [
    'run',
    '--directory', 'backend',
    '--frozen',
    'python', '-m', 'scripts.setup_db',
  ]);

  console.log('\n[setup] Ready. Start both servers with npm run dev.');
  console.log('[setup] Terminal SQL output: set SQL_ECHO=true in backend/.env, then restart.');
  console.log('[setup] New environment files enable terminal SQL; existing settings are preserved.');
}

try {
  setup();
} catch (error) {
  console.error(`\n[setup] ${error.message}`);
  process.exitCode = 1;
}
