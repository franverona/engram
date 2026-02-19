#!/usr/bin/env zx

import { readFile } from 'fs/promises'
import { resolve } from 'path'

// Load environment variables from .env files
async function loadEnvFile(filename) {
  try {
    const envPath = resolve(process.cwd(), filename)
    const content = await readFile(envPath, 'utf-8')

    content.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim() === '' || line.trim().startsWith('#')) return

      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '')
        process.env[key.trim()] = cleanValue
        $.env[key.trim()] = cleanValue
      }
    })
  } catch (error) {
    // Silently ignore if file doesn't exist
    if (error.code !== 'ENOENT') {
      console.error(`Error loading ${filename}:`, error.message)
    }
  }
}

// Helper function to spawn a new tab
async function spawnTab(command) {
  const result = await $`wezterm cli spawn --cwd ${process.cwd()}`
  const paneId = result.stdout.trim()

  // Send the command to the pane (cross-platform approach)
  await $`wezterm cli send-text --pane-id ${paneId} --no-paste ${command + '\n'}`

  return paneId
}

// Helper function to split pane horizontally (right)
async function splitRight(parentPaneId, command) {
  const result = await $`wezterm cli split-pane --pane-id ${parentPaneId} --right --cwd ${process.cwd()}`
  const newPaneId = result.stdout.trim()

  await sleep(200)

  // Send the command to the new pane (cross-platform approach)
  await $`wezterm cli send-text --pane-id ${newPaneId} --no-paste ${command + '\n'}`
}

// Helper function to set tab title for a pane
async function setTitle(paneId, title) {
  await $`wezterm cli set-tab-title --pane-id ${paneId} ${title}`
}

async function startEnvironment() {
  // Load environment variables
  await loadEnvFile('.env')
  await loadEnvFile('.env.local')

  // Wait for WezTerm to be ready
  await sleep(2000)

  // Spawn tab with Ollama server
  const paneId = await spawnTab('ollama serve')
  await sleep(500)

  // Split pane and run Next.js dev server
  await splitRight(paneId, 'npm run dev')

  // Set tab title
  await setTitle(paneId, 'engram')

  console.log('Development environment started!')
}

// Start the development environment
await startEnvironment()
