/* ============================================================
   程烁 · 技术作品集  全站共享脚本
   1. 滚动入场动画 (IntersectionObserver)
   2. 终端打字机效果 (首页 hero / AI 区)
   3. 代码窗语法高亮 (详情页, 轻量正则着色)
   ============================================================ */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 滚动入场 ---------- */
  function initReveal(){
    var els = document.querySelectorAll('.reveal');
    if(reduce){
      els.forEach(function(e){ e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
      });
    },{threshold:.16});
    els.forEach(function(e){ io.observe(e); });
  }

  /* ---------- 2. 终端打字机 ---------- */
  function typeTerm(elId, lines){
    var el = document.getElementById(elId);
    if(!el) return;
    function render(l){
      return '<div class="term-line">'
        + (l.cmd ? '<span class="p">$ </span>' + l.cmd : '')
        + (l.html || '')
        + '</div>';
    }
    if(reduce){
      lines.forEach(function(l){ el.insertAdjacentHTML('beforeend', render(l)); });
      el.insertAdjacentHTML('beforeend','<span class="cursor"></span>');
      return;
    }
    var i = 0, j = 0, buf = '';
    function step(){
      if(i >= lines.length){
        el.insertAdjacentHTML('beforeend','<span class="cursor"></span>');
        return;
      }
      var L = lines[i];
      if(j <= (L.cmd ? L.cmd.length : 0)){
        var head = L.cmd ? '<span class="p">$ </span>' + L.cmd.slice(0, j) : '';
        el.innerHTML = buf + '<div class="term-line">' + head + '</div><span class="cursor"></span>';
        j++;
        setTimeout(step, 24);
      }else{
        buf += render(L);
        el.innerHTML = buf + '<span class="cursor"></span>';
        i++; j = 0;
        setTimeout(step, 300);
      }
    }
    step();
  }

  /* ---------- 3. 代码高亮 (轻量, 展示用) ---------- */
  var KW = new Set(('import from def return if else elif for in not and or class lambda with as '
    + 'try except raise while break continue True False None global nonlocal yield pass assert').split(' '));
  var TOKEN_RE = /(#[^\n]*)|('[^']*'|"[^"]*")|(\b\d[\d_]*(?:\.\d+)?\b)/g;

  function esc(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function tokenize(line){
    var out = '', last = 0, m;
    TOKEN_RE.lastIndex = 0;
    while((m = TOKEN_RE.exec(line))){
      out += esc(line.slice(last, m.index));
      if(m[1] !== undefined){               // 注释(整行或行尾, 到行末)
        var com = esc(m[1]);
        com = com.replace(/\[(逆向要点\d*|要点)\]/g,'<span class="ann">[$1]</span>');
        out += '<span class="tok-com">' + com + '</span>';
        last = line.length;
        break;
      }else if(m[2] !== undefined){         // 字符串
        out += '<span class="tok-str">' + esc(m[2]) + '</span>';
      }else{                                // 数字
        out += '<span class="tok-num">' + esc(m[3]) + '</span>';
      }
      last = m.index + m[0].length;
    }
    out += esc(line.slice(last));
    // 关键字着色(在已转义文本上做, 仅匹配独立单词)
    out = out.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, function(w){
      return KW.has(w) ? '<span class="tok-kw">' + w + '</span>' : w;
    });
    // 函数名: 匹配已包裹的 def, 给函数名单独着色
    out = out.replace(/(<span class="tok-kw">def<\/span>)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      '$1 <span class="tok-fn">$2</span>');
    return out;
  }
  function initCode(){
    document.querySelectorAll('pre.codewin-body').forEach(function(pre){
      var text = pre.textContent.replace(/^\n+|\s+$/g,'');
      var lines = text.split('\n');
      pre.innerHTML = '';
      lines.forEach(function(ln, idx){
        var div = document.createElement('div');
        div.className = 'cline';
        div.innerHTML = '<span class="ln">' + (idx+1) + '</span><span class="ct">' + tokenize(ln) + '</span>';
        pre.appendChild(div);
      });
    });
  }

  /* ---------- 4. 联系弹窗 (点"联系我"弹出号码) ---------- */
  var CONTACT = {
    phone: '18975560804',
    email: '18975560804@163.com'
  };

  function copyText(t){
    if(navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(t);
    }
    // 兜底: file:// 等无剪贴板权限的环境
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function initContact(){
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML =
      '<div class="modal-back"></div>'
      + '<div class="modal-card glass">'
      +   '<button class="modal-close" aria-label="关闭">✕</button>'
      +   '<div class="modal-title">联系我</div>'
      +   '<div class="modal-phone">' + CONTACT.phone + '</div>'
      +   '<div class="modal-mail">' + CONTACT.email + '</div>'
      +   '<div class="modal-actions">'
      +     '<button class="cta" data-copy>复制电话</button>'
      +     '<a class="cta ghost" href="tel:' + CONTACT.phone + '">拨打电话</a>'
      +     '<a class="cta ghost" href="mailto:' + CONTACT.email + '">发邮件</a>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(modal);

    var open = function(){
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      var c = modal.querySelector('.modal-close');
      if(c) c.focus();
    };
    var close = function(){
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    modal.querySelector('.modal-back').addEventListener('click', close);
    modal.querySelector('.modal-close').addEventListener('click', close);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    var copyBtn = modal.querySelector('[data-copy]');
    copyBtn.addEventListener('click', function(){
      copyText(CONTACT.phone).then(function(){
        copyBtn.textContent = '已复制';
        setTimeout(function(){ copyBtn.textContent = '复制电话'; }, 1600);
      });
    });

    // 全站所有"联系我"按钮(带 mailto 的 cta)统一改为弹窗
    document.querySelectorAll('a.cta[href^="mailto:"]').forEach(function(a){
      if(a.closest('.modal')) return;
      a.addEventListener('click', function(e){ e.preventDefault(); open(); });
    });
  }

  initReveal();
  initCode();
  initContact();
  window.__typeTerm = typeTerm;   // 首页通过内联调用
})();
