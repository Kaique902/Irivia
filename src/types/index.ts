export interface StoryNode {
  id: string;
  content: string;
  author: string;
  emotion: string;
  parentId: string | null;
  votes: number;
  hotVotes: number;
  coldVotes: number;
  trending: boolean;
  createdAt: string;
}

export interface Story {
  id: string;
  title: string;
  seed: string;
  genre: string;
  nodes: StoryNode[];
  totalBranches: number;
  participants: number;
  authorId: string;
  createdAt: string;
}

export interface UserStats {
  level: number;
  xp: number;
  streak: number;
  contributions: number;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorAvatar: string;
  nodeId: string;
  storyId: string;
  createdAt: string;
}

export interface Challenge {
  id: string;
  type: 'write' | 'vote' | 'branch' | 'read';
  prompt: string;
  xp: number;
  completed: boolean;
  date: string;
}

export interface FriendChallenge {
  id: string;
  fromUser: string;
  toUser?: string;
  storyId: string;
  storyTitle: string;
  type: 'write' | 'branch' | 'vote';
  status: 'pending' | 'accepted' | 'completed' | 'expired';
  xp: number;
  createdAt: string;
  completedAt?: string;
}

export interface Report {
  id: string;
  nodeId: string;
  storyId: string;
  reason: string;
  reportedBy: string;
  content: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}
