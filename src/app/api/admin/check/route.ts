import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ADMINS_FILE = join(process.cwd(), '.admins.json');

function loadAdmins(): string[] {
  if (!existsSync(ADMINS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(ADMINS_FILE, 'utf-8'));
  } catch { return []; }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ isAdmin: false });
  }

  const admins = loadAdmins();
  const clean = username.trim().toLowerCase();
  const isAdmin = admins.includes(clean);

  return NextResponse.json({ isAdmin });
}
