import { Story } from '@/types';

// Simple recommendation algorithm
export function getRecommendedStories(stories: Story[], userInteractions: string[]): Story[] {
  if (stories.length === 0) return [];

  // Score each story based on various factors
  const scored = stories.map(story => {
    let score = 0;

    // Trending bonus
    const hasTrending = story.nodes.some(n => n.trending);
    if (hasTrending) score += 30;

    // Engagement bonus (votes)
    const totalVotes = story.nodes.reduce((a, n) => a + n.votes, 0);
    score += Math.min(totalVotes / 100, 20); // Max 20 points

    // Recency bonus
    const daysSinceCreated = (Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) score += 15;
    else if (daysSinceCreated < 30) score += 10;
    else if (daysSinceCreated < 90) score += 5;

    // Branches bonus (more branches = more engagement)
    score += Math.min(story.totalBranches / 5, 10);

    // Random factor for discovery
    score += Math.random() * 10;

    return { story, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.story);
}

// Get stories by genre
export function getStoriesByGenre(stories: Story[], genre: string): Story[] {
  return stories.filter(s => s.genre === genre);
}

// Get trending stories
export function getTrendingStories(stories: Story[]): Story[] {
  return stories
    .filter(s => s.nodes.some(n => n.trending))
    .sort((a, b) => {
      const aVotes = a.nodes.reduce((sum, n) => sum + n.votes, 0);
      const bVotes = b.nodes.reduce((sum, n) => sum + n.votes, 0);
      return bVotes - aVotes;
    });
}

// Get recently updated stories
export function getRecentStories(stories: Story[]): Story[] {
  return [...stories].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Get stories by user's favorite genres (simulated)
export function getPersonalizedFeed(stories: Story[], favoriteGenres: string[]): Story[] {
  // First show stories matching favorite genres
  const matching = stories.filter(s => favoriteGenres.includes(s.genre));
  const others = stories.filter(s => !favoriteGenres.includes(s.genre));
  
  // Interleave them
  const result: Story[] = [];
  let i = 0, j = 0;
  
  while (i < matching.length || j < others.length) {
    if (i < matching.length) result.push(matching[i++]);
    if (j < others.length && j < 2) result.push(others[j++]); // Less non-matching
  }
  
  return result;
}
