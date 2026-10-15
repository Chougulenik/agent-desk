export type EventTypeString = 
  | 'text_delta' 
  | 'tool_started' 
  | 'tool_completed' 
  | 'citation' 
  | 'artifact' 
  | 'error'
  | 'comparison_table'
  | 'chart'
  | 'document_viewer'
  | 'status_update'
  | 'workflow_end';

export type EventPrefix = 'agent';
export type PrefixedEventType<T extends EventTypeString> = `${EventPrefix}_${T}`;

export type EventPayloads = {
  text_delta: { delta: string };
  tool_started: { toolName: string; toolInput: Record<string, any> };
  tool_completed: { toolName: string; result: any };
  citation: { url: string; title: string };
  artifact: { title: string; content: string };
  error: { message: string };
  comparison_table: { headers: string[]; rows: string[][] };
  chart: { chartType: string; data: any };
  document_viewer: { title: string; content: string };
  status_update: { status: string; message: string };
  workflow_end: {};
};

export type AgentEventMap = {
  [K in keyof EventPayloads]: { type: K } & EventPayloads[K];
};

export type AgentEvent = AgentEventMap[keyof AgentEventMap];

export type TextPart = { partType: 'text'; text: string };
export type ToolCallPart = { partType: 'tool_call'; toolName: string; input: Record<string, any>; result?: any; status: 'pending' | 'completed' };
export type TablePart = { partType: 'table'; headers: string[]; rows: any[][] };
export type ChartPart = { partType: 'chart'; data: any; chartType: string };
export type CitationPart = { partType: 'citation'; url: string; title: string };
export type ArtifactPart = { partType: 'artifact'; title: string; content: string };
export type DocumentViewerPart = { partType: 'document_viewer'; title: string; content: string };
export type ResearchWorkflowPart = { partType: 'research_workflow'; taskId: string };

export type MessagePart = 
  | TextPart
  | ToolCallPart
  | TablePart
  | ChartPart
  | CitationPart
  | ArtifactPart
  | DocumentViewerPart
  | ResearchWorkflowPart;
