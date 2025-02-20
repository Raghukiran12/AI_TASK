import { IStorage } from "./storage";
import { User, InsertUser, Task, InsertTask } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private currentUserId: number;
  private currentTaskId: number;
  readonly sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  getTasks(userId: number): Task[] {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId
    );
  }

  createTask(userId: number, insertTask: InsertTask): Task {
    const id = this.currentTaskId++;
    const task = {
      ...insertTask,
      id,
      userId,
      completed: false,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  updateTask(
    id: number,
    userId: number,
    updates: Partial<Task>
  ): Task | undefined {
    const task = this.tasks.get(id);
    if (!task || task.userId !== userId) return undefined;
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  deleteTask(id: number, userId: number): boolean {
    const task = this.tasks.get(id);
    if (!task || task.userId !== userId) return false;
    return this.tasks.delete(id);
  }
}

export const storage = new MemStorage();
