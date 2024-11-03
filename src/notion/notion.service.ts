import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { from, map, concatMap, toArray, tap, iif, of, filter } from 'rxjs';
import { discordBots, DiscordBots } from '../discord/discord-bots.model';
import { DiscordMessage } from 'src/discord/discord-message.model';
import { hash } from 'src/hash';

@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);
  private readonly notion = new Client({ auth: process.env.NOTION_API_KEY });
  private readonly databaseId = { database_id: process.env.NOTION_DATABASE_ID };
  private readonly pageHashMap = new Map<string, number>();
  private isFirstPoll = true; // Track if this is the first poll cycle

  getNotionDatabaseUpdates() {
    return this.fetchNotionDatabase().pipe(
      concatMap((pages) => this.checkForPageDifferences(pages)),
      concatMap((pageDifferences) => this.fetchUpdatedPages(pageDifferences)),
      map((messages) =>
        messages.map((message) =>
          this.createNotionDiscordMessage(message, DiscordBots.Notion)
        )
      ),
      tap(() => (this.isFirstPoll = false))
    );
  }

  // Step 1: Fetch and Process Pages from Notion
  private fetchNotionDatabase() {
    return from(this.fetchDatabaseInfo()).pipe(
      map((response) => response.results as PageObjectResponse[]),
      map((pages) =>
        pages.map((page) => {
          const { id, properties } = page;
          const stableContent = JSON.stringify({ id, properties });
          return { id, hash: hash(stableContent) };
        })
      )
    );
  }

  // Step 2: Check Each Page Hash and Return an Array with Changes Marked
  private checkForPageDifferences(pages: { id: string; hash: number }[]) {
    return from(pages).pipe(
      concatMap(({ id, hash: pageHash }) =>
        this.checkHashMapForPage(id, pageHash).pipe(
          map((isDifferent) => ({ id, isDifferent }))
        )
      ),
      toArray()
    );
  }

  // Step 3: Fetch Full Page Info for Pages That Have Changed, except during the first poll
  private fetchUpdatedPages(
    pageDifferences: { id: string; isDifferent: boolean }[]
  ) {
    return from(pageDifferences).pipe(
      // Only fetch page info if the hash is different and it's not the first poll
      filter((page) => page.isDifferent && !this.isFirstPoll),
      concatMap((page) =>
        from(this.fetchPageInfo(page.id)).pipe(
          // tap(() => this.logger.log(`Fetched full page info for ${page.id}`)),
          map((pageInfo: PageObjectResponse) => {
            // They got a bit tricky with the union of various property types
            const titleObject = pageInfo.properties.Page;
            const pageTitle =
              titleObject.type === 'title'
                ? titleObject.title[0].plain_text
                : 'Unknown Title';
            return { title: pageTitle, url: pageInfo.url };
          })
        )
      ),
      toArray()
    );
  }

  title: string;
  description: string;
  timestamp: string;
  fields: string;
  footer: {
    text: string;
    link: string;
  };

  private createNotionDiscordMessage(
    message: { title: string; url: string },
    botInstance: DiscordBots
  ): DiscordMessage {
    return {
      title: discordBots[botInstance].username,
      avatar_url: discordBots[botInstance].avatar_url,
      embeds: [
        {
          title: message['title'],
          description: message['description'] || message['url'],
          footer: {
            text: `${botInstance} Bot`,
            link: 'https://notion.so',
          },
        },
      ],
    };
  }

  // Helper: Fetch Specific Page Information
  private fetchDatabaseInfo() {
    return this.notion.databases.query(this.databaseId);
  }

  // Helper: Fetch Specific Page Information
  private fetchPageInfo(pageId: string) {
    return this.notion.pages.retrieve({ page_id: pageId });
  }

  // Helper: Check and Update Page Hashes in the HashMap
  private checkHashMapForPage(pageId: string, pageHash: number) {
    return iif(
      () => this.pageHashMap.has(pageId),
      this.pageHashIsDifferent(pageId, pageHash),
      of(this.pageHashMap.set(pageId, pageHash)).pipe(map(() => false))
    );
  }

  // Helper: Check if the Page Hash is Different and Update the HashMap
  private pageHashIsDifferent(pageId: string, pageHash: number) {
    return of(this.pageHashMap.get(pageId) !== pageHash).pipe(
      tap(
        (isDifferent) => isDifferent && this.pageHashMap.set(pageId, pageHash)
      )
    );
  }
}
