export const REACTION_EMOJIS = ['😹', '😸', '🙀', '😿', '😾', '😼'] as const;

export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export interface ReactionEvent {
  id: string;
  uid: string;
  emoji: ReactionEmoji;
  createdAt: number;
}
