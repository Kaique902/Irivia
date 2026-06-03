import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ADMINS_FILE = join(process.cwd(), '.admins.json');

function loadAdmins(): string[] {
  if (!existsSync(ADMINS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(ADMINS_FILE, 'utf-8'));
  } catch { return []; }
}

function saveAdmins(admins: string[]) {
  writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
}

export async function POST(request: Request) {
  try {
    const { username, secret } = await request.json();

    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json({ error: 'Chave secreta inválida' }, { status: 403 });
    }

    if (!username || typeof username !== 'string' || username.length < 2) {
      return NextResponse.json({ error: 'Nome de usuário inválido' }, { status: 400 });
    }

    const clean = username.trim().toLowerCase();
    const admins = loadAdmins();

    if (admins.includes(clean)) {
      return NextResponse.json({ message: `"${clean}" já é administrador` });
    }

    admins.push(clean);
    saveAdmins(admins);

    return NextResponse.json({ message: `"${clean}" promovido a administrador` });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
