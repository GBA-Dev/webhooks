import { Module } from '@nestjs/common';
import { TrelloService } from './trello.service';
import { TrelloController } from './trello.controller';

@Module({
  providers: [TrelloService],
  controllers: [TrelloController]
})
export class TrelloModule {}
