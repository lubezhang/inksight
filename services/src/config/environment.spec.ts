import { validateEnvironment } from './environment';

describe('Environment validation', () => {
  it('provides defaults and converts the HTTP port', () => {
    expect(validateEnvironment({}).PORT).toBe(8080);
    expect(validateEnvironment({ PORT: '18080' }).PORT).toBe(18080);
  });

  it.each(['0', '-1', '65536', '8080.5', 'abc', ''])(
    'rejects invalid port %s',
    (PORT) => {
      expect(() => validateEnvironment({ PORT })).toThrow('PORT');
    },
  );

  it('rejects invalid configuration without logging its value', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'secret-value' })).toThrow(
      'Invalid environment configuration: NODE_ENV',
    );
  });
});
