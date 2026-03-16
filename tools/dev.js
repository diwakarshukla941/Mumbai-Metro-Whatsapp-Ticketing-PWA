import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const processes = [
  spawn(npmCommand, ['run', 'dev', '--prefix', 'backend'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  }),
  spawn(npmCommand, ['run', 'dev', '--prefix', 'frontend'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  }),
]

const shutdown = (exitCode = 0) => {
  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGINT')
    }
  }

  setTimeout(() => process.exit(exitCode), 200)
}

for (const child of processes) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown(code)
      return
    }
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
