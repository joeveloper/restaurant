import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface Db {
  restaurants: { id: string; name: string; isOpen: boolean }[];
  menuItems: { id: string; restaurantId: string; name: string; price: number; available: boolean }[];
  orders: any[];
}

const DB_PATH = join(__dirname, '..', '..', 'db.json');

@Injectable()
export class DatabaseService {
  // Serializes read-modify-write cycles so concurrent requests don't clobber each other.
  private queue: Promise<unknown> = Promise.resolve();

  async readDb(): Promise<Db> {
    return JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
  }

  async writeDb(db: Db): Promise<void> {
    const tmp = `${DB_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, DB_PATH);
  }

  /** Read db, let `fn` modify it, write it back - one at a time. */
  update<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.readDb();
      const result = await fn(db);
      await this.writeDb(db);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
}
