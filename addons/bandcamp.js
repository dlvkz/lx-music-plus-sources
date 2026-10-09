/**
 * @name Bandcamp
 * @id bandcamp
 * @version 1.0.0
 * @author dlvkz
 * @description Plays the free 128 kbps streams of the Bandcamp song pages.
 * @homepage https://github.com/dlvkz/lx-music-plus-sources
 */

module.exports = {
  sources: ['bc'],
  resolve: function(track, api) {
    if (!track.url) return Promise.reject(new Error('Bandcamp: no song page'))
    return api.getText(track.url).then(function(page) {
      var raw = /data-tralbum="([^"]+)"/.exec(page)
      if (!raw) throw new Error('Bandcamp: track data not found')
      var data = JSON.parse(api.decodeHtml(raw[1]))
      var file = data.trackinfo && data.trackinfo[0] && data.trackinfo[0].file
      var url = file && file['mp3-128']
      if (!url) throw new Error('Bandcamp: track not streamable')
      if (url.indexOf('//') == 0) url = 'https:' + url
      return { url: url, hls: false, ext: 'mp3' }
    })
  },
}
