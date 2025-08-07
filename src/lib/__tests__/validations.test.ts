import {
  emailSchema,
  phoneSchema,
  passwordSchema,
  registerSchema,
  loginSchema,
  createServiceSchema,
  createBookingSchema,
  validateRequest,
  sanitizeString,
  isValidCuid,
} from '../validations'

describe('validations', () => {
  describe('emailSchema', () => {
    it('should validate correct emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
      ]

      validEmails.forEach(email => {
        expect(emailSchema.safeParse(email).success).toBe(true)
      })
    })

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        '',
      ]

      invalidEmails.forEach(email => {
        expect(emailSchema.safeParse(email).success).toBe(false)
      })
    })
  })

  describe('phoneSchema', () => {
    it('should validate correct French phone numbers', () => {
      const validPhones = [
        '0123456789',
        '+33123456789',
        '0612345678',
        '+33612345678',
      ]

      validPhones.forEach(phone => {
        expect(phoneSchema.safeParse(phone).success).toBe(true)
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123456789',
        '0023456789', // starts with 00
        '+44123456789', // UK format
        'abcdefghij',
        '',
      ]

      invalidPhones.forEach(phone => {
        expect(phoneSchema.safeParse(phone).success).toBe(false)
      })
    })
  })

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123',
        'MyStr0ngP@ssw0rd',
        'Test123456',
      ]

      validPasswords.forEach(password => {
        expect(passwordSchema.safeParse(password).success).toBe(true)
      })
    })

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'short',
        'nouppercase123',
        'NOLOWERCASE123',
        'NoNumbers',
        '12345678',
      ]

      invalidPasswords.forEach(password => {
        expect(passwordSchema.safeParse(password).success).toBe(false)
      })
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'John Doe',
        businessName: 'My Business',
        phone: '0123456789',
        password: 'StrongPassword123',
      }

      expect(registerSchema.safeParse(validData).success).toBe(true)
    })

    it('should reject invalid registration data', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'A', // too short
        password: 'weak',
      }

      expect(registerSchema.safeParse(invalidData).success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      }

      expect(loginSchema.safeParse(validData).success).toBe(true)
    })

    it('should reject invalid login data', () => {
      const invalidData = {
        email: 'invalid-email',
        password: '',
      }

      expect(loginSchema.safeParse(invalidData).success).toBe(false)
    })
  })

  describe('createServiceSchema', () => {
    it('should validate correct service data', () => {
      const validData = {
        name: 'Consultation',
        description: 'Professional consultation service',
        duration: 60,
        price: 50.0,
        isActive: true,
      }

      expect(createServiceSchema.safeParse(validData).success).toBe(true)
    })

    it('should reject invalid service data', () => {
      const invalidData = {
        name: 'A', // too short
        duration: 5, // too short
        price: -10, // negative price
      }

      expect(createServiceSchema.safeParse(invalidData).success).toBe(false)
    })

    it('should validate edge cases', () => {
      // Minimum values
      const minData = {
        name: 'Ab', // exactly 2 chars
        duration: 15, // minimum duration
        price: 0, // minimum price
      }
      expect(createServiceSchema.safeParse(minData).success).toBe(true)

      // Maximum values
      const maxData = {
        name: 'A'.repeat(200), // exactly 200 chars
        duration: 480, // maximum duration (8 hours)
        price: 10000, // maximum price
      }
      expect(createServiceSchema.safeParse(maxData).success).toBe(true)
    })
  })

  describe('createBookingSchema', () => {
    it('should validate correct booking data', () => {
      // Create a future date
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const dateStr = futureDate.toISOString().split('T')[0]

      const validData = {
        serviceId: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        clientPhone: '0123456789',
        date: dateStr,
        time: '14:30',
        notes: 'Optional notes',
      }

      expect(createBookingSchema.safeParse(validData).success).toBe(true)
    })

    it('should reject past bookings', () => {
      // Create a past date
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      const dateStr = pastDate.toISOString().split('T')[0]

      const invalidData = {
        serviceId: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        date: dateStr,
        time: '14:30',
      }

      const result = createBookingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate time format', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const dateStr = futureDate.toISOString().split('T')[0]

      const validTimes = ['09:00', '14:30', '23:59']
      const invalidTimes = ['9:00', '25:00', '14:60', 'invalid']

      validTimes.forEach(time => {
        const data = {
          serviceId: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          date: dateStr,
          time,
        }
        expect(createBookingSchema.safeParse(data).success).toBe(true)
      })

      invalidTimes.forEach(time => {
        const data = {
          serviceId: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          date: dateStr,
          time,
        }
        expect(createBookingSchema.safeParse(data).success).toBe(false)
      })
    })
  })

  describe('validateRequest', () => {
    it('should return success for valid data', () => {
      const result = validateRequest(emailSchema, 'test@example.com')
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('test@example.com')
      }
    })

    it('should return error for invalid data', () => {
      const result = validateRequest(emailSchema, 'invalid-email')
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
        expect(result.issues).toBeDefined()
        expect(result.issues.length).toBeGreaterThan(0)
      }
    })

    it('should handle multiple errors', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'A',
        password: 'weak',
      }
      
      const result = validateRequest(registerSchema, invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.issues.length).toBeGreaterThan(1)
      }
    })
  })

  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello'
      const expected = 'Hello'
      expect(sanitizeString(input)).toBe(expected)
    })

    it('should remove dangerous characters', () => {
      const input = 'Hello<>World'
      const expected = 'HelloWorld'
      expect(sanitizeString(input)).toBe(expected)
    })

    it('should remove javascript protocols', () => {
      const input = 'javascript:alert("xss")'
      const expected = 'alert("xss")'
      expect(sanitizeString(input)).toBe(expected)
    })

    it('should remove event handlers', () => {
      const input = 'onclick="alert(\'xss\')"'
      const expected = '"alert(\'xss\')"'
      expect(sanitizeString(input)).toBe(expected)
    })

    it('should trim whitespace', () => {
      const input = '  hello world  '
      const expected = 'hello world'
      expect(sanitizeString(input)).toBe(expected)
    })

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString('   ')).toBe('')
    })
  })

  describe('isValidCuid', () => {
    it('should validate correct CUID format', () => {
      // CUIDs start with 'c' and are 25 characters long
      const validCuids = [
        'clxxxxxxxxxxxxxxxxxxxxxxx',
        'c123456789012345678901234',
      ]

      validCuids.forEach(cuid => {
        expect(isValidCuid(cuid)).toBe(true)
      })
    })

    it('should reject invalid CUID format', () => {
      const invalidCuids = [
        'short',
        'toolongtobeavalidcuidstring123',
        'notstartwithc12345678901234',
        '',
        'clxxxxxxxxxxxxxxxxxxxxxxx!', // invalid character
      ]

      invalidCuids.forEach(cuid => {
        expect(isValidCuid(cuid)).toBe(false)
      })
    })
  })
})