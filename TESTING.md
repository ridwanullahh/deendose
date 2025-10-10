# Testing Guide

## Overview

DeenDose uses Vitest for unit and integration testing with comprehensive coverage.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
__tests__/
├── setup.ts              # Test configuration
├── api/                  # API integration tests
│   ├── quran-api.test.ts
│   └── hadith-api.test.ts
├── ai/                   # AI validation tests
│   └── multi-agent-validator.test.ts
├── services/             # Service layer tests
│   ├── content-pipeline.test.ts
│   └── auto-publisher.test.ts
└── components/           # Component tests
    └── admin/
        ├── content-review-queue.test.tsx
        └── automation-control-panel.test.tsx
```

## Writing Tests

### API Integration Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { fetchQuranVerse } from '@/lib/api/quran-api'

vi.mock('@/lib/sdk', () => ({
  sdk: {
    get: vi.fn().mockResolvedValue([]),
    insert: vi.fn()
  }
}))

describe('Quran API', () => {
  it('should fetch a verse', async () => {
    const verse = await fetchQuranVerse()
    expect(verse).toBeDefined()
    expect(verse.text).toBeTruthy()
  })
})
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ContentReviewQueue from '@/components/admin/content-review-queue'

describe('ContentReviewQueue', () => {
  it('should render queue tabs', () => {
    render(<ContentReviewQueue />)
    expect(screen.getByText('Pending Review')).toBeInTheDocument()
  })
})
```

### Service Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getQueueStats } from '@/lib/services/content-pipeline'

vi.mock('@/lib/sdk', () => ({
  sdk: {
    get: vi.fn().mockResolvedValue([
      { status: 'approved', scheduledFor: '2025-01-15' }
    ])
  }
}))

describe('Content Pipeline', () => {
  it('should calculate queue stats', async () => {
    const stats = await getQueueStats()
    expect(stats.approved).toBe(1)
  })
})
```

## Mocking

### External APIs

```typescript
// Mock Quran.com API
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ verse: { text: 'مocked text' } })
})
```

### SDK Operations

```typescript
vi.mock('@/lib/sdk', () => ({
  sdk: {
    get: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))
```

### AI Services

```typescript
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ summary: 'Test summary' })
        }
      })
    })
  }))
}))
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user workflows

### Current Coverage

Run `npm run test:coverage` to see current coverage report.

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how
   - Test public APIs and user interactions

2. **Use Descriptive Test Names**
   ```typescript
   it('should reject content with invalid theological claims')
   ```

3. **Arrange-Act-Assert Pattern**
   ```typescript
   // Arrange
   const mockVerse = { text: 'Test', translation: 'Test' }
   
   // Act
   const result = await validateVerse(mockVerse)
   
   // Assert
   expect(result.approved).toBe(true)
   ```

4. **Isolate Tests**
   - Each test should be independent
   - Use beforeEach/afterEach for setup/cleanup

5. **Mock External Dependencies**
   - Don't make real API calls in tests
   - Mock database operations
   - Mock AI services

## Debugging Tests

```bash
# Run specific test file
npm test -- __tests__/api/quran-api.test.ts

# Run tests matching pattern
npm test -- -t "should fetch"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/vitest
```

## Performance Testing

Test response times for critical operations:

```typescript
it('should generate content within 5 seconds', async () => {
  const start = Date.now()
  await generateAndQueueContent()
  const duration = Date.now() - start
  expect(duration).toBeLessThan(5000)
})
```

## Security Testing

Verify authentication and authorization:

```typescript
it('should reject unauthenticated admin requests', async () => {
  const response = await fetch('/api/admin/queue-stats')
  expect(response.status).toBe(401)
})
```

## Continuous Improvement

- Add tests for every bug fix
- Increase coverage with each feature
- Review and refactor tests regularly
- Keep tests fast and focused

---

May Allah grant us the ability to maintain quality and excellence in our work.
