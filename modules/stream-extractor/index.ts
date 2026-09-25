import { NativeModule, requireOptionalNativeModule } from 'expo-modules-core';

type Result =
  | { ok: true; url: string; userAgent: string; title?: string; duration?: number }
  | { ok: false; message: string };

declare class Extractor extends NativeModule<{}> {
  resolve(videoId: string): Promise<Result>;
}
const native = requireOptionalNativeModule<Extractor>('MonowaveExtractor');

export async function resolveAudio(videoId: string): Promise<Result> {
  if (!native) return { ok: false, message: 'Android extractor is missing. Build a development client.' };
  try { return await native.resolve(videoId); }
  catch (error) { return { ok: false, message: String(error) }; }
}
