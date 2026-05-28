import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { config } from 'dotenv';
import pg from 'pg';

config();

const { Pool } = pg;

const roleMap = new Map([
  ['admin', 'system_admin'],
  ['system_admin', 'system_admin'],
  ['super_admin', 'system_admin'],
  ['research_head', 'research_head'],
  ['student', 'student'],
  ['adviser', 'adviser'],
  ['panel', 'panel'],
  ['panelist', 'panel'],
  ['program_head', 'program_head'],
  ['partner', 'partner'],
  ['tech_transfer', 'tech_transfer'],
  ['library', 'library'],
]);

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith('--')) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function usage() {
  console.log(`
Create a ThesisTrack user in the configured database.

Required:
  --role        system_admin | research_head | program_head | adviser | panel | library | partner | tech_transfer | student
  --email       User email address
  --password    Temporary password, at least 6 characters
  --first-name  First name
  --last-name   Last name
  --department  Department or office

Student-only:
  --student-id  Required when --role student
  --year-level  Required when --role student

Examples:
  npm run db:create-user -- --role system_admin --email admin@example.com --password Admin123 --first-name System --last-name Admin --department IT
  npm run db:create-user -- --role research_head --email research@example.com --password Research123 --first-name Research --last-name Head --department "Research Office"
  npm run db:create-user -- --role adviser --email adviser@example.com --password Adviser123 --first-name Ana --last-name Reyes --department BSIT
  npm run db:create-user -- --update-existing --role system_admin --email admin@example.com --password Admin123 --first-name System --last-name Admin --department IT
`);
}

function required(args, key, label = key) {
  const value = args[key]?.trim();

  if (!value) {
    throw new Error(`Missing required argument: --${label}`);
  }

  return value;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    usage();
    return;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured in .env.');
  }

  const rawRole = required(args, 'role').toLowerCase();
  const role = roleMap.get(rawRole);

  if (!role) {
    throw new Error(`Unsupported role: ${rawRole}`);
  }

  const email = required(args, 'email').toLowerCase();
  const password = required(args, 'password');
  const firstName = required(args, 'first-name', 'first-name');
  const lastName = required(args, 'last-name', 'last-name');
  const department = required(args, 'department');
  const studentId = args['student-id']?.trim() || null;
  const yearLevel = args['year-level']?.trim() || null;

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  if (role === 'student' && (!studentId || !yearLevel)) {
    throw new Error('Student users require --student-id and --year-level.');
  }

  const name = `${firstName} ${lastName}`.trim();
  const passwordHash = await bcrypt.hash(password, 12);
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
    },
  });

  try {
    const existing = await pool.query('SELECT "id" FROM "User" WHERE "email" = $1', [email]);

    if (existing.rowCount > 0 && args['update-existing'] !== 'true') {
      throw new Error(`A user with email ${email} already exists.`);
    }

    if (role === 'student' && studentId) {
      const existingStudent = await pool.query('SELECT "id" FROM "User" WHERE "studentId" = $1', [studentId]);

      if (existingStudent.rowCount > 0) {
        throw new Error(`A student with ID ${studentId} already exists.`);
      }
    }

    if (existing.rowCount > 0) {
      await pool.query(
        `
          UPDATE "User"
          SET
            "passwordHash" = $1,
            "name" = $2,
            "firstName" = $3,
            "lastName" = $4,
            "studentId" = $5,
            "department" = $6,
            "yearLevel" = $7,
            "role" = $8::"UserRole",
            "updatedAt" = NOW()
          WHERE "email" = $9
        `,
        [
          passwordHash,
          name,
          firstName,
          lastName,
          role === 'student' ? studentId : null,
          department,
          role === 'student' ? yearLevel : null,
          role,
          email,
        ],
      );

      console.log(`Updated ${role} user: ${email}`);
      return;
    }

    const id = crypto.randomUUID();
    await pool.query(
      `
        INSERT INTO "User" (
          "id",
          "email",
          "passwordHash",
          "name",
          "firstName",
          "lastName",
          "studentId",
          "department",
          "yearLevel",
          "role",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::"UserRole", NOW())
      `,
      [
        id,
        email,
        passwordHash,
        name,
        firstName,
        lastName,
        role === 'student' ? studentId : null,
        department,
        role === 'student' ? yearLevel : null,
        role,
      ],
    );

    console.log(`Created ${role} user: ${email}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  usage();
  process.exit(1);
});
