import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { concatMap, from, map, tap } from 'rxjs';
import { DiscordBots, discordBots } from './discord-bots.model';

@Injectable()
export class DiscordService {
  constructor(private httpService: HttpService) {}

  private readonly logger = new Logger(DiscordService.name);

  postDiscordMessage(messages: unknown[], botInstance: DiscordBots) {
    return from(messages).pipe(
      map((message) => this.formatDiscordMessage(message, botInstance)),
      concatMap((message) =>
        this.postDiscordMessageToWebhook(message, botInstance)
      )
    );
  }

  private formatDiscordMessage(message: any, botInstance: DiscordBots) {
    return {
      username: discordBots[botInstance].username,
      avatar_url: discordBots[botInstance].avatar_url,
      embeds: [
        {
          title: message['title'],
          description: message['description'] || message['url'],
          footer: {
            text: `${botInstance} Bot`,
          },
        },
      ],
    };
  }

  private postDiscordMessageToWebhook(message: any, botInstance: DiscordBots) {
    const webhookUrl = discordBots[botInstance].webhookUrl;
    return this.httpService.post(webhookUrl, message).pipe(
      tap((response) => {
        this.logger.log(
          `Posted Discord message successfully: ${JSON.stringify(
            response.data
          )}`
        );
      })
    );
  }
}
