import { getUtools, type Display, type UToolsBrowserWindow } from './utools';

// 礼花配置类型
export interface ConfettiConfig {
  colorScheme: 'classic' | 'golden' | 'purple' | 'rainbow';
  intensity: 'low' | 'medium' | 'high';
  duration: number; // 毫秒
  fullscreen: boolean; // 是否全屏（多显示器）
}

// 默认配置
const defaultConfig: ConfettiConfig = {
  colorScheme: 'classic',
  intensity: 'medium',
  duration: 3000,
  fullscreen: true
};

// 存储已创建的窗口引用
let confettiWindows: UToolsBrowserWindow[] = [];

// 颜色预设
const colorPresets: Record<string, string[]> = {
  classic: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
  golden: ['#ffd700', '#ffb347', '#ff8c00', '#ffa500', '#ffcc00'],
  purple: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
  rainbow: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8f00ff']
};

// 强度配置
const intensityConfig = {
  low: { particleCount: 50, spread: 60 },
  medium: { particleCount: 100, spread: 90 },
  high: { particleCount: 200, spread: 120 }
};

/**
 * 检查全屏礼花功能是否可用
 */
export function isFullscreenConfettiSupported(): boolean {
  const api = getUtools();
  return !!(
    api &&
    typeof api.getAllDisplays === 'function' &&
    typeof api.createBrowserWindow === 'function'
  );
}

/**
 * 获取所有显示器信息
 */
function getAllDisplays(): Display[] {
  const api = getUtools();
  if (api && typeof api.getAllDisplays === 'function') {
    return api.getAllDisplays();
  }
  // 回退：返回模拟的单屏幕
  return [{
    id: 0,
    bounds: { x: 0, y: 0, width: window.screen.width, height: window.screen.height },
    workArea: { x: 0, y: 0, width: window.screen.availWidth, height: window.screen.availHeight },
    scaleFactor: window.devicePixelRatio || 1,
    rotation: 0
  }];
}

/**
 * 在单个显示器上触发礼花效果
 */
function fireConfettiOnDisplay(
  display: Display,
  config: ConfettiConfig
): UToolsBrowserWindow | null {
  const api = getUtools();
  if (!api || typeof api.createBrowserWindow !== 'function') {
    return null;
  }

  // 构建查询参数
  const queryParams = new URLSearchParams({
    colors: config.colorScheme,
    intensity: config.intensity,
    duration: config.duration.toString()
  }).toString();

  const confettiUrl = `confetti-window.html?${queryParams}`;

  try {
    const ubWindow = api.createBrowserWindow(
      confettiUrl,
      {
        show: true,
        transparent: true,
        frame: false,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: true,
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height
      },
      () => {
        try {
          ubWindow.setAlwaysOnTop(true);
        } catch {
          // 静默忽略
        }
      }
    );

    // 延迟关闭窗口
    setTimeout(() => {
      try {
        ubWindow?.close();
      } catch {
        // 静默忽略
      }
    }, config.duration + 1000);

    return ubWindow;
  } catch {
    return null;
  }
}

/**
 * 在所有显示器上触发礼花效果
 */
export function fireConfettiOnAllDisplays(
  config: Partial<ConfettiConfig> = {}
): void {
  const finalConfig = { ...defaultConfig, ...config };
  const displays = getAllDisplays();

  // 清理之前的窗口
  closeAllConfettiWindows();

  // 同时为所有显示器创建礼花窗口
  displays.forEach((display) => {
    const win = fireConfettiOnDisplay(display, finalConfig);
    if (win) {
      confettiWindows.push(win);
    }
  });
}

/**
 * 关闭所有礼花窗口
 */
export function closeAllConfettiWindows(): void {
  confettiWindows.forEach((win) => {
    try {
      if (win && typeof win.close === 'function') {
        win.close();
      }
    } catch (e) {
      // 静默忽略
    }
  });
  confettiWindows = [];
}

/**
 * 在当前窗口内触发礼花（回退方案）
 */
export async function fireConfettiInWindow(
  config: Partial<ConfettiConfig> = {}
): Promise<void> {
  const confetti = (await import('canvas-confetti')).default;
  const finalConfig = { ...defaultConfig, ...config };
  const colors = colorPresets[finalConfig.colorScheme] || colorPresets.classic;
  const intensityCfg = intensityConfig[finalConfig.intensity];

  const end = Date.now() + finalConfig.duration;

  const frame = () => {
    confetti({
      particleCount: Math.floor(intensityCfg.particleCount / 3),
      angle: 60,
      spread: intensityCfg.spread,
      origin: { x: 0, y: 0.7 },
      colors: colors
    });

    confetti({
      particleCount: Math.floor(intensityCfg.particleCount / 3),
      angle: 120,
      spread: intensityCfg.spread,
      origin: { x: 1, y: 0.7 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/**
 * 智能触发礼花（自动选择全屏或窗口内）
 */
export function fireConfetti(config: Partial<ConfettiConfig> = {}): void {
  const finalConfig = { ...defaultConfig, ...config };

  if (finalConfig.fullscreen && isFullscreenConfettiSupported()) {
    fireConfettiOnAllDisplays(config);
  } else {
    fireConfettiInWindow(config);
  }
}
