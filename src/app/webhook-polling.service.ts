import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  catchError,
  defaultIfEmpty,
  lastValueFrom,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { DiscordBots } from 'src/discord/discord-bots.model';
import { DiscordService } from 'src/discord/discord.service';
import { NotionService } from 'src/notion/notion.service';
import { TrelloService } from 'src/trello/trello.service';

@Injectable()
export class WebhookPollingService implements OnModuleInit {
  constructor(
    private readonly notionService: NotionService,
    private readonly discordService: DiscordService,
    private readonly trelloService: TrelloService
  ) {}

  private readonly serviceClassNames = [NotionService.name, TrelloService.name];
  private readonly logger = new Logger(WebhookPollingService.name);
  private intervalId: NodeJS.Timeout;

  async onModuleInit() {
    this.logger.log('WebhookPollingService initialized ✅');
    this.startPolling();
  }

  startPolling() {
    this.logger.log(`Starting polling 🔥 for ${this.serviceClassNames}`);
    this.intervalId = setInterval(() => {
      this.pollForUpdates();
    }, parseInt(process.env.POLLING_INTERVAL) || 60000);
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('Polling stopped ❌');
    }
  }

  private async pollForUpdates() {
    try {
      await lastValueFrom(
        this.notionService.getNotionDatabaseUpdates().pipe(
          tap((notionMessages) =>
            notionMessages.length > 0
              ? this.logger.warn(
                  `${
                    TrelloService.name
                  } Messages ready to be sent: ${JSON.stringify(
                    notionMessages
                  )}`
                )
              : this.logger.log(`${NotionService.name} No messages to send`)
          ),
          switchMap((notionMessages) => {
            return this.discordService.postDiscordMessage(
              notionMessages,
              DiscordBots.Notion
            );
          }),
          defaultIfEmpty(false),
          catchError((error) => {
            this.logger.error(
              `[${NotionService.name}] Error while polling: ${error}`
            );
            return of(null);
          })
        )
      );

      await lastValueFrom(
        this.trelloService.getTrelloBoardUpdates().pipe(
          tap((trelloMessages) =>
            trelloMessages.length > 0
              ? this.logger.warn(
                  `${
                    TrelloService.name
                  } Messages ready to be sent: ${JSON.stringify(
                    trelloMessages
                  )}`
                )
              : this.logger.log(`${TrelloService.name} No messages to send`)
          ),
          switchMap((trelloMessages) => {
            return this.discordService.postDiscordMessage(
              trelloMessages,
              DiscordBots.Trello
            );
          }),
          defaultIfEmpty(false),
          catchError((error) => {
            this.logger.error(
              `${TrelloService.name} Error while polling: ${error}`
            );
            return of(null);
          })
        )
      );
    } catch (error) {
      this.logger.error(`[👻 👻 👻 👻 👻]: ${error}`);
    }
  }
}
