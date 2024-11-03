import { Module } from '@nestjs/common';
import { TrelloService } from './trello.service';
import { TrelloController } from './trello.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [TrelloService],
  controllers: [TrelloController],
  exports: [TrelloService],
})
export class TrelloModule {}
