/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST as registerHandler } from '../auth/register/route'

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  default: mockPrisma,
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}))

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should create a new user with valid data', async () => {
      const validUserData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'StrongPassword123',
        businessName: 'Test Business',
      }

      // Mock user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null)
      
      // Mock user creation
      const createdUser = {
        id: 'test-user-id',
        email: validUserData.email,
        name: validUserData.name,
        businessName: validUserData.businessName,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrisma.user.create.mockResolvedValue(createdUser)

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe(validUserData.email)
      expect(data.data.user).not.toHaveProperty('password')
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: validUserData.email,
          name: validUserData.name,
          businessName: validUserData.businessName,
          password: 'hashed-password',
        },
      })
    })

    it('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'StrongPassword123',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'email',
            message: 'Email invalide',
          }),
        ])
      )
    })

    it('should reject weak passwords', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'weak',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(weakPasswordData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.issues.some((issue: any) => issue.path === 'password')).toBe(true)
    })

    it('should reject duplicate email', async () => {
      const existingUserData = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'StrongPassword123',
      }

      // Mock user already exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: existingUserData.email,
      })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(existingUserData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.code).toBe('EMAIL_EXISTS')
    })

    it('should reject invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_JSON')
    })

    it('should handle database errors', async () => {
      const validUserData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'StrongPassword123',
      }

      // Mock user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null)
      
      // Mock database error
      mockPrisma.user.create.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.code).toBe('INTERNAL_ERROR')
    })

    it('should sanitize input data', async () => {
      const maliciousData = {
        email: '  TEST@EXAMPLE.COM  ',
        name: '<script>alert("xss")</script>Clean Name',
        password: 'StrongPassword123',
        businessName: '  Business Name  ',
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Clean Name',
        businessName: 'Business Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(maliciousData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com', // Should be normalized
          name: 'Clean Name', // Should be sanitized
          businessName: 'Business Name', // Should be trimmed
          password: 'hashed-password',
        },
      })
    })
  })
})