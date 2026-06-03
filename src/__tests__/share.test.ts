import { createChallengeUrl } from '@/lib/share';

describe('createChallengeUrl', () => {
  it('creates URL with challenge type', () => {
    const url = createChallengeUrl('story123', 'write');
    expect(url).toContain('/story123?challenge=write');
  });

  it('creates URL for branch challenge', () => {
    const url = createChallengeUrl('story456', 'branch');
    expect(url).toContain('/story456?challenge=branch');
  });

  it('includes origin in URL', () => {
    const url = createChallengeUrl('test', 'vote');
    expect(url).toMatch(/^https?:\/\/.+\/test\?challenge=vote$/);
  });
});
