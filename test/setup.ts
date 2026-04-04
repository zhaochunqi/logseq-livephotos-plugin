import { vi } from 'vitest';

// Mock Logseq globals
const mockLogseq = {
  Editor: {
    getCurrentPage: vi.fn(),
    getPageBlocksTree: vi.fn(),
    updateBlock: vi.fn(),
    removeBlock: vi.fn(),
    getCurrentBlock: vi.fn(),
    getBlock: vi.fn(),
  },
  App: {
    onMacroRendererSlotted: vi.fn(),
    registerCommandPalette: vi.fn(),
    registerUIItem: vi.fn(),
    getCurrentGraph: vi.fn(),
  },
  UI: {
    showMsg: vi.fn(),
  },
  useSettingsSchema: vi.fn(),
  onSettingsChanged: vi.fn(),
  showSettingsUI: vi.fn(),
  provideModel: vi.fn(),
  ready: vi.fn((fn) => fn()),
  settings: {},
  updateSettings: vi.fn(),
};

(globalThis as any).logseq = mockLogseq;

// Mock parent.document for browser environment
(globalThis as any).parent = {
  document: document,
};
