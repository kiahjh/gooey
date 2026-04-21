export type Session = {
  id: string;
  title: string;
  updatedAtLabel: string;
  status: "idle" | "unread" | "working";
  archived?: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  sessions: Session[];
};
