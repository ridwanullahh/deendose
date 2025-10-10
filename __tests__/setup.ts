import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})

global.fetch = vi.fn()

process.env.GITHUB_OWNER = 'test-owner'
process.env.GITHUB_REPO = 'test-repo'
process.env.GITHUB_TOKEN = 'test-token'
process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.CRON_SECRET = 'test-cron-secret-1234567890'
process.env.ADMIN_SECRET = 'test-admin-secret-1234567890'
