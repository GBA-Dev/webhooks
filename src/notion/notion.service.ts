import { Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { from, map, concatMap, Observable, toArray, tap, iif, of, filter } from 'rxjs';

const hash = (str: string): number => {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

@Injectable()
export class NotionService {
  private readonly notion = new Client({ auth: process.env.NOTION_API_KEY });
  private readonly databaseId = { database_id: process.env.NOTION_DATABASE_ID };
  private readonly pageHashMap = new Map<string, number>();
  private isFirstPoll = true; // Track if this is the first poll cycle

  getNotionDatabase(): Observable<any[]> {
    return this.fetchNotionPages().pipe(
      concatMap((pages) => this.checkForPageDifferences(pages)),
      concatMap((pageDifferences) => this.fetchUpdatedPages(pageDifferences)),
      tap(() => this.isFirstPoll = false)
    );
  }

  // Step 1: Fetch and Process Pages from Notion
  private fetchNotionPages(): Observable<{ id: string; hash: number }[]> {
    return from(this.fetchDatabaseInfo()).pipe(
      map((response) => response.results as PageObjectResponse[]),
      map((pages) =>
        pages.map((page) => {
          const { id, properties } = page; // Focus on stable fields like 'properties'
          const stableContent = JSON.stringify({ id, properties });
          return { id, hash: hash(stableContent) };
        })
      )
    );
  }

  // Step 2: Check Each Page Hash and Return an Array with Changes Marked
  private checkForPageDifferences(pages: { id: string; hash: number }[]): Observable<{ id: string; isDifferent: boolean; }[]> {
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
  private fetchUpdatedPages(pageDifferences: { id: string; isDifferent: boolean; }[]): Observable<any[]> {
    return from(pageDifferences).pipe(
      // Only fetch page info if the hash is different and it's not the first poll
      filter((page) => page.isDifferent && !this.isFirstPoll),
      concatMap((page) =>
        from(this.fetchPageInfo(page.id)).pipe(
          tap((_pageInfo) => {
            console.log(`${NotionService.name} Fetched full page info for ${page.id}`, _pageInfo);
          })
        )
      ),
      toArray()
    );
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
  private checkHashMapForPage(pageId: string, pageHash: number): Observable<boolean> {
    return iif(
      () => this.pageHashMap.has(pageId),
      this.pageHashIsDifferent(pageId, pageHash),
      of(this.pageHashMap.set(pageId, pageHash)).pipe(map(() => false))
    );
  }

  // Helper: Check if the Page Hash is Different and Update the HashMap
  private pageHashIsDifferent(pageId: string, pageHash: number): Observable<boolean> {
    return of(this.pageHashMap.get(pageId) !== pageHash).pipe(
      tap((isDifferent) => isDifferent && this.pageHashMap.set(pageId, pageHash))
    );
  }
}
