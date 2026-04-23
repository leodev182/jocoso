import * as crypto from 'crypto';
import { MpWebhookValidator } from './mp-webhook.validator';

const SECRET = 'test-secret-key';

const makeValidator = (secret?: string) => {
  const config = { get: jest.fn().mockReturnValue(secret) } as any;
  return new MpWebhookValidator(config);
};

const buildSignature = (ts: string, dataId: string, requestId: string, secret = SECRET) => {
  const message = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return `ts=${ts},v1=${hmac}`;
};

describe('MpWebhookValidator', () => {
  it('returns true for a valid signature', () => {
    const validator = makeValidator(SECRET);
    const sig = buildSignature('1700000000', 'data-123', 'req-abc');

    expect(validator.validate(sig, 'req-abc', 'data-123')).toBe(true);
  });

  it('returns false for a tampered dataId', () => {
    const validator = makeValidator(SECRET);
    const sig = buildSignature('1700000000', 'data-123', 'req-abc');

    expect(validator.validate(sig, 'req-abc', 'tampered')).toBe(false);
  });

  it('returns false for a wrong secret', () => {
    const validator = makeValidator(SECRET);
    const sig = buildSignature('1700000000', 'data-123', 'req-abc', 'wrong-secret');

    expect(validator.validate(sig, 'req-abc', 'data-123')).toBe(false);
  });

  it('returns false when ts or v1 is missing', () => {
    const validator = makeValidator(SECRET);

    expect(validator.validate('v1=abc123', 'req-abc', 'data-123')).toBe(false);
    expect(validator.validate('ts=1700000000', 'req-abc', 'data-123')).toBe(false);
  });

  it('returns true (skip validation) when secret is not configured', () => {
    const validator = makeValidator(undefined);
    const sig = buildSignature('1700000000', 'data-123', 'req-abc');

    expect(validator.validate(sig, 'req-abc', 'data-123')).toBe(true);
  });

  it('returns false for a malformed signature string', () => {
    const validator = makeValidator(SECRET);

    expect(validator.validate('not-valid-at-all', 'req-abc', 'data-123')).toBe(false);
  });
});
