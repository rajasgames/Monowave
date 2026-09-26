import { isRequestCanceled, mapSearchError } from "../../../src/core/errors";

describe("Search Request Handling & Error Mapping", () => {
  describe("isRequestCanceled", () => {
    it("recognizes AbortError by error name", () => {
      const abortError = new Error("The user aborted a request.");
      abortError.name = "AbortError";
      expect(isRequestCanceled(abortError)).toBe(true);
    });

    it("recognizes signal.aborted even if error name is generic or missing", () => {
      const signal = { aborted: true } as AbortSignal;
      const genericError = new Error("fetch failed");
      expect(isRequestCanceled(genericError, signal)).toBe(true);
    });

    it("recognizes React Native 'Fetch request has been canceled' message", () => {
      const rnError = new Error("Fetch request has been canceled");
      expect(isRequestCanceled(rnError)).toBe(true);
    });

    it("returns false for legitimate network/timeout errors when not aborted", () => {
      const netError = new Error("Network request failed");
      const signal = { aborted: false } as AbortSignal;
      expect(isRequestCanceled(netError, signal)).toBe(false);
    });
  });

  describe("mapSearchError", () => {
    it("maps offline and network failures to concise user-friendly message", () => {
      const result = mapSearchError(new Error("Network request failed"));
      expect(result.message).toBe(
        "You’re offline. Check your connection and try again.",
      );
      expect(result.retryable).toBe(true);
    });

    it("maps connection refused / DNS resolution errors to offline message", () => {
      const result = mapSearchError(
        new Error("getaddrinfo ENOTFOUND music.youtube.com"),
      );
      expect(result.message).toBe(
        "You’re offline. Check your connection and try again.",
      );
    });

    it("maps timeout failures to concise timeout message", () => {
      const result = mapSearchError(
        new Error("Request timed out after 13000ms"),
      );
      expect(result.message).toBe(
        "Search is taking longer than expected. Try again.",
      );
      expect(result.retryable).toBe(true);
    });

    it("maps YouTube Music HTTP errors to provider failure message", () => {
      const result = mapSearchError(
        new Error("YouTube Music returned HTTP 503"),
      );
      expect(result.message).toBe("YouTube Music is temporarily unavailable.");
      expect(result.retryable).toBe(true);
    });

    it("never returns raw technical error text", () => {
      const rawTechnical = new Error(
        "Search failed: TypeError: Cannot read property 'map' of undefined",
      );
      const result = mapSearchError(rawTechnical);
      expect(result.message).not.toContain("TypeError");
      expect(result.message).not.toContain("Cannot read property");
      expect(result.message).toBe("YouTube Music is temporarily unavailable.");
    });
  });

  describe("Search Sequence Controller Simulation", () => {
    it("ensures the latest query wins when responses finish out of order", async () => {
      let activeRequestId = 0;
      let stateResults: string[] = [];
      let stateError = "";

      const performSearch = (
        query: string,
        delayMs: number,
        resultData: string[],
      ) => {
        const reqId = ++activeRequestId;
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            // Only latest request can update state
            if (reqId === activeRequestId) {
              stateResults = resultData;
              stateError = "";
            }
            resolve();
          }, delayMs);
        });
      };

      // Query 1 starts first with slow 100ms response
      const p1 = performSearch("radiohead", 100, ["Creep", "Karma Police"]);
      // Query 2 starts later with fast 20ms response
      const p2 = performSearch("m83", 20, ["Midnight City"]);

      await Promise.all([p1, p2]);

      // Query 2 ("m83") must win even though Query 1 finished later
      expect(stateResults).toEqual(["Midnight City"]);
      expect(stateError).toBe("");
    });

    it("preserves previous results when a recoverable search fails", async () => {
      const stateResults = ["Existing Result 1", "Existing Result 2"];
      let stateError = "";

      const onSearchFailure = (error: unknown) => {
        const mapped = mapSearchError(error);
        stateError = mapped.message;
        // Notice stateResults is preserved, not emptied
      };

      onSearchFailure(new Error("Network failed"));

      expect(stateResults).toEqual(["Existing Result 1", "Existing Result 2"]);
      expect(stateError).toBe(
        "You’re offline. Check your connection and try again.",
      );
    });
  });
});
