export interface RewritePrompt {
  id: string;
  migrationFileId: string;
  promptText: string;
  createdAt: string;
  userId: string;
}

export interface RewritePromptNotification {
  count: number;
  prompts: RewritePrompt[];
  isRead: boolean;
}