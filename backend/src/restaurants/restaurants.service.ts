import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RestaurantsService {
  constructor(private readonly database: DatabaseService) {}

  async findAll() {
    return (await this.database.readDb()).restaurants;
  }

  async findOne(id: string) {
    const restaurant = (await this.database.readDb()).restaurants.find((r) => r.id === id);
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }
}
