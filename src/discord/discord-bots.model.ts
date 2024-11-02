export enum DiscordBots {
  Default = 'Default',
  Notion = 'Notion',
  Trello = 'Trello',
}

export const discordBots = {
  [DiscordBots.Default]: {
    username: 'Default',
    avatar_url: 'https://gravatar.com/avatar/b2df5ec51a0ca026ba97e2bff4568c18?s=400&d=robohash&r=x',
    mentions: [],
    webhookUrl: process.env.DEFAULT_DISCORD_WEBHOOK_URL,
  },
  [DiscordBots.Notion]: {
    username: 'Notion',
    avatar_url: 'https://gravatar.com/avatar/b2df5ec51a0ca026ba97e2bff4568c18?s=400&d=robohash&r=x',
    mentions: [],
    webhookUrl: process.env.NOTION_DISCORD_WEBHOOK_URL,
  },
  [DiscordBots.Trello]: {
    username: 'Trello',
    avatar_url: 'https://gravatar.com/avatar/b2df5ec51a0ca026ba97e2bff4568c18?s=400&d=robohash&r=x',
    mentions: [],
    webhookUrl: process.env.TRELLO_DISCORD_WEBHOOK_URL,
  },
};