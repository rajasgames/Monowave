import { requestJson } from "../../../core/http";
import { YouTubeContext } from "./types";

const YTM_BASE_URL = "https://music.youtube.com/youtubei/v1";

export const DEFAULT_YTM_CONTEXT: YouTubeContext = {
  client: {
    clientName: "WEB_REMIX",
    clientVersion: "1.20240101.01.00",
    hl: "en",
    gl: "US",
  },
};

export class YouTubeClient {
  private readonly baseUrl: string;
  private readonly context: YouTubeContext;

  constructor(baseUrl = YTM_BASE_URL, context = DEFAULT_YTM_CONTEXT) {
    this.baseUrl = baseUrl;
    this.context = context;
  }

  async post<T = unknown>(
    endpoint: string,
    payload: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}?prettyPrint=false`;
    return requestJson<T>(url, {
      method: "POST",
      headers: {
        Origin: "https://music.youtube.com",
      },
      body: {
        context: this.context,
        ...payload,
      },
      signal,
    });
  }
}

export const defaultYouTubeClient = new YouTubeClient();
