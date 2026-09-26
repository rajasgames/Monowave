export function createAudioPlayer() {
  const listeners: Record<string, Array<(...args: any[]) => void>> = {};

  return {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
    replace: jest.fn(),
    remove: jest.fn(),
    setActiveForLockScreen: jest.fn(),
    addListener: jest.fn(
      (event: string, callback: (...args: any[]) => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
        return {
          remove: () => {
            listeners[event] = (listeners[event] || []).filter(
              (cb) => cb !== callback,
            );
          },
        };
      },
    ),
  };
}

export const setAudioModeAsync = jest.fn().mockResolvedValue(undefined);
