/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET as getServices, POST as createService } from '../services/route'

// Mock auth middleware
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

jest.mock('@/lib/auth-middleware', () => ({
  requireAuth: jest.fn().mockResolvedValue(mockUser),
  withAuth: jest.fn((handler) => handler),
  withValidatedAuth: jest.fn((schema, handler) => handler),
  createSuccessResponse: jest.fn((data, message, status = 200) => ({
    json: () => Promise.resolve({ success: true, data, message }),
    status,
  })),
  createErrorResponse: jest.fn((message, status = 400, code = 'ERROR') => ({
    json: () => Promise.resolve({ error: message, code }),
    status,
  })),
}))

// Mock Prisma
const mockPrisma = {
  service: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

jest.mock('@/lib/db', () => ({
  default: mockPrisma,
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true }),
}))

describe('/api/services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return user services with pagination', async () => {
      const mockServices = [
        {
          id: 'service-1',
          name: 'Consultation',
          description: 'Professional consultation',
          duration: 60,
          price: 100,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
        },
        {
          id: 'service-2',
          name: 'Follow-up',
          description: 'Follow-up session',
          duration: 30,
          price: 50,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
        },
      ]

      mockPrisma.service.findMany.mockResolvedValue(mockServices)

      const request = new NextRequest('http://localhost:3000/api/services?page=1&limit=10')

      const response = await getServices(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.services).toHaveLength(2)
      expect(data.data.pagination).toBeDefined()
      
      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should handle pagination parameters', async () => {
      mockPrisma.service.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/services?page=2&limit=5')

      await getServices(request, { params: {} })

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        skip: 5, // (page - 1) * limit
        take: 5,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should filter by active services', async () => {
      mockPrisma.service.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/services?active=true')

      await getServices(request, { params: {} })

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith({
        where: { 
          userId: mockUser.id,
          isActive: true,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should handle database errors', async () => {
      mockPrisma.service.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/services')

      const response = await getServices(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('POST', () => {
    it('should create a new service with valid data', async () => {
      const serviceData = {
        name: 'New Consultation',
        description: 'A new consultation service',
        duration: 90,
        price: 150,
        isActive: true,
      }

      const createdService = {
        id: 'new-service-id',
        ...serviceData,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.service.create.mockResolvedValue(createdService)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify(serviceData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createService(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.service.name).toBe(serviceData.name)
      
      expect(mockPrisma.service.create).toHaveBeenCalledWith({
        data: {
          ...serviceData,
          userId: mockUser.id,
        },
      })
    })

    it('should reject invalid service data', async () => {
      const invalidData = {
        name: 'A', // Too short
        duration: 5, // Too short
        price: -10, // Negative
      }

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createService(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.issues).toBeDefined()
      
      // Should not call database
      expect(mockPrisma.service.create).not.toHaveBeenCalled()
    })

    it('should handle minimum valid values', async () => {
      const minValidData = {
        name: 'AB', // Exactly 2 characters (minimum)
        duration: 15, // Minimum duration
        price: 0, // Minimum price
      }

      const createdService = {
        id: 'min-service-id',
        ...minValidData,
        userId: mockUser.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.service.create.mockResolvedValue(createdService)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify(minValidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createService(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    it('should handle maximum valid values', async () => {
      const maxValidData = {
        name: 'A'.repeat(200), // Maximum length
        duration: 480, // Maximum duration (8 hours)
        price: 10000, // Maximum price
        description: 'B'.repeat(1000), // Maximum description length
      }

      const createdService = {
        id: 'max-service-id',
        ...maxValidData,
        userId: mockUser.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.service.create.mockResolvedValue(createdService)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify(maxValidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createService(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    it('should sanitize input data', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>Clean Service',
        description: '<b>Bold</b> description with <script>bad</script> content',
        duration: 60,
        price: 100,
      }

      const createdService = {
        id: 'sanitized-service-id',
        name: 'Clean Service',
        description: '<b>Bold</b> description with  content',
        duration: 60,
        price: 100,
        userId: mockUser.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.service.create.mockResolvedValue(createdService)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify(maliciousData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createService(request, { params: {} })

      expect(response.status).toBe(201)
      
      // Verify sanitization was applied
      const createCall = mockPrisma.service.create.mock.calls[0][0]
      expect(createCall.data.name).not.toContain('<script>')
      expect(createCall.data.description).toContain('<b>Bold</b>') // Safe HTML preserved
      expect(createCall.data.description).not.toContain('<script>') // Dangerous HTML removed
    })

    it('should handle database constraint errors', async () => {
      const validData = {
        name: 'Valid Service',
        duration: 60,
        price: 100,
      }

      // Mock a database constraint error
      const dbError = new Error('Database constraint violation')
      dbError.name = 'PrismaClientKnownRequestError'
      mockPrisma.service.create.mockRejectedValue(dbError)

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createService(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.code).toBe('INTERNAL_ERROR')
    })

    it('should reject requests without authentication', async () => {
      // Mock auth failure
      const { requireAuth } = require('@/lib/auth-middleware')
      requireAuth.mockRejectedValueOnce(new Error('Unauthorized'))

      const validData = {
        name: 'Valid Service',
        duration: 60,
        price: 100,
      }

      const request = new NextRequest('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createService(request, { params: {} })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.code).toBe('UNAUTHORIZED')
      
      // Should not call database
      expect(mockPrisma.service.create).not.toHaveBeenCalled()
    })
  })
})