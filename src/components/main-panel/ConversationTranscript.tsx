import React from "react";
import type { Session, SessionEvent } from "../../types/gooey";
import MarkdownContent from "../ui/MarkdownContent";

type ConversationTranscriptProps = {
  session: Session | null;
  workspaceName: string | null;
  onCreateSession(): void;
  onOpenWorkspace(): void;
};

const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  onCreateSession,
  onOpenWorkspace,
  session,
  workspaceName,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.events.length, session?.id, session?.status]);

  if (!workspaceName) {
    return (
      <div className="flex h-full items-center justify-center px-8 pb-[148px] pt-[47px]">
        <div className="max-w-[360px] text-center">
          <h1 className="text-[18px] leading-7 text-[#ece5dd]">Open a project</h1>
          <p className="mt-2 text-[13px] leading-5 text-[#968d84]">
            Gooey keeps conversations grouped by workspace.
          </p>
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="mt-5 h-8 rounded-full bg-[#f2eeea] px-4 text-[12px] font-medium text-[#1d1a18] transition-colors hover:bg-[#ded8d1]"
          >
            Open folder
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center px-8 pb-[148px] pt-[47px]">
        <div className="max-w-[360px] text-center">
          <h1 className="text-[18px] leading-7 text-[#ece5dd]">Start a conversation</h1>
          <p className="mt-2 text-[13px] leading-5 text-[#968d84]">
            Create a chat in {workspaceName} and send a plain message.
          </p>
          <button
            type="button"
            onClick={onCreateSession}
            className="mt-5 h-8 rounded-full bg-[#f2eeea] px-4 text-[12px] font-medium text-[#1d1a18] transition-colors hover:bg-[#ded8d1]"
          >
            New chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="hide-scrollbar h-full overflow-y-auto px-8 pb-[180px] pt-[72px]"
    >
      <div className="mx-auto flex w-full max-w-[700px] flex-col gap-5">
        {session.events.length === 0 ? (
          <div className="pt-[20vh] text-center">
            <h1 className="text-[18px] leading-7 text-[#ece5dd]">{session.title}</h1>
            <p className="mt-2 text-[13px] leading-5 text-[#968d84]">
              Plain chat only. No system prompt, no tools.
            </p>
          </div>
        ) : (
          session.events.map((event) => (
            <TranscriptEvent key={event.id} event={event} />
          ))
        )}
        {session.status === "working" && (
          <div className="mr-auto max-w-full px-1 py-2 text-[13px] leading-5 text-[#9c938a]">
            Thinking...
          </div>
        )}
      </div>
    </div>
  );
};

type TranscriptEventProps = {
  event: SessionEvent;
};

const TranscriptEvent: React.FC<TranscriptEventProps> = ({ event }) => {
  if (event.type === "user") {
    return (
      <article className="ml-auto max-w-[78%] rounded-[16px] bg-[#2b2723] px-4 py-3 text-[13px] leading-5 text-[#eee7df]">
        <SelectableText>{event.text}</SelectableText>
      </article>
    );
  }

  if (event.type === "system") {
    return (
      <article className="mr-auto max-w-[78%] rounded-[16px] border border-[#573a34] bg-[#2b211f] px-4 py-3 text-[13px] leading-5 text-[#f0aaa0]">
        <SelectableText>{event.text}</SelectableText>
      </article>
    );
  }

  return (
    <article className="mr-auto max-w-full px-1 py-2.5 text-[13px] leading-[1.68] text-[#e6ded6]">
      <div className="selectable-whitespace break-words">
        <MarkdownContent isStreaming={Boolean(event.streamParts)}>
          {event.streamParts ? event.streamParts.join("") : event.text}
        </MarkdownContent>
      </div>
    </article>
  );
};

const SelectableText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="selectable-whitespace whitespace-pre-wrap break-words">
    {children}
  </div>
);

export default ConversationTranscript;
