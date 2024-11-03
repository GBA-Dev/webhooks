export type TCardsAndDifferences = {
  differences: {
    id: string;
    isDifferent: boolean;
  }[];
  cards: {
    id: string;
    hash: number;
    card: TrelloResponse;
  }[];
};


export interface TrelloResponse {
  id: string;
  idMemberCreator: string;
  data: Data;
  appCreator: null | string;
  type: string;
  date: string;
  limits: null | unknown;
  memberCreator: MemberCreator;
}

interface Data {
  card: Card;
  old: Old;
  board: Board;
  checklist: Checklist;
  listBefore: List;
  listAfter: List;
  checkItem: CheckItem;
  memberCreator: MemberCreator;
  list: List;
}

interface MemberCreator {
  id: string;
  avatarUrl: string;
  fullName: string;
  initials: string;
  username: string;
}


interface CheckItem {
  id: string;
  name: string;
  state: string;
  idChecklist: string;
}

interface Checklist {
  id: string;
  name: string;
}

interface Card {
  desc: string;
  id: string;
  name: string;
  idShort: number;
  shortLink: string;
  labels: Label[];
  idList: IdList;
  checklists: Checklist[];
  idAttachmentCover: string;
  dueComplete: string;
  due: string;
}

interface IdList {
  id: string;
  name: string;
}

interface Label {
  name: string;
}

interface Old {
  name: string;
  desc: string;
  idAttachmentCover: string;
  dueComplete: string;
  due: string;
}

interface Board {
  id: string;
  name: string;
  shortLink: string;
}

interface List {
  id: string;
  name: string;
}

interface MemberCreator {
  id: string;
  activityBlocked: boolean;
  avatarHash: string;
  avatarUrl: string;
  fullName: string;
  idMemberReferrer: null | string;
  initials: string;
  nonPublic: Record<string, unknown>;
  nonPublicAvailable: boolean;
  username: string;
}