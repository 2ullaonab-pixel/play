// videos.json 의 영상마다 v/<ID>/index.html 을 만든다.
// 카톡은 미리보기 카드의 제목을 페이지의 og:title 에서 읽으므로, 영상마다 제목이 든 페이지가 따로 있어야 한다.
// 쓰는 법: videos.json 에 { "id": "...", "name": "..." } 를 넣고 `node build.js`
const fs = require('fs');
const path = require('path');

const root = __dirname;
const BASE = 'https://2ullaonab-pixel.github.io/play/';
const template = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const videos = JSON.parse(fs.readFileSync(path.join(root, 'videos.json'), 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function swap(html, from, to) {
  if (!html.includes(from)) throw new Error('틀에서 찾지 못함: ' + from);
  return html.replace(from, to);
}

const scriptTag = template.match(/<script src="app\.js\?v=\d+"><\/script>/);
if (!scriptTag) throw new Error('틀에서 app.js 줄을 찾지 못함');

for (const v of videos) {
  if (!/^[A-Za-z0-9_-]{20,}$/.test(v.id)) throw new Error('드라이브 ID가 아님: ' + v.id);
  const name = esc(v.name);
  let html = template;
  html = swap(html, '<title>영상 보기</title>', `<title>${name}</title>`);
  html = swap(html, '<meta property="og:title" content="영상 보기">', `<meta property="og:title" content="${name}">\n<meta property="og:url" content="${BASE}v/${v.id}/">`);
  html = swap(html, '<h1>영상을 여는 중입니다</h1>', `<h1>${name}</h1>\n    <p>영상을 여는 중입니다.</p>`);
  html = swap(html, scriptTag[0], `<script>window.PLAY_ID = '${v.id}';</script>\n<script src="../../${scriptTag[0].slice(13)}`);
  const dir = path.join(root, 'v', v.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`${v.name}\t${BASE}v/${v.id}/`);
}
