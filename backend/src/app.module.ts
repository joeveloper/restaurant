import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({ imports: [DatabaseModule, MenuModule, RestaurantsModule, OrdersModule] })
export class AppModule {}
