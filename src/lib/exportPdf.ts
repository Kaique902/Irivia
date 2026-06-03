import { Story } from '@/types';

export function generateStoryHTML(story: Story): string {
  const mainPath = buildMainPath(story);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(story.title)} - Irivia</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #fafafa;
      color: #18181b;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
    .genre {
      display: inline-block;
      padding: 4px 12px;
      background: #f4f4f5;
      border-radius: 999px;
      font-size: 12px;
      color: #52525b;
      margin-bottom: 16px;
    }
    .meta {
      font-size: 13px;
      color: #71717a;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e4e4e7;
    }
    .node {
      margin-bottom: 24px;
      padding-left: 24px;
      border-left: 3px solid #f97316;
    }
    .node .author {
      font-size: 12px;
      color: #a1a1aa;
      margin-bottom: 4px;
    }
    .node .content {
      font-size: 15px;
      line-height: 1.7;
      color: #18181b;
    }
    .node .votes {
      font-size: 11px;
      color: #a1a1aa;
      margin-top: 6px;
    }
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e4e4e7;
      text-align: center;
      font-size: 12px;
      color: #a1a1aa;
    }
    @media print {
      body { padding: 20px; }
      .node { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(story.title)}</h1>
  <div class="genre">${escapeHtml(story.genre)}</div>
  <div class="meta">
    ${story.totalBranches} ramos · ${story.participants} autores · ${story.nodes.length} frases
  </div>

  <div class="story-content">
    ${mainPath.map(n => `
      <div class="node">
        <div class="author">${escapeHtml(n.author)}</div>
        <div class="content">${escapeHtml(n.content)}</div>
        <div class="votes">${n.votes} votos (${n.hotVotes} hot · ${n.coldVotes} cold)</div>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    Gerado por Irivia — irivia.app
  </div>
</body>
</html>`;
}

export function downloadStoryPDF(story: Story): void {
  const html = generateStoryHTML(story);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      win.print();
      URL.revokeObjectURL(url);
    };
  }
}

function buildMainPath(story: Story) {
  const root = story.nodes.find(n => !n.parentId);
  if (!root) return [];
  const path: typeof story.nodes = [];
  const childrenMap: Record<string, typeof story.nodes> = {};
  story.nodes.forEach(n => {
    if (n.parentId) {
      if (!childrenMap[n.parentId]) childrenMap[n.parentId] = [];
      childrenMap[n.parentId].push(n);
    }
  });
  let current = root;
  while (current) {
    path.push(current);
    const children = childrenMap[current.id] || [];
    if (children.length === 0) break;
    current = children.sort((a, b) => b.votes - a.votes)[0];
  }
  return path;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
