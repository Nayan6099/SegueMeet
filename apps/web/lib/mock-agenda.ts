import { AgendaSection } from "./types";

// Keyed by meetingId so each meeting has its own agenda
export const mockAgendas: Record<string, AgendaSection[]> = {
  "1": [
    {
      id: "s1",
      title: "Opening",
      items: [
        { id: "i1", title: "Welcome", purpose: "none", presenter: "Chair", durationMinutes: 5 },
      ],
    },
    {
      id: "s2",
      title: "Previous Business",
      items: [
        { id: "i2", title: "Previous Minutes", purpose: "for_noting", presenter: "Chair", durationMinutes: 5 },
        { id: "i3", title: "Outstanding Actions", purpose: "for_discussion", presenter: "Chair", durationMinutes: 10 },
      ],
    },
    {
      id: "s3",
      title: "Strategic Matters",
      items: [
        { id: "i4", title: "FY27 Budget", purpose: "for_decision", presenter: "CFO", durationMinutes: 20 },
      ],
    },
  ],
};