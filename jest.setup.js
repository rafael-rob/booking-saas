import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import 'whatwg-fetch'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js server actions
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers(init?.headers),
    })),
    redirect: jest.fn(),
  },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  service: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  booking: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  client: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  availability: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
}

jest.mock('@/lib/db', () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      cancel: jest.fn(),
    },
    prices: {
      list: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }))
})

// Mock file operations
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.bits = bits
    this.name = name
    this.type = options.type || ''
    this.size = Array.isArray(bits) ? bits.reduce((acc, bit) => acc + bit.length, 0) : bits.length
    this.lastModified = options.lastModified || Date.now()
  }
}

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0
    this.result = null
    this.error = null
    this.onload = null
    this.onerror = null
    this.onabort = null
    this.onloadstart = null
    this.onloadend = null
    this.onprogress = null
  }

  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2
      this.result = 'mocked file content'
      if (this.onload) this.onload({ target: this })
    }, 0)
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2
      this.result = 'data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA=='
      if (this.onload) this.onload({ target: this })
    }, 0)
  }
}

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url')
global.URL.revokeObjectURL = jest.fn()

// Console error suppression for expected React errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: render has been replaced by createRoot'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})