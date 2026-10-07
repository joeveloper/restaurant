import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MenuService {
  constructor(private readonly database: DatabaseService) {}

  async findAvailable() {
    const db = await this.database.readDb();
    return db.menuItems.filter((i) => i.available);
  }
}
