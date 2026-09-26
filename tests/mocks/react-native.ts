export const PixelRatio = {
  get: () => 2,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (layoutSize: number) => layoutSize * 2,
  roundToNearestPixel: (layoutSize: number) => Math.round(layoutSize),
};

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  hairlineWidth: 1,
};

export const Platform = {
  OS: "android",
  select: (obj: any) => obj.android ?? obj.default,
};

export const useWindowDimensions = () => ({
  width: 390,
  height: 844,
  scale: 2,
  fontScale: 1,
});

export const View = "View";
export const Text = "Text";
export const Pressable = "Pressable";
export const Image = "Image";
export const TextInput = "TextInput";
export const ScrollView = "ScrollView";
export const FlatList = "FlatList";
export const Modal = "Modal";
export const ActivityIndicator = "ActivityIndicator";

export const Animated = {
  Value: class {
    value: number;
    constructor(val: number) {
      this.value = val;
    }
    setValue(val: number) {
      this.value = val;
    }
    interpolate(config: any) {
      return this;
    }
  },
  timing: () => ({
    start: (cb?: any) => cb && cb({ finished: true }),
    stop: () => {},
  }),
  spring: () => ({
    start: (cb?: any) => cb && cb({ finished: true }),
    stop: () => {},
  }),
  sequence: () => ({
    start: (cb?: any) => cb && cb({ finished: true }),
    stop: () => {},
  }),
  parallel: () => ({
    start: (cb?: any) => cb && cb({ finished: true }),
    stop: () => {},
  }),
  loop: (anim: any) => ({
    start: (cb?: any) => cb && cb({ finished: true }),
    stop: () => {},
  }),
  View: "Animated.View",
  Text: "Animated.Text",
  Image: "Animated.Image",
};

export const Easing = {
  linear: (t: any) => t,
  ease: (t: any) => t,
  inOut: (f: any) => f,
  out: (f: any) => f,
  in: (f: any) => f,
  bezier: () => (t: any) => t,
};
