/* Tiny template runtime for the design previews. */
(function () {
  var FOR = /<sc-for\s+list="\{\{\s*([\w.$]+)\s*\}\}"\s+as="(\w+)"[^>]*>([\s\S]*?)<\/sc-for>/g;
  var IF = /<sc-if\s+value="\{\{\s*([\w.$]+)\s*\}\}"[^>]*>([\s\S]*?)<\/sc-if>/g;

  function get(scope, path) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, scope);
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function render(tpl, scope, handlers) {
    tpl = tpl.replace(FOR, function (m, list, as, inner) {
      var arr = get(scope, list) || [];
      return arr.map(function (item, i) {
        var s = Object.assign({}, scope);
        s[as] = item;
        s.$index = i;
        return render(inner, s, handlers);
      }).join('');
    });
    tpl = tpl.replace(IF, function (m, cond, inner) {
      return get(scope, cond) ? render(inner, scope, handlers) : '';
    });
    tpl = tpl.replace(/onClick="\{\{\s*([\w.$]+)\s*\}\}"/g, function (m, p) {
      handlers.push(get(scope, p));
      return 'data-h="' + (handlers.length - 1) + '"';
    });
    return tpl.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, function (m, p) { return esc(get(scope, p)); });
  }


  function DCLogic() { this.props = {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) { Object.assign(this.state, patch); this._render(); };
  DCLogic.prototype.forceUpdate = function () { this._render(); };

  function mountDC(Component) {
    var c = new Component();
    var root = document.getElementById('root');
    var tpl = document.getElementById('tpl').textContent;
    c._render = function () {
      var active = document.activeElement && document.activeElement.getAttribute('data-h');
      var handlers = [];
      root.innerHTML = render(tpl, c.renderVals(), handlers);
      root.querySelectorAll('[data-h]').forEach(function (el) {
        el.addEventListener('click', function (e) { var f = handlers[+el.getAttribute('data-h')]; if (f) f(e); });
      });
      root.querySelectorAll('form').forEach(function (f) {
        f.addEventListener('submit', function (e) { e.preventDefault(); });
      });
      if (active != null) { var again = root.querySelector('[data-h="' + active + '"]'); if (again) again.focus(); }
    };
    c._render();
  }

  var api = { DCLogic: DCLogic, mountDC: mountDC, render: render };
  if (typeof window !== 'undefined') { window.DCLogic = DCLogic; window.mountDC = mountDC; }
  if (typeof module !== 'undefined') { module.exports = api; }
})();
