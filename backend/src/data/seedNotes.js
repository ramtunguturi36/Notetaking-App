export const INITIAL_NOTES = [
  {
    id: "n1",
    title: "Architecting Digital Stillness",
    content:
      "The modern interface is often a battleground for attention. I need to refine the editor layout for calm writing. ## Key Idea\nNegative space is a functional design tool.",
    tags: ["design", "ux", "productivity"],
    summary:
      "A note about reducing interface noise and designing for focused thinking.",
    actionItems: ["Refine the editor layout for calm writing."],
    createdAt: "2026-01-11T09:00:00.000Z",
    updatedAt: "2026-01-11T10:10:00.000Z",
    inbox: true,
    workspaceId: "w1",
  },
  {
    id: "n2",
    title: "Pythonic Concurrency Patterns",
    content:
      "Detailed analysis of asyncio and threading for backend services. TODO: benchmark worker pool strategy. I should compare throughput with queue backpressure.",
    tags: ["python", "backend", "performance"],
    summary:
      "Compares Python concurrency approaches for scalable backend workloads.",
    actionItems: [
      "Benchmark worker pool strategy.",
      "Compare throughput with queue backpressure.",
    ],
    createdAt: "2026-04-10T18:00:00.000Z",
    updatedAt: "2026-04-10T19:20:00.000Z",
    inbox: false,
    workspaceId: "w1",
  },
  {
    id: "n3",
    title: "Neural Architecture Research",
    content:
      "An exploration into the structural patterns of artificial and biological cognition. Action: link this with graph view interactions.",
    tags: ["research", "ai", "graph"],
    summary:
      "Examines overlaps between biological and machine cognition structures.",
    actionItems: ["Link this with graph view interactions."],
    createdAt: "2026-04-09T12:40:00.000Z",
    updatedAt: "2026-04-12T07:30:00.000Z",
    inbox: false,
    workspaceId: "w1",
  },
  {
    id: "n4",
    title: "Weekly Budget Control Loop",
    content:
      "I should review subscriptions every Friday and move savings automatically after salary. TODO: set alert for spending threshold.",
    tags: ["finance", "focus", "productivity"],
    summary:
      "Defines a repeatable weekly process for spending control and automated savings.",
    actionItems: [
      "Review subscriptions every Friday.",
      "Set alert for spending threshold.",
    ],
    createdAt: "2026-04-08T08:10:00.000Z",
    updatedAt: "2026-04-13T06:30:00.000Z",
    inbox: true,
    workspaceId: "w1",
  },
  {
    id: "n5",
    title: "Deep Work Sprint Template",
    content:
      "A 90-minute focus block with one objective, no notifications, and a 10-minute review. Action: prepare tomorrow sprint at night.",
    tags: ["focus", "productivity", "design"],
    summary:
      "Captures a repeatable deep-work ritual with planning and review checkpoints.",
    actionItems: ["Prepare tomorrow sprint at night."],
    createdAt: "2026-04-07T15:40:00.000Z",
    updatedAt: "2026-04-13T18:20:00.000Z",
    inbox: false,
    workspaceId: "w1",
  },
  {
    id: "n6",
    title: "Graph Interaction Backlog",
    content:
      "Need better node clustering by tags and smooth transitions when selecting a node. TODO: test force layout alternative.",
    tags: ["graph", "ai", "design"],
    summary:
      "Backlog of interaction improvements for graph readability and navigation.",
    actionItems: ["Test force layout alternative."],
    createdAt: "2026-04-06T11:30:00.000Z",
    updatedAt: "2026-04-14T09:05:00.000Z",
    inbox: true,
    workspaceId: "w1",
  },
  {
    id: "n7",
    title: "Async API Retry Strategy",
    content:
      "Use exponential backoff with jitter and cap retries to prevent retry storms. I need to log retry cause and final status.",
    tags: ["python", "backend", "performance"],
    summary:
      "Outlines safe retry design to increase resilience without overload.",
    actionItems: ["Log retry cause and final status."],
    createdAt: "2026-04-05T20:00:00.000Z",
    updatedAt: "2026-04-14T21:55:00.000Z",
    inbox: false,
    workspaceId: "w1",
  },
  {
    id: "n8",
    title: "Meeting Capture Checklist",
    content:
      "Capture decisions, owners, and deadlines in one pass. Action: send summary within 20 minutes of meeting end.",
    tags: ["meeting", "productivity", "focus"],
    summary:
      "Simple template for faster and more reliable meeting note quality.",
    actionItems: ["Send summary within 20 minutes of meeting end."],
    createdAt: "2026-04-05T09:45:00.000Z",
    updatedAt: "2026-04-15T07:10:00.000Z",
    inbox: true,
    workspaceId: "w1",
  },
  {
    id: "n9",
    title: "UX Copy Tone Guide",
    content:
      "Use calm, direct copy. Avoid urgency language unless critical. TODO: revise empty states and save confirmations.",
    tags: ["ux", "design", "research"],
    summary:
      "Defines product voice principles for clarity and reduced cognitive load.",
    actionItems: ["Revise empty states and save confirmations."],
    createdAt: "2026-04-04T16:20:00.000Z",
    updatedAt: "2026-04-15T12:05:00.000Z",
    inbox: false,
    workspaceId: "w1",
  },
  {
    id: "n10",
    title: "Search Intent Buckets",
    content:
      "Categorize queries as recall, exploration, or action. I should tune ranking differently for each bucket.",
    tags: ["search", "ai", "backend"],
    summary: "Proposes intent-aware scoring to improve note retrieval quality.",
    actionItems: ["Tune ranking per intent bucket."],
    createdAt: "2026-04-03T13:35:00.000Z",
    updatedAt: "2026-04-15T19:50:00.000Z",
    inbox: false,
    workspaceId: "w1",
  },
  {
    id: "n11",
    title: "Reading Pipeline for Research",
    content:
      "Skim, annotate, summarize, and convert into one evergreen note. Action: schedule synthesis blocks twice weekly.",
    tags: ["research", "productivity", "focus"],
    summary:
      "Process for converting fragmented reading into reusable knowledge notes.",
    actionItems: ["Schedule synthesis blocks twice weekly."],
    createdAt: "2026-04-03T08:25:00.000Z",
    updatedAt: "2026-04-16T06:55:00.000Z",
    inbox: true,
    workspaceId: "w1",
  },
  {
    id: "n12",
    title: "Backend Domain Boundaries",
    content:
      "Keep routes thin, services orchestration-only, and domain pure. TODO: add validation layer for note payloads.",
    tags: ["backend", "design", "python"],
    summary: "Architecture rule set to keep backend logic modular and testable.",
    actionItems: ["Add validation layer for note payloads."],
    createdAt: "2026-04-02T18:40:00.000Z",
    updatedAt: "2026-04-16T14:30:00.000Z",
    inbox: false,
    workspaceId: "w1",
  },
  {
    id: "n13",
    title: "Personal Energy Tracker",
    content:
      "Track sleep, focus quality, and mood for correlation. I need to keep entries short to avoid friction.",
    tags: ["focus", "productivity", "general"],
    summary: "Daily tracking model to align work type with energy patterns.",
    actionItems: ["Keep entries short to avoid friction."],
    createdAt: "2026-04-02T07:15:00.000Z",
    updatedAt: "2026-04-16T20:05:00.000Z",
    inbox: true,
    workspaceId: "w1",
  },
];
