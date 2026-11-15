/* Homepage app library: search, status/platform/category chips, sort. Without JS every app stays visible. */
(function () {
  'use strict';
  var list = document.getElementById('lib-list');
  var controls = document.getElementById('lib-controls');
  if (!list || !controls) return;
  var entries = Array.prototype.slice.call(list.querySelectorAll('.app-entry'));
  var search = document.getElementById('lib-search');
  var sort = document.getElementById('lib-sort');
  var count = document.getElementById('lib-count');
  var empty = document.getElementById('lib-empty');
  var chips = Array.prototype.slice.call(controls.querySelectorAll('.lib-chip'));
  var state = { status: 'all', platform: '', category: '' };

  controls.hidden = false;

  function has(el, key, val) {
    return (' ' + (el.getAttribute('data-' + key) || '') + ' ').indexOf(' ' + val + ' ') !== -1;
  }

  function apply() {
    var q = (search.value || '').toLowerCase().trim();
    var shown = 0;
    entries.forEach(function (el) {
      var ok = (state.status === 'all' || el.getAttribute('data-status') === state.status) &&
        (!state.platform || has(el, 'platform', state.platform)) &&
        (!state.category || has(el, 'category', state.category)) &&
        (!q || (el.getAttribute('data-search') || '').toLowerCase().indexOf(q) !== -1);
      el.hidden = !ok;
      if (ok) shown++;
    });
    empty.hidden = shown !== 0;
    count.textContent = 'Showing ' + shown + ' of ' + entries.length + ' apps';
  }

  function order() {
    var byName = sort.value === 'az';
    entries.slice().sort(function (a, b) {
      return byName
        ? a.getAttribute('data-name').localeCompare(b.getAttribute('data-name'))
        : Number(a.getAttribute('data-order')) - Number(b.getAttribute('data-order'));
    }).forEach(function (el) { list.appendChild(el); });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var group = chip.getAttribute('data-group');
      var val = chip.getAttribute('data-value');
      var wasOn = chip.getAttribute('aria-pressed') === 'true';
      chips.forEach(function (c) {
        if (c.getAttribute('data-group') === group) c.setAttribute('aria-pressed', 'false');
      });
      if (group === 'status') {
        state.status = val;
        chip.setAttribute('aria-pressed', 'true');
      } else if (wasOn) {
        state[group] = '';
      } else {
        state[group] = val;
        chip.setAttribute('aria-pressed', 'true');
      }
      apply();
    });
  });

  function reset() {
    search.value = '';
    state = { status: 'all', platform: '', category: '' };
    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', c.getAttribute('data-group') === 'status' && c.getAttribute('data-value') === 'all' ? 'true' : 'false');
    });
    apply();
    search.focus();
  }

  search.addEventListener('input', apply);
  sort.addEventListener('change', order);
  document.getElementById('lib-reset').addEventListener('click', function (e) { e.preventDefault(); reset(); });
  apply();
})();
