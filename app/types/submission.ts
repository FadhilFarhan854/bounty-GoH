export interface QuestSubmission {
  id: string;
  playerName: string;
  bossId: string;
  bossName: string;
  bounty: string;
  videoFileName: string;
  videoUrl?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  reviewNote?: string;
}
