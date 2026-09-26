package com.monowave.extractor

import org.schabi.newpipe.extractor.downloader.Downloader
import org.schabi.newpipe.extractor.downloader.Request
import org.schabi.newpipe.extractor.downloader.Response
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.GZIPInputStream

internal class HttpDownloader : Downloader() {
  companion object {
    const val AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  }

  override fun execute(request: Request): Response {
    val connection = URL(request.url()).openConnection() as HttpURLConnection
    try {
      connection.requestMethod = request.httpMethod()
      connection.connectTimeout = 12000
      connection.readTimeout = 18000
      connection.instanceFollowRedirects = true
      connection.setRequestProperty("User-Agent", AGENT)
      request.headers().forEach { (key, values) ->
        if (values.isNotEmpty()) connection.setRequestProperty(key, values.joinToString(", "))
      }
      request.dataToSend()?.let { payload ->
        connection.doOutput = true
        connection.outputStream.use { it.write(payload) }
      }
      val status = connection.responseCode
      val input = if (status >= 400) connection.errorStream else connection.inputStream
      val body = input?.use { stream ->
        val decoded = if (connection.contentEncoding.equals("gzip", ignoreCase = true)) GZIPInputStream(stream) else stream
        decoded.use { it.readBytes().take(4 * 1024 * 1024).toByteArray().toString(Charsets.UTF_8) }
      } ?: ""
      val headers = connection.headerFields.filterKeys { it != null }.mapKeys { it.key!! }
      return Response(status, connection.responseMessage ?: "", headers, body, connection.url.toString())
    } finally {
      connection.disconnect()
    }
  }
}
