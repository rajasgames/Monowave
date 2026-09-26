import StreamExtractorModule from "./src/StreamExtractorModule";
import { NativeStreamResult } from "./src/StreamExtractor.types";

export * from "./src/StreamExtractor.types";

export async function resolveAudio(
  videoId: string,
): Promise<NativeStreamResult> {
  if (!StreamExtractorModule) {
    return {
      ok: false,
      reason: "unsupported",
      message: "Android extractor is missing. Build a development client.",
    };
  }
  try {
    return await StreamExtractorModule.resolve(videoId);
  } catch (error) {
    return {
      ok: false,
      reason: "unknown",
      message: String(error),
    };
  }
}
