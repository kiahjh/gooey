import type { Workspace } from "./types";

export const mockWorkspaces: Workspace[] = [
  {
    id: "henderson-homes",
    name: "henderson-homes",
    sessions: [
      {
        id: "henderson-homes-1",
        title: "Scaffold Next.js app boilerplate",
        updatedAtLabel: "21h",
        status: "unread",
      },
      {
        id: "henderson-homes-2",
        title: "Clean up starter page and globals",
        updatedAtLabel: "18h",
        status: "idle",
      },
      {
        id: "henderson-homes-3",
        title: "Figure out homepage layout direction",
        updatedAtLabel: "2m",
        status: "working",
      },
    ],
  },
  {
    id: "replist",
    name: "replist",
    sessions: [
      {
        id: "replist-1",
        title: "Audit onboarding flow for edge cases",
        updatedAtLabel: "3d",
        status: "idle",
      },
      {
        id: "replist-2",
        title: "Review agent traces from latest run",
        updatedAtLabel: "46m",
        status: "unread",
      },
      {
        id: "replist-3",
        title: "Check summarizer output against snapshots",
        updatedAtLabel: "11m",
        status: "unread",
      },
    ],
  },
  {
    id: "gooey",
    name: "gooey",
    sessions: [
      {
        id: "gooey-1",
        title: "Plan next Gooey step",
        updatedAtLabel: "1h",
        status: "working",
      },
      {
        id: "gooey-2",
        title: "Sketch transcript tool cards",
        updatedAtLabel: "4h",
        status: "idle",
      },
      {
        id: "gooey-3",
        title: "Review sidebar interaction polish",
        updatedAtLabel: "12m",
        status: "unread",
      },
      {
        id: "gooey-4",
        title: "Tune sidebar dark palette",
        updatedAtLabel: "now",
        status: "idle",
        archived: true,
      },
    ],
  },
  {
    id: "resolve",
    name: "resolve",
    sessions: [
      {
        id: "resolve-1",
        title: "Chase flaky workspace sync bug",
        updatedAtLabel: "now",
        status: "working",
      },
      {
        id: "resolve-2",
        title: "Read through crash report notes",
        updatedAtLabel: "5h",
        status: "idle",
      },
      {
        id: "resolve-3",
        title: "Respond to triage follow-up questions",
        updatedAtLabel: "29m",
        status: "unread",
      },
    ],
  },
  {
    id: "atlas",
    name: "atlas",
    sessions: [
      {
        id: "atlas-1",
        title: "Map extension API surface area",
        updatedAtLabel: "2d",
        status: "idle",
      },
      {
        id: "atlas-2",
        title: "Check provider settings migration",
        updatedAtLabel: "7m",
        status: "working",
      },
      {
        id: "atlas-3",
        title: "Wait for schema regeneration to finish",
        updatedAtLabel: "now",
        status: "working",
      },
    ],
  },
  {
    id: "papertrail",
    name: "papertrail",
    sessions: [
      {
        id: "papertrail-1",
        title: "Compare session persistence approaches",
        updatedAtLabel: "9h",
        status: "idle",
      },
      {
        id: "papertrail-2",
        title: "Collect notes on transcript chunking",
        updatedAtLabel: "1d",
        status: "idle",
      },
    ],
  },
  {
    id: "playground",
    name: "playground",
    sessions: [],
  },
];
