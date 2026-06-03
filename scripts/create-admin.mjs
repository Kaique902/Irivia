#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ADMINS_FILE = join(__dirname, '..', '.admins.json');

function loadAdmins() {
  if (!existsSync(ADMINS_FILE)) return [];
  return JSON.parse(readFileSync(ADMINS_FILE, 'utf-8'));
}

function saveAdmins(admins) {
  writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
}

const username = process.argv[2]?.trim();

if (!username) {
  console.log('');
  console.log('  Cria um usuário administrador no Irivia.');
  console.log('');
  console.log('  Uso:');
  console.log('    node scripts/create-admin.mjs <username>');
  console.log('');
  console.log('  Exemplo:');
  console.log('    node scripts/create-admin.mjs admin');
  console.log('');
  process.exit(1);
}

const admins = loadAdmins();

if (admins.includes(username)) {
  console.log(`  ⚠️  "${username}" já é administrador.`);
  process.exit(0);
}

admins.push(username);
saveAdmins(admins);
console.log(`  ✅ "${username}" marcado como administrador no servidor!`);
console.log('');
console.log('  Agora faça o seguinte:');
console.log(`  1. No aplicativo, crie uma conta com o username "${username}" (cadastro normal)`);
console.log(`  2. Ao se registrar, o sistema detectará que é admin automaticamente`);
console.log(`  3. Acesse /admin/moderation para o painel`);
console.log('');
console.log('  (Já tem a conta criada? Faça login novamente para ativar o admin)');
console.log('');
