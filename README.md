# LX Music+ sources

Source addons for [LX Music+](https://github.com/dlvkz/lx-music-plus) (desktop and Android).

LX Music+ shows songs from YouTube, SoundCloud, Bandcamp and KHInsider (search, artists, albums, charts), but it
does not include the code that plays their audio. That code lives here as addons. You install them yourself,
the same way Nuclear plugins or LX Music custom sources work.

| Addon | Plays | Link to install |
| --- | --- | --- |
| [YouTube](addons/youtube.js) | YouTube (with the yt-dlp of the app) | `https://raw.githubusercontent.com/dlvkz/lx-music-plus-sources/main/addons/youtube.js` |
| [SoundCloud](addons/soundcloud.js) | SoundCloud | `https://raw.githubusercontent.com/dlvkz/lx-music-plus-sources/main/addons/soundcloud.js` |
| [Bandcamp](addons/bandcamp.js) | Bandcamp (the free 128 kbps streams) | `https://raw.githubusercontent.com/dlvkz/lx-music-plus-sources/main/addons/bandcamp.js` |
| [KHInsider](addons/khinsider.js) | KHInsider (video game music) | `https://raw.githubusercontent.com/dlvkz/lx-music-plus-sources/main/addons/khinsider.js` |
| [GD Studio](addons/gdstudio.js) | NetEase, as a backup when the Music API can't play a song (GD Studio's public API, a third-party service) | `https://raw.githubusercontent.com/dlvkz/lx-music-plus-sources/main/addons/gdstudio.js` |

## Install

Open **Settings → Sources** in LX Music+. The **Source store** lists everything in [registry.json](registry.json):
press **Install** and confirm. For anything else, paste a link to a script or choose a `.js` file under
**Add from a link or file**. Addons installed from a link can be updated from the same page.

Sources run with the same rights as the app. Only install sources you trust.

If GitHub is blocked where you are, the app downloads scripts and the store list through mirrors instead
(jsDelivr, ghproxy.net, gh.llkk.cc, gh-proxy.org and others), whichever answers first.

### Third-party Music APIs in the store

The store also links to Music API scripts (custom sources of LX Music) for NetEase, QQ Music, Kugou, Kuwo and
Migu. **They are not made, hosted or checked by this project.** The store only points to where their authors or
other collections publish them:

| Name | Author | Script link from |
| --- | --- | --- |
| Huibq_lxmusic源 | Huibq | [Huibq/keep-alive](https://github.com/Huibq/keep-alive) |
| 六音音源 | 六音 | [pdone/lx-music-source](https://github.com/pdone/lx-music-source) |
| ikun音源 | ikunshare | [pdone/lx-music-source](https://github.com/pdone/lx-music-source) |
| 独家音源 | w | [pdone/lx-music-source](https://github.com/pdone/lx-music-source) |
| 野花🌷 | unknown | [pdone/lx-music-source](https://github.com/pdone/lx-music-source) |
| 野草🌾 | unknown | [pdone/lx-music-source](https://github.com/pdone/lx-music-source) |

If you made one of these scripts and want it removed from the store, open an issue.

### Adding to the store

Add an entry to `sources` in [registry.json](registry.json):

| Field | |
| --- | --- |
| `id` | unique id (for an addon: the `@id` of its script) |
| `name` | for a Music API: exactly the `@name` of its script (the app uses it to show it as installed) |
| `kind` | `addon` or `api` |
| `author` | |
| `version` | addons: the `@version` of the script (a different one shows **Update**) |
| `plays` | addons: the sources they play (`yt`, `sc`, `bc`, `kh`; `wy`, `tx`, `kg`, `kw`, `mg` for a backup of the Music API) |
| `description`, `descriptionZh` | English and Chinese |
| `url` | the script (https) |
| `homepage` | where it comes from |
| `default` | Music APIs, optional: `true` on the one used after installing when none is in use (else the first of the list) |

## Writing an addon

An addon is one JavaScript file: a comment with its details, then `module.exports`.

```js
/**
 * @name My source
 * @id my-source
 * @version 1.0.0
 * @author you
 * @description What it plays
 * @homepage https://github.com/you/your-addon
 */

module.exports = {
  // the sources it plays: yt, sc, bc, kh, or the ones of the Music API (wy, tx, kg, kw, mg): a backup,
  // used when the Music API can't play a song (setting "Use backup addons")
  sources: ['sc'],
  // returns a Promise of { url, hls, ext }
  resolve: function(track, api) {
    return api.getJson('https://example.com/stream/' + track.id).then(function(data) {
      return { url: data.url, hls: false, ext: 'mp3' }
    })
  },
}
```

`track` describes the song to play:

| Field | |
| --- | --- |
| `source` | `yt`, `sc`, `bc` or `kh` |
| `id` | its id on the source (YouTube video id, SoundCloud track id, KHInsider page path) |
| `url` | the page of the song on the source (Bandcamp, KHInsider), can be empty |
| `name`, `singer`, `albumName`, `interval` | as shown in the app |
| `quality` | the quality wanted (`128k`, `320k`, `flac`...), for the backups of the Music API |

`api` gives the addon what the app can do:

| Function | |
| --- | --- |
| `request(url, { method, headers, body })` | Promise of `{ status, body }`, whatever the status |
| `getText(url, options)` / `getJson(url, options)` | the body, fails when the status is not 2xx |
| `ytdlp(url, options)` | runs the yt-dlp bundled with the app, Promise of what it prints |
| `decodeHtml(text)` | decodes HTML entities |
| `log(...args)` | writes to the log of the app |
| `apiVersion` | `1` |

The result:

- `url`: the audio
- `hls: true`: `url` is an HLS playlist of mp3 parts, which the app joins into one file
- `ext`: the file type (`mp3`, `m4a`, ...)
- `quality` (optional, backups of the Music API): the quality of the link (`128k`, `320k`, `flac`...)

When several enabled addons play the same source, the app uses them in the order they were installed. If one
fails, the app tries the next.

Write addons in plain ES2015 with Promise chains, without `async` / `await` or classes. The Android app runs
addons with Hermes, which doesn't support those in code loaded at runtime.

### Test

```bash
node test/run.js addons/soundcloud.js sc <track id>
node test/run.js addons/bandcamp.js bc - <song page url>
```

The YouTube addon needs `yt-dlp` on the PATH.

## Disclaimer

The addons in this repository only read what the sources make public through their own web players. They don't
download, store or share any music. The third-party Music APIs listed in the store are links to other people's
work: this project doesn't host them and isn't responsible for them. Respect the terms of the sources and the law where you live, and please support the
artists.

## License

[MIT](LICENSE), for the addons and files of this repository (not the third-party scripts it links to).
