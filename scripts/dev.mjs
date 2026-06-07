import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function normalizedEnv() {
  const env = { ...process.env, FORCE_COLOR: '1' };

  if (process.platform === 'win32') {
    const pathValue = env.Path || env.PATH;
    delete env.Path;
    delete env.PATH;
    if (pathValue) {
      env.Path = pathValue;
    }
  }

  return env;
}

const processes = [
  {
    name: 'backend',
    command: `${npm} run dev --workspace backend`,
  },
  {
    name: 'frontend',
    command: `${npm} run dev --workspace frontend -- --host 0.0.0.0`,
  },
];

const children = processes.map(({ name, command }) => {
  const child = spawn(command, {
    stdio: 'pipe',
    shell: true,
    env: normalizedEnv(),
  });

  child.stdout.on('data', (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on('exit', (code, signal) => {
    if (signal) {
      process.stderr.write(`[${name}] stopped by ${signal}\n`);
    } else if (code !== 0) {
      process.stderr.write(`[${name}] exited with code ${code}\n`);
    }
  });

  return child;
});

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});
