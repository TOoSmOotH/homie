import { validateDockerRequest, validateSshCommand } from '../../../src/utils/transportGuards';

describe('transportGuards', () => {
  describe('validateDockerRequest', () => {
    it('allows GET /version', () => {
      expect(() => validateDockerRequest('GET', '/version')).not.toThrow();
    });

    it('blocks POST /containers/create', () => {
      expect(() => validateDockerRequest('POST', '/containers/create')).toThrow();
    });

    it('blocks GET /containers/kill', () => {
      expect(() => validateDockerRequest('GET', '/containers/kill')).toThrow();
    });

    it('allows GET /containers/<id>/json', () => {
      expect(() => validateDockerRequest('GET', '/containers/123/json')).not.toThrow();
    });
  });

  describe('validateSshCommand', () => {
    it('allows safe command cat', () => {
      expect(() => validateSshCommand('cat /etc/os-release')).not.toThrow();
    });

    it('blocks destructive commands', () => {
      expect(() => validateSshCommand('rm -rf /')).toThrow();
      expect(() => validateSshCommand('mkfs.ext4 /dev/sda')).toThrow();
    });

    it('blocks piped commands', () => {
      expect(() => validateSshCommand('cat /etc/passwd | grep root')).toThrow();
    });

    it('blocks chained commands', () => {
      expect(() => validateSshCommand('df && rm -rf /')).toThrow();
    });
  });
});

