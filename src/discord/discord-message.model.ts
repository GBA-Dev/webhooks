export interface DiscordMessage {
  title?: string,
  avatar_url?: string,
  embeds?: {
    title?: string;
    description?: string;
    timestamp?: string;
    fields?: string;
    footer?: {
      text?: string;
      link?: string;
    };
  }[];
}
