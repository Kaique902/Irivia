import { generateStoryHTML } from '@/lib/exportPdf';
import { Story } from '@/types';

const mockStory: Story = {
  id: 'test',
  title: 'Test Story',
  seed: 'Once upon a time...',
  genre: 'fantasy',
  totalBranches: 3,
  participants: 2,
  createdAt: '2024-01-01',
  nodes: [
    { id: 'n1', content: 'Once upon a time...', author: 'Alice', emotion: 'curiosidade', parentId: null, votes: 10, hotVotes: 8, coldVotes: 2, trending: true, createdAt: '2024-01-01' },
    { id: 'n2', content: 'She found a dragon.', author: 'Bob', emotion: 'surpresa', parentId: 'n1', votes: 5, hotVotes: 4, coldVotes: 1, trending: false, createdAt: '2024-01-02' },
  ],
};

describe('generateStoryHTML', () => {
  it('includes story title', () => {
    const html = generateStoryHTML(mockStory);
    expect(html).toContain('Test Story');
  });

  it('includes story genre', () => {
    const html = generateStoryHTML(mockStory);
    expect(html).toContain('fantasy');
  });

  it('includes node content', () => {
    const html = generateStoryHTML(mockStory);
    expect(html).toContain('Once upon a time...');
    expect(html).toContain('She found a dragon.');
  });

  it('escapes HTML in content', () => {
    const storyWithHtml: Story = {
      ...mockStory,
      title: '<script>alert("xss")</script>',
      nodes: [{
        ...mockStory.nodes[0],
        content: '<img onerror="alert(1)" src=x>',
      }],
    };
    const html = generateStoryHTML(storyWithHtml);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});
