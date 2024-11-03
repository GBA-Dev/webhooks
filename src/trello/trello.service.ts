import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { concatMap, filter, from, iif, map, of, tap, toArray } from 'rxjs';
import { TrelloResponse, TCardsAndDifferences } from './trello-response.model';
import { createTrelloDiscordMessage } from './trello-action-types.model';
import { hash } from 'src/hash';

@Injectable()
export class TrelloService {
  constructor(private httpService: HttpService) {}

  private readonly logger = new Logger(TrelloService.name);
  private readonly trelloApiKey = process.env.TRELLO_API_KEY;
  private readonly trelloToken = process.env.TRELLO_TOKEN;
  private readonly boardId = process.env.TRELLO_BOARD_ID;
  private readonly trelloWebhookUrl = `https://api.trello.com/1/boards/${this.boardId}/actions?key=${this.trelloApiKey}&token=${this.trelloToken}`;
  private readonly cardHashMap = new Map<string, number>();
  private isFirstPoll = true; // Track if this is the first poll cycle

  getTrelloBoardUpdates() {
    return this.fetchTrelloCards().pipe(
      concatMap((cards) =>
        this.checkForCardDifferences(cards).pipe(
          map((differences) => ({ differences, cards })) // Passing the cards to the next operator
        )
      ),
      concatMap((cardsAndDifferences) =>
        this.filterNewTrelloCards(cardsAndDifferences)
      ),
      concatMap((cardsData) => createTrelloDiscordMessage(cardsData)),
      // TODO Need to finish Marshalling the data
      // ! tap(((data) => console.log(JSON.stringify(data, null, 2)))),
      toArray(),
      tap(() => (this.isFirstPoll = false))
    );
  }

  // Step 1: Fetch and Process Cards from Trello
  private fetchTrelloCards() {
    return this.httpService.get(this.trelloWebhookUrl).pipe(
      map((response) => response.data as TrelloResponse[]),
      map((cards) =>
        cards.map((card) => {
          const { id, data } = card;
          const stableContent = JSON.stringify({ id, data });
          return { id, hash: hash(stableContent), card };
        })
      )
    );
  }

  // Step 2: Check Each Card Hash and Return an Array with Changes Marked
  private checkForCardDifferences(cardsLookup: { id: string; hash: number }[]) {
    return from(cardsLookup).pipe(
      concatMap(({ id, hash: cardHash }) =>
        this.checkHashMapForCard(id, cardHash).pipe(
          map((isDifferent) => ({ id, isDifferent }))
        )
      ),
      toArray()
    );
  }

  // Step 3: Filter New Cards and Return an Array with Only New Cards
  private filterNewTrelloCards(cardDifferences: TCardsAndDifferences) {
    return from(cardDifferences.differences).pipe(
      concatMap(({ id, isDifferent }) =>
        iif(
          () => isDifferent && !this.isFirstPoll,
          of(cardDifferences.cards.find((fullCard) => fullCard.id === id)),
          of(null)
        )
      ),
      filter((card) => card !== null),
      toArray()
    );
  }

  // Helper: Check and Update Card Hashes in the HashMap
  private checkHashMapForCard(cardId: string, cardHash: number) {
    return iif(
      () => this.cardHashMap.has(cardId),
      this.cardHashIsDifferent(cardId, cardHash),
      of(this.cardHashMap.set(cardId, cardHash)).pipe(map(() => false))
    );
  }

  // Helper: Check if the Card Hash is Different and Update the HashMap
  private cardHashIsDifferent(cardId: string, cardHash: number) {
    return of(this.cardHashMap.get(cardId) !== cardHash).pipe(
      tap(
        (isDifferent) => isDifferent && this.cardHashMap.set(cardId, cardHash)
      )
    );
  }
}
