export type MacroPayload = {
  slot: string;
  payload: { arguments: string[] };
};

export type BlockTree = {
  uuid: string;
  content: string;
  children?: BlockTree[];
  level: number;
  parent?: BlockTree;
};

export type MediaPair = {
  imageBlock: BlockTree;
  videoBlock: BlockTree;
  imageUrl: string;
  videoUrl: string;
  matchScore: number;
};

export type PluginSettings = {
  regexPattern: string;
  enableAutoConvert: boolean;
};
