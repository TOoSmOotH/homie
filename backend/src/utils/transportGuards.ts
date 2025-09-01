import { logger } from './logger';

// Docker API allowlist - read-only endpoints only
const DEFAULT_DOCKER_ALLOWED_METHODS = new Set(['GET', 'HEAD']);
const DEFAULT_DOCKER_ALLOWED_PATHS: RegExp[] = [
  /^\/version$/,
  /^\/info$/,
  /^\/containers\/json$/,
  /^\/containers\/[^/]+\/json$/,
  /^\/images\/json$/,
  /^\/images\/[^/]+\/json$/
];

export function validateDockerRequest(method: string, path: string): void {
  const upper = (method || 'GET').toUpperCase();
  if (!DEFAULT_DOCKER_ALLOWED_METHODS.has(upper)) {
    throw new Error(`Docker method not allowed: ${upper}`);
  }
  const ok = DEFAULT_DOCKER_ALLOWED_PATHS.some((re) => re.test(path));
  if (!ok) {
    throw new Error(`Docker path not allowed: ${path}`);
  }
}

// SSH command allowlist (prefix-based) and blocklist (token-based)
const DEFAULT_SSH_ALLOWED_PREFIXES = [
  'cat ',
  'df',
  'uptime',
  'ls',
  'ps',
  'free',
  'whoami',
  'uname',
  'hostname'
];

const DEFAULT_SSH_BLOCK_TOKENS = [
  ' rm ', ' mkfs', ' dd ', ' shutdown', ' reboot', ' :(){', ' chmod ', ' chown ', ' useradd ', ' userdel ',
  ' systemctl stop', ' systemctl restart', ' service stop', ' service restart',
  ' >', '>>', '2>', '|', '&&', ';'
];

export function validateSshCommand(command: string): void {
  const cmd = (command || '').trim();
  if (!cmd) throw new Error('SSH command is required');

  // Blocklist first
  const lowerSpaced = ` ${cmd.toLowerCase()} `;
  for (const token of DEFAULT_SSH_BLOCK_TOKENS) {
    if (lowerSpaced.includes(token)) {
      throw new Error(`SSH command contains blocked token: ${token.trim()}`);
    }
  }

  // Allowlist by prefix
  const allowed = DEFAULT_SSH_ALLOWED_PREFIXES.some((p) => cmd.startsWith(p));
  if (!allowed) {
    throw new Error('SSH command not allowed by policy');
  }
}

