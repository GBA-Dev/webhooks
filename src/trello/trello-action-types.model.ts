import { from, map, Observable } from 'rxjs';
import { TrelloResponse } from './trello-response.model';
import { DiscordMessage } from 'src/discord/discord-message.model';

const GREEN = 0x2ecc71;
const RED = 0xe74c3c;
const YELLOW = 0xf1c40f;
const BLUE = 0x7289da;

enum IncudedProperties {
  ID_LABELS = 'idLabels',
  ID_LIST = 'idList',
  NAME = 'name',
  ID_MEMBERS = 'idMembers',
  DUE = 'due',
  DUE_COMPLETE = 'dueComplete',
  ID_ATTACHMENT_COVER = 'idAttachmentCover',
  ID_CHECKLISTS = 'idChecklists',
  STATE = 'state',
}

const incudedPropertiesMapFn = {
  [IncudedProperties.ID_LABELS]: ({ data }: TrelloResponse) => [
    {
      name: 'Labels',
      value: data.card.labels ? data.card.labels[0]?.name : 'No labels',
      inline: true,
    },
  ],
  [IncudedProperties.ID_LIST]: ({ data }: TrelloResponse) => [
    {
      name: 'List',
      value: data.list?.name || 'No list',
      inline: true,
    },
  ],
  [IncudedProperties.ID_MEMBERS]: ({ data }: TrelloResponse) => [
    {
      name: 'Members',
      value: data.memberCreator?.username
        ? data.memberCreator.username
        : 'No members',
      inline: true,
    },
  ],
  [IncudedProperties.DUE]: ({ data }: TrelloResponse) => [
    {
      name: 'Previous status',
      value: data.old?.due ? data.old.due : 'No previous completion status',
      inline: true,
    },
    {
      name: 'Current status',
      value: data.card.due || 'No current completion status',
      inline: true,
    },
  ],
  [IncudedProperties.DUE_COMPLETE]: ({ data }: TrelloResponse) => [
    {
      name: 'Previous completion status',
      value: data.old?.dueComplete
        ? data.old.dueComplete
        : 'No previous completion status',
      inline: true,
    },
    {
      name: 'Current completion status',
      value: data.card.dueComplete || 'No current completion status',
      inline: true,
    },
  ],
  [IncudedProperties.ID_ATTACHMENT_COVER]: ({ data }: TrelloResponse) => [
    {
      name: 'Previous cover',
      value: data.old?.idAttachmentCover
        ? data.old.idAttachmentCover
        : 'No previous cover',
      inline: true,
    },
    {
      name: 'Current cover',
      value: data.card.idAttachmentCover || 'No current cover',
      inline: true,
    },
  ],
  [IncudedProperties.ID_CHECKLISTS]: ({ data }: TrelloResponse) => [
    {
      name: 'Checklist',
      value: data.card.checklists
        ? data.card.checklists[0]?.name
        : 'No checklist',
      inline: true,
    },
  ],
  [IncudedProperties.STATE]: ({ data }: TrelloResponse) => [
    data.checkItem.state == 'complete'
      ? {
          name: 'Previous name',
          value: `:white_check_mark: - ${data.checkItem.name}`,
          inline: true,
        }
      : {
          name: 'Current name',
          value: `:x: - ${data.checkItem.name}`,
          inline: true,
        },
  ],
  [IncudedProperties.NAME]: ({ data }: TrelloResponse) => [
    {
      name: 'Previous name',
      value: data.old.name || 'No previous name',
      inline: true,
    },
    {
      name: 'Current name',
      value: data.checklist?.name
        ? data.checklist.name
        : data.old.name || 'No current name',
      inline: true,
    },
  ],
};

enum TrelloActionTypes {
  CREATE_CARD = 'createCard',
  UPDATE_CARD = 'updateCard',
  DELETE_CARD = 'deleteCard',
  ADD_MEMBER_TO_CARD = 'addMemberToCard',
  REMOVE_MEMBER_FROM_CARD = 'removeMemberFromCard',
  MOVE_CARD_TO_BOARD = 'moveCardToBoard',
  UPDATE_LIST = 'updateList',
  ADD_CHECKLIST_TO_CARD = 'addChecklistToCard',
  REMOVE_CHECKLIST_FROM_CARD = 'removeChecklistFromCard',
  UPDATE_CHECK_ITEM_STATE_ON_CARD = 'updateCheckItemStateOnCard',
  UPDATE_CHECKLIST = 'updateChecklist',
  NOT_SUPPORTED = 'notSupported',
}

const trelloLang: Record<
  TrelloActionTypes,
  {
    title: string;
    description: string;
    incudedProperties: IncudedProperties[];
    color?: number;
  }
> = {
  [TrelloActionTypes.CREATE_CARD]: {
    color: GREEN,
    title: '{fullName} has created {cardName}',
    description: `
      {description}
      [Link to the board](https://trello.com/b/{shortLink})
    `,
    incudedProperties: [IncudedProperties.DUE, IncudedProperties.ID_CHECKLISTS],
  },
  [TrelloActionTypes.UPDATE_CARD]: {
    color: YELLOW,
    title: '{fullName} has updated {cardName}',
    description: `
      {listBefore}
      {description}
      [Link to the board](https://trello.com/b/{shortLink})
    `,
    incudedProperties: [IncudedProperties.DUE, IncudedProperties.ID_CHECKLISTS],
  },
  [TrelloActionTypes.DELETE_CARD]: {
    color: RED,
    title: '{fullName} has deleted {cardId}',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [],
  },
  [TrelloActionTypes.ADD_MEMBER_TO_CARD]: {
    title: '{fullName} added to {cardName}',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [],
  },
  [TrelloActionTypes.REMOVE_MEMBER_FROM_CARD]: {
    title: '{fullName} removed from {cardName}',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [],
  },
  [TrelloActionTypes.MOVE_CARD_TO_BOARD]: {
    title: 'Card moved to board: ',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [],
  },
  [TrelloActionTypes.UPDATE_LIST]: {
    title: 'Card moved to list: ',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [],
  },
  [TrelloActionTypes.ADD_CHECKLIST_TO_CARD]: {
    title: '{fullName} added a Checklist to {cardName}',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [],
  },
  [TrelloActionTypes.REMOVE_CHECKLIST_FROM_CARD]: {
    title: 'Checklist removed from {cardName}',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [],
  },
  [TrelloActionTypes.UPDATE_CHECK_ITEM_STATE_ON_CARD]: {
    title: 'Checklist updated: ',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [IncudedProperties.STATE],
  },
  [TrelloActionTypes.UPDATE_CHECKLIST]: {
    title: 'Update checklist: ',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [IncudedProperties.NAME],
  },
  [TrelloActionTypes.NOT_SUPPORTED]: {
    title: 'NOT_SUPPORTED',
    description: '[Link to the board](https://trello.com/b/{shortLink})',
    incudedProperties: [],
  },
};

export const createTrelloDiscordMessage = (
  cards: {
    id: string;
    hash: number;
    card: TrelloResponse;
  }[]
): Observable<DiscordMessage> => {
  return from(cards).pipe(
    map((cardData) => {
      const card = cardData.card;
      const { type, data } = card;
      const actionLang =
        trelloLang[type] || trelloLang[TrelloActionTypes.NOT_SUPPORTED];
      const { title, description, incudedProperties } = actionLang;
      const incudedPropertiesArray = incudedProperties.map((property) =>
        incudedPropertiesMapFn[property](card)
      );

      // TODO Need to finish Marshalling the data
      // ! console.log(JSON.stringify(cards, null, 2));
      return {
        embeds: [
          {
            color: actionLang.color || BLUE,
            title: title
              .replace('{fullName}', card.memberCreator.fullName || 'Unknown')
              .replace('{cardId}', data.card.id)
              .replace('{cardName}', data.card.name),
            description: description
              .replace('{shortLink}', data.card.shortLink)
              .replace('{description}', data.card.desc || '')
              .replace(
                '{listBefore}',
                data.listBefore?.name
                  ? '## ' +
                      data.listBefore?.name +
                      ' -> ' +
                      data.listAfter?.name
                  : ''
              ),
            timestamp: card.date,
            fields: incudedPropertiesArray.flat(),
            footer: {
              text: 'Trello Bot',
              link: 'https://trello.com',
            },
          },
        ],
      };
    })
  );
};
