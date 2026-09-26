import { NativeModule, requireOptionalNativeModule } from "expo-modules-core";
import { NativeStreamResult } from "./StreamExtractor.types";

declare class MonowaveExtractorModule extends NativeModule {
  resolve(videoId: string): Promise<NativeStreamResult>;
}

export default requireOptionalNativeModule<MonowaveExtractorModule>(
  "MonowaveExtractor",
);
