// 카톡 안 브라우저에서 구글 드라이브 영상 링크를 바깥 브라우저(또는 드라이브 앱)로 넘긴다.
// 이 페이지는 drive.google.com/file/d/<ID>/preview 로만 보낸다. 다른 주소로는 보내지 않는다.
// /view 는 휴대폰에서 "동영상을 재생하는 중에 문제가 발생했습니다"로 막혀서(2026-11-18) /preview 로 바꿨다.

var BASE = 'https://2ullaonab-pixel.github.io/play/';

function fileIdFrom(text) {
  if (!text) return null;
  var s = String(text).trim();
  var m = s.match(/\/file\/d\/([A-Za-z0-9_-]{20,})/) ||
          s.match(/[?&]id=([A-Za-z0-9_-]{20,})/) ||
          s.match(/^([A-Za-z0-9_-]{20,})$/);
  return m ? m[1] : null;
}

function driveUrl(id) {
  return 'https://drive.google.com/file/d/' + id + '/preview';
}

function plan(ua, target) {
  var kakao = /KAKAOTALK/i.test(ua);
  var android = /Android/i.test(ua);
  if (!kakao) return [{ href: target, replace: true }];
  var steps = [{ href: 'kakaotalk://web/openExternal?url=' + encodeURIComponent(target) }];
  if (android) {
    steps.push({
      href: 'intent://' + target.replace(/^https?:\/\//, '') +
            '#Intent;scheme=https;action=android.intent.action.VIEW;' +
            'category=android.intent.category.BROWSABLE;end',
      delay: 1200
    });
  }
  return steps;
}

if (typeof module !== 'undefined') {
  module.exports = { fileIdFrom: fileIdFrom, driveUrl: driveUrl, plan: plan, BASE: BASE };
}

if (typeof document !== 'undefined') {
  (function () {
    var left = false;
    document.addEventListener('visibilitychange', function () { if (document.hidden) left = true; });
    window.addEventListener('pagehide', function () { left = true; });

    function run(steps) {
      steps.forEach(function (s) {
        var go = function () {
          if (s.delay && left) return;
          if (s.replace) location.replace(s.href); else location.href = s.href;
        };
        if (s.delay) setTimeout(go, s.delay); else go();
      });
    }

    function copy(text, button) {
      var done = function () {
        var old = button.textContent;
        button.textContent = '복사했습니다';
        setTimeout(function () { button.textContent = old; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else {
        fallbackCopy(text); done();
      }
    }

    function fallbackCopy(text) {
      var t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t);
    }

    // 영상별 페이지(v/<ID>/)는 window.PLAY_ID 로 ID를 넘긴다. 주소의 ?id= 도 그대로 받는다.
    var id = fileIdFrom(window.PLAY_ID || new URLSearchParams(location.search).get('id'));
    var $ = function (sel) { return document.querySelector(sel); };

    if (id) {
      var target = driveUrl(id);
      $('#open').hidden = false;
      $('#direct').value = target;
      $('#btn').addEventListener('click', function (e) { e.preventDefault(); left = false; run(plan(navigator.userAgent, target)); });
      $('#copy').addEventListener('click', function () { copy(target, this); });
      run(plan(navigator.userAgent, target));
    } else {
      $('#make').hidden = false;
      $('#gen').addEventListener('click', function () {
        var got = fileIdFrom($('#src').value);
        if (!got) {
          $('#msg').textContent = '드라이브 영상 링크가 아닌 것 같습니다. 드라이브에서 "링크 복사"한 주소를 붙여 넣어 주세요.';
          $('#result').hidden = true;
          return;
        }
        $('#msg').textContent = '';
        $('#out').value = BASE + '?id=' + got;
        $('#result').hidden = false;
      });
      $('#copyOut').addEventListener('click', function () { copy($('#out').value, this); });
    }
  })();
}
