// Dev-only data seeding script for horizon-dev-734a4 Firestore.
// Run via `node scripts/seedDev.mjs <command> [args...]`.
//
// Auth: reads service account from $GOOGLE_APPLICATION_CREDENTIALS, or
// falls back to ~/Downloads/horizon-dev-734a4-firebase-adminsdk-*.json
// (the path the user originally saved it to).
//
// NEVER point this at production Firestore. The hardcoded project ID
// guard below refuses to run against any project other than the dev one.
//
// Commands:
//   seed-test-todos <userId>   Add 4 demo todos with varied icon/dueDate/status
//   list-todos       <userId>  Print all todos for a user (debug aid)
//   clear-todos      <userId>  Delete all todos for a user (use carefully)

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const EXPECTED_PROJECT_ID = 'horizon-dev-734a4'

function resolveServiceAccountPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS
  }
  // Look in ~/Downloads for the original adminsdk key
  const downloadsDir = join(homedir(), 'Downloads')
  if (existsSync(downloadsDir)) {
    const match = readdirSync(downloadsDir).find(
      (f) => f.startsWith('horizon-dev-734a4-firebase-adminsdk-') && f.endsWith('.json')
    )
    if (match) return join(downloadsDir, match)
  }
  // Final fallback path
  const fallback = join(homedir(), '.gcp', 'horizon-dev-key.json')
  if (existsSync(fallback)) return fallback

  throw new Error(
    'No service account key found. Set GOOGLE_APPLICATION_CREDENTIALS or place ' +
      'the key in ~/Downloads or ~/.gcp/horizon-dev-key.json.'
  )
}

function initAdmin() {
  if (getApps().length > 0) return
  const keyPath = resolveServiceAccountPath()
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
  if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
    throw new Error(
      `Refusing to run: service account project_id is "${serviceAccount.project_id}", ` +
        `expected "${EXPECTED_PROJECT_ID}". This script is dev-only.`
    )
  }
  initializeApp({ credential: cert(serviceAccount) })
  console.log(`✓ Connected to ${serviceAccount.project_id} (key: ${keyPath})`)
}

async function seedTestTodos(userId) {
  initAdmin()
  const db = getFirestore()
  const todosRef = db.collection('users').doc(userId).collection('todos')

  // Compute a few relative dates for the demo
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)

  const toISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const fixtures = [
    {
      text: 'Ship v0.1.4 to Web Store',
      completed: false,
      icon: '🚀',
      dueDate: toISO(tomorrow),
    },
    {
      text: 'Read Notion API pagination docs',
      completed: false,
      icon: '📚',
      dueDate: toISO(tomorrow),
    },
    {
      text: 'Past-due test — should look red',
      completed: false,
      icon: '🔥',
      dueDate: toISO(lastWeek),
    },
    {
      text: 'Done-state test (no icon, strikethrough only)',
      completed: true,
    },
  ]

  for (const f of fixtures) {
    const docRef = todosRef.doc()
    await docRef.set({
      text: f.text,
      completed: f.completed,
      listId: 'today',
      ...(f.icon ? { icon: f.icon } : {}),
      ...(f.dueDate ? { dueDate: f.dueDate } : {}),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    console.log(`  + ${f.icon ?? '  '} ${f.text}  [${f.completed ? 'done' : 'todo'}${f.dueDate ? ' · ' + f.dueDate : ''}]`)
  }
  console.log(`\n✓ Seeded ${fixtures.length} test todos for user ${userId}`)
}

async function listTodos(userId) {
  initAdmin()
  const db = getFirestore()
  const snap = await db.collection('users').doc(userId).collection('todos').get()
  console.log(`Found ${snap.size} todos:`)
  snap.docs.forEach((d) => {
    const data = d.data()
    console.log(`  ${d.id}: completed=${data.completed} text=${JSON.stringify(data.text)} icon=${data.icon ?? '(none)'} dueDate=${data.dueDate ?? '(none)'}`)
  })
}

async function clearTodos(userId) {
  initAdmin()
  const db = getFirestore()
  const snap = await db.collection('users').doc(userId).collection('todos').get()
  if (snap.empty) {
    console.log('No todos to delete.')
    return
  }
  const batch = db.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  console.log(`✓ Deleted ${snap.size} todos for user ${userId}`)
}

const [, , command, ...args] = process.argv

try {
  switch (command) {
    case 'seed-test-todos':
      if (!args[0]) throw new Error('Usage: seed-test-todos <userId>')
      await seedTestTodos(args[0])
      break
    case 'list-todos':
      if (!args[0]) throw new Error('Usage: list-todos <userId>')
      await listTodos(args[0])
      break
    case 'clear-todos':
      if (!args[0]) throw new Error('Usage: clear-todos <userId>')
      await clearTodos(args[0])
      break
    default:
      console.log(
        [
          'Usage: node scripts/seedDev.mjs <command> [args...]',
          '',
          'Commands:',
          '  seed-test-todos <userId>   Add 4 demo todos with varied icon/dueDate/status',
          '  list-todos       <userId>  Print all todos for a user',
          '  clear-todos      <userId>  Delete all todos for a user',
        ].join('\n')
      )
      process.exit(command ? 1 : 0)
  }
  process.exit(0)
} catch (e) {
  console.error('Error:', e.message)
  process.exit(1)
}
