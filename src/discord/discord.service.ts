import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { catchError, concatMap, from, of, tap } from 'rxjs';
import { DiscordBots, discordBots } from './discord-bots.model';
import { DiscordMessage } from './discord-message.model';

@Injectable()
export class DiscordService {
  constructor(private httpService: HttpService) {}

  private readonly logger = new Logger(DiscordService.name);

  postDiscordMessage(messages: DiscordMessage[], botInstance: DiscordBots) {
    return from(messages).pipe(
      tap(() => this.logger.log(`Posting Discord message from ${botInstance}`)),
      concatMap((message) =>
        this.postDiscordMessageToWebhook(message, botInstance)
      )
    );
  }

  private postDiscordMessageToWebhook(
    message: DiscordMessage,
    botInstance: DiscordBots
  ) {
    const webhookUrl = discordBots[botInstance].webhookUrl;
    return this.httpService.post(webhookUrl, message).pipe(
      tap(() => this.logger.log(`Posted Discord message from ${botInstance}`)),
      catchError((error) => {
        this.logger.error(
          `Failed to post Discord message from ${botInstance}: ${error}`
        );
        return of(error);
      })
    );
  }
}
