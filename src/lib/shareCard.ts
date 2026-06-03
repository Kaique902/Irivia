import { StoryNode } from '@/types';

const W = 1080;
const H = 1080;
const PAD = 56;
const ACCENT = '#f97316';
const CYAN = '#06b6d4';
const BG = '#09090b';
const TEXT = '#fafafa';
const MUTED = '#a1a1aa';

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateShareImage(node: StoryNode, storyTitle: string, branchCount?: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  const gridSize = 72;
  for (let x = 0; x < W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Accent bar at top
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, 8);

  // Brand
  ctx.font = 'bold 26px Inter, system-ui, sans-serif';
  ctx.fillStyle = ACCENT;
  ctx.fillText('Irivia', PAD, PAD + 26);

  // Story title
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  const titleText = storyTitle.length > 60 ? storyTitle.slice(0, 57) + '...' : storyTitle;
  ctx.fillText(titleText, PAD, PAD + 64);

  // Divider
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD + 90);
  ctx.lineTo(W - PAD, PAD + 90);
  ctx.stroke();

  // Node content
  ctx.font = '28px Inter, system-ui, sans-serif';
  ctx.fillStyle = TEXT;
  const maxTextWidth = W - PAD * 2;
  const lines = wrapText(ctx, node.content, maxTextWidth);
  const maxLines = 10;
  const lineHeight = 40;
  const contentY = PAD + 130;
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    ctx.fillText(lines[i], PAD, contentY + i * lineHeight);
  }
  if (lines.length > maxLines) {
    ctx.fillStyle = MUTED;
    ctx.font = '22px Inter, system-ui, sans-serif';
    ctx.fillText('... (continue no Irivia)', PAD, contentY + maxLines * lineHeight);
  }

  // Branch badge
  const bc = branchCount && branchCount > 0 ? branchCount : 0;
  const textEndY = contentY + Math.min(lines.length, maxLines) * lineHeight + (lines.length > maxLines ? 40 : 12);
  if (bc > 0) {
    const badgeText = `🌿 +${bc} caminho${bc > 1 ? 's' : ''} alternativo${bc > 1 ? 's' : ''}`;
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 28;
    const badgeX = PAD;
    const badgeY = textEndY + 8;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    drawRoundRect(ctx, badgeX, badgeY, badgeWidth, 40, 999);
    ctx.fill();
    ctx.fillStyle = CYAN;
    ctx.fillText(badgeText, badgeX + 14, badgeY + 27);
  }

  // Decorative diagonal glow
  ctx.fillStyle = 'rgba(249, 115, 22, 0.03)';
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W, H * 0.4);
  ctx.lineTo(W * 0.6, H);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Bottom section
  const bottomY = H - PAD - 36;
  const lineTop = bottomY - 30;

  // Bottom divider
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, lineTop);
  ctx.lineTo(W - PAD, lineTop);
  ctx.stroke();

  // Author
  ctx.font = '24px Inter, system-ui, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText(`✍️ ${node.author}`, PAD, bottomY);

  // Votes
  const voteText = `🔥 ${node.hotVotes}  ❄️ ${node.coldVotes}  •  ${node.votes} votos`;
  ctx.font = '22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(voteText, W - PAD, bottomY);
  ctx.textAlign = 'left';

  // CTA
  const ctaColor = bc > 0 ? CYAN : ACCENT;
  ctx.font = 'bold 24px Inter, system-ui, sans-serif';
  ctx.fillStyle = ctaColor;
  const ctaText = bc > 0 ? 'Descubra os caminhos →' : 'Continue lendo →';
  ctx.textAlign = 'right';
  ctx.fillText(ctaText, W - PAD, H - 32);
  ctx.textAlign = 'left';

  // URL
  ctx.font = '20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#52525b';
  ctx.fillText('irivia.app', PAD, H - 32);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export function createNodeDeepLink(storyId: string, nodeId: string, source?: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://irivia.app';
  const url = new URL(`${base}/${storyId}`);
  url.searchParams.set('node', nodeId);
  if (source) {
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', 'story');
    url.searchParams.set('ref_story', storyId);
  }
  return url.toString();
}
