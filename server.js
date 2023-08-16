const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'client.html');
  fs.readFile(htmlPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading HTML file.');
    } else {
      res.send(data);
    }
  });
});

app.get('/playlist', (req, res) => {
  let mp4Files = []
  fs.readdir('./', (err, files) => {
    if (err) {
      console.error('Error reading folder:', err);
      return;
    }
    mp4Files = files.filter(file => path.extname(file) === '.mp4' || path.extname(file) === '.mkv');
    res.send({listOfVideos: mp4Files})
    res.end()
  });
})

app.get('/subtitles', (req, res) => {
  res.send(fs.readFileSync(`./${req.query.name}.vtt`))
})

app.get('/video', (req, res) => {
  const videoPath = path.join(__dirname, req.query.name);
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, headers);
    file.pipe(res);
  } else {
    const headers = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, headers);
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

