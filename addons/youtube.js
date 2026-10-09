/**
 * @name YouTube
 * @id youtube
 * @version 1.0.0
 * @author dlvkz
 * @description Plays the audio of YouTube videos with the yt-dlp of the app.
 * @homepage https://github.com/dlvkz/lx-music-plus-sources
 */

module.exports = {
  sources: ['yt'],
  resolve: function(track, api) {
    var url = 'https://www.youtube.com/watch?v=' + encodeURIComponent(track.id)
    return api.ytdlp(url, ['-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio', '--dump-json', '--no-playlist', '--no-warnings']).then(function(out) {
      var json = out.split('\n').filter(function(line) { return line.trim().indexOf('{') == 0 })[0]
      if (!json) throw new Error('YouTube: no stream')
      var info = JSON.parse(json)
      if (!info.url) throw new Error('YouTube: no stream url')
      return { url: info.url, hls: false, ext: info.ext || 'm4a' }
    })
  },
}
