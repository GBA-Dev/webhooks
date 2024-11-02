import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DiscordModule } from 'src/discord/discord.module';
import { NotionModule } from 'src/notion/notion.module';
import { TrelloModule } from 'src/trello/trello.module';
import { HttpModule } from '@nestjs/axios';
import { WebhookPollingService } from './webhook-polling.service';

@Module({
  imports: [HttpModule, DiscordModule, NotionModule, TrelloModule],
  controllers: [AppController],
  providers: [AppService, WebhookPollingService],
})
export class AppModule {}
