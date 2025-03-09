import pino from 'pino';
import { wrapClass } from 'src';

export const logger = pino({});

interface User {
  id: string;
  name: string;
  email: string;
}

// Simulated database errors
class DatabaseError extends Error {
  constructor(
    message: string,
    public status: number = 503,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class UserService {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async createUser(user: User): Promise<User> {
    // Simulate occasional database connection issues
    if (Math.random() < 0.2) {
      throw new DatabaseError('Database connection failed');
    }

    this.users.set(user.id, user);
    return user;
  }

  async getUser(id: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUser(id); // Verify user exists
    this.users.delete(id);
  }

  static async validateEmail(email: string): Promise<boolean> {
    // Simple email validation with occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Email validation service unavailable');
    }
    return email.includes('@') && email.includes('.');
  }
}

// Create a wrapped version of UserService with logging and retries
export const WrappedUserService = wrapClass(UserService, {
  logger,
});
const wrappedUserService = new WrappedUserService();
wrappedUserService.createUser({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
});
