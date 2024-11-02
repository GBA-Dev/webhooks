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

@Injectable()
export class WebhookPollingService implements OnModuleInit {
  constructor(
    private readonly notionService: NotionService,
    private readonly discordService: DiscordService
  ) {}

  private readonly serviceClassNames = [NotionService.name];
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
        this.notionService.getNotionDatabase().pipe(
          tap((notionMessages) =>
            this.logger.warn(
              `Polling complete: ${JSON.stringify(notionMessages)}`
            )
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
    } catch (error) {
      this.logger.error(`[👻 👻 👻 👻 👻]: ${error}`);
    }
  }
}
