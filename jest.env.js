// Environment variables for tests
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret-for-testing-purposes-only-very-long-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'