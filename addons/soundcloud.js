/**
 * @name SoundCloud
 * @id soundcloud
 * @version 1.0.0
 * @author dlvkz
 * @description Plays SoundCloud songs through the public SoundCloud web player.
 * @homepage https://github.com/dlvkz/lx-music-plus-sources
 */

var SC_API = 'https://api-v2.soundcloud.com'
var clientId = null

// The key of the SoundCloud web player, found in its scripts
function getClientId(api, refresh) {
  if (clientId && !refresh) return Promise.resolve(clientId)
  return api.getText('https://soundcloud.com').then(function(page) {
    var scripts = (page.match(/https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js/g) || []).reverse()
    var next = function(index) {
      if (index >= scripts.length) throw new Error('SoundCloud client id not found')
      return api.getText(scripts[index]).catch(function() { return '' }).then(function(script) {
        var id = /[{,]client_id:"(\w+)"/.exec(script)
        if (id) return (clientId = id[1])
        return next(index + 1)
      })
    }
    return next(0)
  })
}

function getTrack(api, id, refresh) {
  return getClientId(api, refresh).then(function(key) {
    return api.request(SC_API + '/tracks/' + encodeURIComponent(id) + '?client_id=' + key)
  }).then(function(res) {
    // the key changes from time to time
    if ((res.status == 401 || res.status == 403) && !refresh) return getTrack(api, id, true)
    if (res.status < 200 || res.status >= 300) throw new Error('SoundCloud request failed: ' + res.status)
    return JSON.parse(res.body)
  })
}

module.exports = {
  sources: ['sc'],
  resolve: function(track, api) {
    return getTrack(api, track.id, false).then(function(info) {
      var transcodings = (info.media && info.media.transcodings) || []
      var progressive = transcodings.filter(function(t) { return t.format.protocol == 'progressive' && t.format.mime_type.indexOf('audio/mpeg') == 0 })[0]
      var hls = transcodings.filter(function(t) { return t.format.protocol == 'hls' && t.format.mime_type == 'audio/mpeg' })[0]
      var target = progressive || hls
      if (!target) throw new Error('SoundCloud: no playable stream')
      var query = 'client_id=' + clientId + (info.track_authorization ? '&track_authorization=' + encodeURIComponent(info.track_authorization) : '')
      return api.getJson(target.url + (target.url.indexOf('?') < 0 ? '?' : '&') + query).then(function(data) {
        // a HLS playlist of mp3 parts: the app joins them into one file
        return { url: data.url, hls: target == hls, ext: 'mp3' }
      })
    })
  },
}
