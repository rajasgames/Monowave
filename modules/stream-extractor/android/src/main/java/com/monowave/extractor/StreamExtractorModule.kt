package com.monowave.extractor

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.localization.ContentCountry
import org.schabi.newpipe.extractor.localization.Localization
import org.schabi.newpipe.extractor.stream.DeliveryMethod
import org.schabi.newpipe.extractor.stream.StreamInfo

class StreamExtractorModule : Module() {
  private companion object {
    @Volatile var started = false
    val lock = Any()
  }

  override fun definition() = ModuleDefinition {
    Name("MonowaveExtractor")
    AsyncFunction("resolve") { videoId: String -> resolve(videoId) }
  }

  private fun resolve(videoId: String): Map<String, Any?> {
    if (!Regex("^[A-Za-z0-9_-]{11}$").matches(videoId)) {
      return mapOf("ok" to false, "message" to "Invalid video ID")
    }
    return try {
      synchronized(lock) {
        if (!started) {
          NewPipe.init(HttpDownloader(), Localization("en", "US"), ContentCountry("US"))
          started = true
        }
      }
      val info = StreamInfo.getInfo(ServiceList.YouTube, "https://www.youtube.com/watch?v=$videoId")
      val stream = info.audioStreams
        ?.filter { it.deliveryMethod == DeliveryMethod.PROGRESSIVE_HTTP && it.isUrl && !it.content.isNullOrBlank() }
        ?.maxByOrNull { it.averageBitrate }
        ?: return mapOf("ok" to false, "message" to "No supported audio stream is available")
      mapOf(
        "ok" to true,
        "url" to stream.content,
        "userAgent" to HttpDownloader.AGENT,
        "title" to info.name,
        "duration" to info.duration
      )
    } catch (error: Exception) {
      mapOf("ok" to false, "message" to (error.message ?: "Stream resolution failed"))
    }
  }
}
