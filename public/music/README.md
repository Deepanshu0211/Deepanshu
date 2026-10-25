# Your music

Drop songs here and they play from the record player in the study.

Name them in the order you want them to play:

    sound1.mp3
    sound2.mp3
    sound3.m4a
    …
    soundN.mp3

- Formats: `.mp3`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.wav`, `.flac` (mp3 or m4a work in every browser).
- Gaps are fine (`sound1`, `sound2`, `sound5`); they play in number order.
- In development (`npm run dev`) new files show up on the next page load. In production the list is
  built when you deploy, so redeploy after adding songs.
- The music is positional: it plays from the record player, gets louder as you walk up to it and
  fades as you walk away.

Anything in `public/` is publicly downloadable once deployed, so only put music here that you have
the right to share.
