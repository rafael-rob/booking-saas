import {
  sanitizeHTML,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeURL,
  sanitizeFilename,
  detectMaliciousContent,
  sanitizeObject,
  sanitizeRequestBody,
  validateFileUpload,
} from '../sanitization'

describe('sanitization', () => {
  describe('sanitizeHTML', () => {
    it('should allow safe HTML tags', () => {
      const input = '<b>Bold</b> <i>Italic</i> <em>Emphasis</em>'
      const result = sanitizeHTML(input)
      expect(result).toContain('<b>Bold</b>')
      expect(result).toContain('<i>Italic</i>')
      expect(result).toContain('<em>Emphasis</em>')
    })

    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script><p>Content</p>'
      const result = sanitizeHTML(input)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should remove dangerous attributes', () => {
      const input = '<p onclick="alert()">Content</p>'
      const result = sanitizeHTML(input)
      expect(result).not.toContain('onclick')
    })

    it('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('')
      expect(sanitizeHTML(null as any)).toBe('')
      expect(sanitizeHTML(undefined as any)).toBe('')
    })
  })

  describe('sanitizeText', () => {
    it('should remove all HTML tags but keep content', () => {
      const input = '<b>Bold</b> text with <script>alert("xss")</script>'
      const result = sanitizeText(input)
      expect(result).toBe('Bold text with')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('should trim whitespace', () => {
      const input = '   spaced content   '
      const result = sanitizeText(input)
      expect(result).toBe('spaced content')
    })

    it('should handle special characters', () => {
      const input = 'Text with & < > " \' characters'
      const result = sanitizeText(input)
      expect(result).toBe('Text with & characters')
    })
  })

  describe('sanitizeEmail', () => {
    it('should normalize email format', () => {
      const input = '  Test@Example.COM  '
      const result = sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })

    it('should remove invalid characters', () => {
      const input = 'test<>@example.com'
      const result = sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })

    it('should handle empty input', () => {
      expect(sanitizeEmail('')).toBe('')
      expect(sanitizeEmail('   ')).toBe('')
    })
  })

  describe('sanitizePhone', () => {
    it('should preserve valid phone characters', () => {
      const input = '+33 1 23 45 67 89'
      const result = sanitizePhone(input)
      expect(result).toBe('+33 1 23 45 67 89')
    })

    it('should remove invalid characters', () => {
      const input = '+33.1.23.45.67.89abc'
      const result = sanitizePhone(input)
      expect(result).toBe('+33123456789')
    })

    it('should normalize spaces', () => {
      const input = '+33   1    23   45'
      const result = sanitizePhone(input)
      expect(result).toBe('+33 1 23 45')
    })
  })

  describe('sanitizeURL', () => {
    it('should accept valid HTTP/HTTPS URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com/path',
        'https://sub.example.com:8080/path?query=1',
      ]

      validUrls.forEach(url => {
        expect(sanitizeURL(url)).toBe(url)
      })
    })

    it('should reject dangerous protocols', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'ftp://example.com',
      ]

      dangerousUrls.forEach(url => {
        expect(sanitizeURL(url)).toBe('')
      })
    })

    it('should handle invalid URLs', () => {
      const invalidUrls = ['not-a-url', 'htp://invalid', '']

      invalidUrls.forEach(url => {
        expect(sanitizeURL(url)).toBe('')
      })
    })
  })

  describe('sanitizeFilename', () => {
    it('should preserve valid characters', () => {
      const input = 'valid-filename_123.pdf'
      const result = sanitizeFilename(input)
      expect(result).toBe('valid-filename_123.pdf')
    })

    it('should remove dangerous characters', () => {
      const input = 'file<name>:with"bad|chars?.exe'
      const result = sanitizeFilename(input)
      expect(result).toBe('filenamewithbadchars.exe')
    })

    it('should remove leading dots', () => {
      const input = '...hidden-file.txt'
      const result = sanitizeFilename(input)
      expect(result).toBe('hidden-file.txt')
    })

    it('should limit length', () => {
      const input = 'a'.repeat(300)
      const result = sanitizeFilename(input)
      expect(result.length).toBe(255)
    })
  })

  describe('detectMaliciousContent', () => {
    it('should detect script tags', () => {
      const input = '<script>alert("xss")</script>'
      const result = detectMaliciousContent(input)
      expect(result.isMalicious).toBe(true)
      expect(result.reasons).toContain('Script tag détecté')
    })

    it('should detect JavaScript protocols', () => {
      const input = 'javascript:alert("xss")'
      const result = detectMaliciousContent(input)
      expect(result.isMalicious).toBe(true)
      expect(result.reasons).toContain('Protocole JavaScript détecté')
    })

    it('should detect SQL injection attempts', () => {
      const input = 'DROP TABLE users;'
      const result = detectMaliciousContent(input)
      expect(result.isMalicious).toBe(true)
      expect(result.reasons).toContain('Commande SQL suspecte détectée')
    })

    it('should detect event handlers', () => {
      const input = 'onclick="alert(\'xss\')"'
      const result = detectMaliciousContent(input)
      expect(result.isMalicious).toBe(true)
      expect(result.reasons).toContain('Gestionnaire d\'événement JavaScript détecté')
    })

    it('should not flag safe content', () => {
      const input = 'This is safe content with normal text'
      const result = detectMaliciousContent(input)
      expect(result.isMalicious).toBe(false)
      expect(result.reasons).toHaveLength(0)
    })

    it('should handle multiple threats', () => {
      const input = '<script>alert("xss")</script> javascript:void(0)'
      const result = detectMaliciousContent(input)
      expect(result.isMalicious).toBe(true)
      expect(result.reasons.length).toBeGreaterThan(1)
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize object properties according to schema', () => {
      const input = {
        name: '  John Doe  ',
        email: '  TEST@EXAMPLE.COM  ',
        description: '<script>alert("xss")</script><b>Bold text</b>',
        phone: '+33 1.23.45.67.89abc',
      }

      const schema = {
        name: 'text' as const,
        email: 'email' as const,
        description: 'html' as const,
        phone: 'phone' as const,
      }

      const result = sanitizeObject(input, schema)

      expect(result.name).toBe('John Doe')
      expect(result.email).toBe('test@example.com')
      expect(result.description).toContain('<b>Bold text</b>')
      expect(result.description).not.toContain('<script>')
      expect(result.phone).toBe('+33 123456789')
    })
  })

  describe('sanitizeRequestBody', () => {
    it('should sanitize request body fields', () => {
      const body = {
        name: '  <script>alert("xss")</script>John  ',
        email: '  JOHN@EXAMPLE.COM  ',
        other: 'unchanged',
      }

      const fieldTypes = {
        name: 'text' as const,
        email: 'email' as const,
      }

      const result = sanitizeRequestBody(body, fieldTypes)

      expect(result.name).toBe('John')
      expect(result.email).toBe('john@example.com')
      expect(result.other).toBe('unchanged')
    })
  })

  describe('validateFileUpload', () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      const file = new File(['content'], name, { type })
      Object.defineProperty(file, 'size', { value: size })
      return file
    }

    it('should validate correct files', () => {
      const file = createMockFile('image.jpg', 'image/jpeg', 1024 * 1024) // 1MB
      const result = validateFileUpload(file)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject oversized files', () => {
      const file = createMockFile('large.jpg', 'image/jpeg', 10 * 1024 * 1024) // 10MB
      const result = validateFileUpload(file, { maxSize: 5 * 1024 * 1024 }) // 5MB limit
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Fichier trop volumineux (max: 5MB)')
    })

    it('should reject invalid MIME types', () => {
      const file = createMockFile('document.exe', 'application/x-executable', 1024)
      const result = validateFileUpload(file)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('Type de fichier non autorisé'))).toBe(true)
    })

    it('should reject invalid extensions', () => {
      const file = createMockFile('malware.exe', 'image/jpeg', 1024) // Wrong extension for MIME type
      const result = validateFileUpload(file)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('Extension non autorisée'))).toBe(true)
    })

    it('should reject malicious filenames', () => {
      const file = createMockFile('<script>alert("xss")</script>.jpg', 'image/jpeg', 1024)
      const result = validateFileUpload(file)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Nom de fichier contient du contenu malveillant')
    })

    it('should handle custom validation options', () => {
      const file = createMockFile('document.txt', 'text/plain', 1024)
      const result = validateFileUpload(file, {
        allowedTypes: ['text/plain'],
        allowedExtensions: ['.txt'],
        maxSize: 2048,
      })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})