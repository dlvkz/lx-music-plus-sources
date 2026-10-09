/**
 * @name GD Studio
 * @id gdstudio
 * @version 1.0.0
 * @author dlvkz
 * @description Backup for the Music API: gets NetEase songs from GD Studio's public music API (a third-party service) when the Music API can't play them.
 * @homepage https://github.com/dlvkz/lx-music-plus-sources
 */

// GD Studio's public music API: the song is found by its id on its platform, the song id is sent to it.
// It is rate limited. It only serves NetEase now (October 2026: Kuwo, QQ Music, Kugou and Migu answer
// "source is not supported"); add a platform to `sources` and SOURCE_NAMES when it serves it again.
var API_URL = 'https://music-api.gdstudio.xyz/api.php'

var SOURCE_NAMES = { wy: 'netease' }
var QUALITY_BR = { '128k': 128, '192k': 192, '320k': 320, flac: 740, flac24bit: 999 }

function toQuality(br) {
  if (br >= 999) return 'flac24bit'
  if (br >= 740) return 'flac'
  if (br >= 320) return '320k'
  return '128k'
}

module.exports = {
  sources: ['wy'],
  resolve: function(track, api) {
    var source = SOURCE_NAMES[track.source]
    if (!source) return Promise.reject(new Error('GD Studio: unsupported source'))
    var br = QUALITY_BR[track.quality] || 320
    var url = API_URL + '?types=url&source=' + source + '&id=' + encodeURIComponent(track.id) + '&br=' + br
    return api.getJson(url).then(function(data) {
      var link = data && typeof data.url == 'string' ? data.url.replace(/\\/g, '') : ''
      if (!/^https?:\/\//.test(link)) throw new Error('GD Studio: no url')
      var ext = /\.(\w{2,4})(?:\?|$)/.exec(link)
      return { url: link, hls: false, ext: ext ? ext[1] : 'mp3', quality: toQuality(Number(data.br) || br) }
    })
  },
}
