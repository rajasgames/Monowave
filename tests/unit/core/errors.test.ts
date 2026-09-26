import {
  createAppError,
  isAppError,
  mapNativeFailureToAppError,
} from "../../../src/core/errors";

describe("AppError taxonomy", () => {
  it("creates structured error with correct defaults", () => {
    const error = createAppError("network", "Connection lost");
    expect(error.kind).toBe("network");
    expect(error.userMessage).toBe("Connection lost");
    expect(error.retryable).toBe(false);
    expect(error.technicalMessage).toBeUndefined();
    expect(isAppError(error)).toBe(true);
  });

  it("recognizes non-AppError objects in isAppError guard", () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError("error")).toBe(false);
    expect(isAppError({ message: "plain error" })).toBe(false);
  });

  it("maps native failure reasons to domain error taxonomy", () => {
    const geo = mapNativeFailureToAppError(
      "geo_restricted",
      "Restricted in DE",
    );
    expect(geo.kind).toBe("region_restricted");
    expect(geo.retryable).toBe(false);

    const net = mapNativeFailureToAppError(
      "network",
      "Socket timeout",
      "SocketTimeoutException",
    );
    expect(net.kind).toBe("network");
    expect(net.retryable).toBe(true);
    expect(net.cause).toBe("SocketTimeoutException");

    const live = mapNativeFailureToAppError(
      "live_stream",
      "Live stream active",
    );
    expect(live.kind).toBe("track_unavailable");
    expect(live.retryable).toBe(false);

    const extraction = mapNativeFailureToAppError(
      "extraction_failed",
      "Extractor failed",
    );
    expect(extraction.kind).toBe("source_unavailable");
    expect(extraction.retryable).toBe(true);
  });
});
