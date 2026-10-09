/**
 * @name KHInsider
 * @id khinsider
 * @version 1.0.0
 * @author dlvkz
 * @description Plays video game soundtracks from the KHInsider song pages.
 * @homepage https://github.com/dlvkz/lx-music-plus-sources
 */

var KH_BASE = 'https://downloads.khinsider.com'

module.exports = {
  sources: ['kh'],
  resolve: function(track, api) {
    // the id of a song is the path of its page
    var page = track.url || KH_BASE + track.id
    return api.getText(page).then(function(html) {
      var audio = /<audio[^>]+src="([^"]+)"/.exec(html) || /href="(https:\/\/[^"]+\.mp3)"/.exec(html)
      if (!audio) throw new Error('KHInsider: audio not found')
      return { url: audio[1], hls: false, ext: 'mp3' }
    })
  },
}
