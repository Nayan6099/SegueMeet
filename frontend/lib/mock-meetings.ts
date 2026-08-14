import { Meeting } from "./types";

export const mockMeetings: Meeting[] = [
  {
    id: "1",
    title: "August Board Meeting",
    date: "2026-08-20",
    startTime: "10:00",
    endTime: "11:30",
    location: "Conference Room A",
    agendaStatus: "published",
    minutesStatus: "not_started",
  },
  {
    id: "2",
    title: "July Board Meeting",
    date: "2026-07-15",
    startTime: "10:00",
    endTime: "11:00",
    location: "Remote — Google Meet",
    agendaStatus: "published",
    minutesStatus: "confirmed",
  },
  {
    id: "3",
    title: "September Strategy Session",
    date: "2026-09-05",
    startTime: "14:00",
    endTime: "16:00",
    location: "Conference Room A",
    agendaStatus: "draft",
    minutesStatus: "not_started",
  },
];