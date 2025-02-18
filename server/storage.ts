import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DbStorage implements IStorage {
  private db: any; // Replace with your database client

  constructor() {
    // Initialize database connection using DATABASE_URL
    this.db = createDbConnection(process.env.DATABASE_URL);
  }

  async getUser(id: number): Promise<User | undefined> {
    return await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return await this.db.query('SELECT * FROM users WHERE username = $1', [username]);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
