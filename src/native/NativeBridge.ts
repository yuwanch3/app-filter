import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AppFilterModule } = NativeModules;

interface AppFilterNativeModule {
  initialize(): Promise<boolean>;
  isAccessibilityServiceEnabled(): Promise<boolean>;
  openAccessibilitySettings(): Promise<boolean>;
  updateKeywords(keywords: string[]): Promise<boolean>;
  sendOverlayCommand(
    left: number,
    top: number,
    width: number,
    height: number,
    packageName: string,
  ): Promise<boolean>;
}

type AccessibilityEventListener = (event: AccessibilityEvent) => void;

interface AccessibilityEvent {
  type: string;
  text?: string;
  packageName?: string;
  source?: string;
  matchedKeyword?: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  message?: string;
}

class NativeBridge {
  private module: AppFilterNativeModule | null = null;
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: Map<string, Set<AccessibilityEventListener>> = new Map();

  constructor() {
    if (Platform.OS === 'android' && AppFilterModule) {
      this.module = AppFilterModule as AppFilterNativeModule;
      this.eventEmitter = new NativeEventEmitter(AppFilterModule);
      this.setupListeners();
    }
  }

  private setupListeners() {
    if (!this.eventEmitter) return;

    this.eventEmitter.addListener('AccessibilityEvent', (event: AccessibilityEvent) => {
      const typeListeners = this.listeners.get(event.type);
      if (typeListeners) {
        typeListeners.forEach(listener => listener(event));
      }

      const allListeners = this.listeners.get('*');
      if (allListeners) {
        allListeners.forEach(listener => listener(event));
      }
    });
  }

  isAvailable(): boolean {
    return this.module !== null;
  }

  async initialize(): Promise<boolean> {
    if (!this.module) return false;
    return this.module.initialize();
  }

  async isAccessibilityServiceEnabled(): Promise<boolean> {
    if (!this.module) return false;
    return this.module.isAccessibilityServiceEnabled();
  }

  async openAccessibilitySettings(): Promise<boolean> {
    if (!this.module) return false;
    return this.module.openAccessibilitySettings();
  }

  async updateKeywords(keywords: string[]): Promise<boolean> {
    if (!this.module) return false;
    return this.module.updateKeywords(keywords);
  }

  async sendOverlayCommand(
    left: number,
    top: number,
    width: number,
    height: number,
    packageName: string,
  ): Promise<boolean> {
    if (!this.module) return false;
    return this.module.sendOverlayCommand(left, top, width, height, packageName);
  }

  addEventListener(type: string, listener: AccessibilityEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  removeAllListeners(type?: string) {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }
}

export const nativeBridge = new NativeBridge();
export type { AccessibilityEvent, AppFilterNativeModule };