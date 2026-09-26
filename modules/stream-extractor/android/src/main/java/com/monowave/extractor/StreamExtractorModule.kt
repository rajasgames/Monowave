package com.monowave.extractor

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.localization.ContentCountry
import org.schabi.newpipe.extractor.localization.Localization
import org.schabi.newpipe.extractor.stream.DeliveryMethod
import org.schabi.newpipe.extractor.stream.StreamInfo
import org.schabi.newpipe.extractor.stream.StreamType
import org.schabi.newpipe.extractor.exceptions.ExtractionException
import org.schabi.newpipe.extractor.exceptions.AgeRestrictedContentException
import org.schabi.newpipe.extractor.exceptions.PaidContentException
import org.schabi.newpipe.extractor.exceptions.GeographicRestrictionException

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
      return mapOf("ok" to false, "reason" to "invalid_id", "message" to "Invalid video ID")
    }
    return try {
      synchronized(lock) {
        if (!started) {
          NewPipe.init(StreamExtractorDownloader(), Localization("en", "US"), ContentCountry("US"))
          started = true
        }
      }
      val info = StreamInfo.getInfo(ServiceList.YouTube, "https://www.youtube.com/watch?v=$videoId")
      
      if (info.streamType == StreamType.LIVE_STREAM) {
         return mapOf("ok" to false, "reason" to "live_stream", "message" to "Live streams are not supported")
      }
      
      val stream = info.audioStreams
        ?.filter { it.deliveryMethod == DeliveryMethod.PROGRESSIVE_HTTP && it.isUrl && !it.content.isNullOrBlank() }
        ?.maxByOrNull { it.averageBitrate }
        ?: return mapOf("ok" to false, "reason" to "no_audio_stream", "message" to "No supported audio stream is available")
        
      mapOf(
        "ok" to true,
        "url" to stream.content,
        "userAgent" to StreamExtractorDownloader.AGENT,
        "mimeType" to stream.format?.mimeType,
        "bitrate" to stream.averageBitrate,
        "durationSeconds" to info.duration,
        "title" to info.name,
        "uploader" to info.uploaderName,
        "extractorVersion" to "0.26.5"
      )
    } catch (error: GeographicRestrictionException) {
      mapOf("ok" to false, "reason" to "geo_restricted", "message" to (error.message ?: "Geographic restriction"))
    } catch (error: AgeRestrictedContentException) {
      mapOf("ok" to false, "reason" to "age_restricted", "message" to (error.message ?: "Age restricted"))
    } catch (error: PaidContentException) {
      mapOf("ok" to false, "reason" to "paid_content", "message" to (error.message ?: "Paid content"))
    } catch (error: ExtractionException) {
      mapOf("ok" to false, "reason" to "extraction_failed", "message" to (error.message ?: "Extraction failed"), "exception" to error.javaClass.simpleName)
    } catch (error: Exception) {
      mapOf("ok" to false, "reason" to "unknown", "message" to (error.message ?: "Stream resolution failed"), "exception" to error.javaClass.simpleName)
    }
  }
}
