export type AgendaStatus = "draft" | "published";
export type MinutesStatus = "not_started" | "draft" | "in_review" | "confirmed";

export interface Meeting {
  id: string;
  title: string;
  date: string;       // ISO date, e.g. "2026-08-20"
  startTime: string;  // "10:00"
  endTime: string;    // "11:30"
  location: string;
  agendaStatus: AgendaStatus;
  minutesStatus: MinutesStatus;
}
export interface AgendaItem {
  id: string;
  title: string;
  purpose: "none" | "for_noting" | "for_decision" | "for_discussion";
  presenter: string;
  durationMinutes: number;
}

export interface AgendaSection {
  id: string;
  title: string;
  items: AgendaItem[];
}

export type MinuteBlockType = "note" | "decision" | "action";


export interface MinuteBlock {
  id: string;
  agendaItemId: string;
  blockType: MinuteBlockType;
  content: string;
  decisionOutcome?: "approved" | "rejected" | "deferred";
  mover?: string;
  seconder?: string;
  actionOwner?: string;
  actionDueDate?: string;
  actionStatus?: "open" | "in_progress" | "completed" | "cancelled" | "overdue";
}