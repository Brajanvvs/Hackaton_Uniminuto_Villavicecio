import { spawn } from 'node:child_process';

const apps = [
  { name: 'api', prefix: 'server' },
  { name: 'web', prefix: 'client' },
];

const children = apps.map(({ name, prefix }) => {
  const child = spawn(`npm run dev --prefix ${prefix}`, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });
  const write = (stream) => (chunk) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line) stream.write(`[${name}] ${line}\n`);
    }
  };
  child.stdout.on('data', write(process.stdout));
  child.stderr.on('data', write(process.stderr));
  child.on('exit', (code) => {
    console.log(`[${name}] terminó con código ${code}`);
    stopAll();
    process.exitCode = code ?? 0;
  });
  return child;
});

function stopAll() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
