import { MinuteBlock, MinutesStatus } from "./types";

export const mockMinutesStatus: Record<string, MinutesStatus> = {
  "1": "not_started",
  "2": "confirmed",
};

export const mockMinutes: Record<string, MinuteBlock[]> = {
  "1": [],
  "2": [
    {
      id: "mb1",
      agendaItemId: "i2",
      blockType: "note",
      content: "Board reviewed the previous minutes without amendment.",
    },
    {
      id: "mb2",
      agendaItemId: "i4",
      blockType: "decision",
      content: "FY27 budget approved as presented by the CFO.",
      decisionOutcome: "approved",
      mover: "Chair",
      seconder: "Board Secretary",
    },
    {
      id: "mb3",
      agendaItemId: "i4",
      blockType: "action",
      content: "Finalize FY27 budget documentation for the board.",
      actionOwner: "Kartikey Agrahari",
      actionDueDate: "2026-08-30",
      actionStatus: "open",
    },
    {
      id: "mb4",
      agendaItemId: "i1",
      blockType: "action",
      content: "Schedule Q3 offsite meeting.",
      actionOwner: "Admin",
      actionDueDate: "2026-07-20",
      actionStatus: "completed",
    },
  ],
};