(function () {
  // ==========================================================
  // i18n labels injected by GLPI (setup.php)
  // ==========================================================
  const LOCASSETS_LABEL =
    (window.locassets_i18n && window.locassets_i18n.label)
      ? window.locassets_i18n.label
      : 'My assets (by location)';
  /* ==========================================================
   * Helpers: ticket location
   * ========================================================== */

  function findLocationField() {
    return (
      document.querySelector('[id^="dropdown_locations_id"]') ||
      document.querySelector('[name="locations_id"]') ||
      document.querySelector('[name="ticket[locations_id]"]')
    );
  }
  let __lastLocassetsLocation = '';
  function getLocationId() {
    const el = findLocationField();
    const v = el ? (el.value || '').trim() : '';
    if (v && v !== '0') __lastLocassetsLocation = v;
    return v || __lastLocassetsLocation;
  }

  /* ==========================================================
   * Visibility based on location
   * ========================================================== */

  function showPanels(show) {
    const a = document.getElementById('locassets-section');
    const b = document.getElementById('locassets-section-items');
    if (a) a.style.display = show ? '' : 'none';
    if (b) b.style.display = show ? '' : 'none';
  }

  function clearSelections() {
    const a = $('#locassets_my_location_devices');
    if (a.length) a.val(null).trigger('change');

    const b = $('#locassets_my_location_devices_items');
    if (b.length) b.val(null).trigger('change');
  }

  function onLocationChanged() {
    const locId = getLocationId();
    if (!locId || locId === '0') {
      showPanels(false);
      clearSelections();
      return;
    }
    showPanels(true);
    clearSelections();
  }

  /* ==========================================================
   * Critical: choose the correct native "Full search" block
   * ==========================================================
   *
   * GLPI can have multiple "O búsqueda completa" blocks in DOM
   * with different rand values.
   *
   * We must fill the ONE that belongs to the same UI area
   * (same tab/container) where the plugin selector was used.
   */

  function parseRandFromId(id) {
    if (!id) return null;
    const m = String(id).match(/(\d+)$/);
    return m ? m[1] : null;
  }

  function getRandForPanel(panelEl) {
    if (!panelEl) return { rand: null, scope: null };

    // 1) If the panel is inside an itemAddFormXXXX, use that rand
    const itemAddForm = panelEl.closest('div[id^="itemAddForm"]');
    if (itemAddForm) {
      const m = itemAddForm.id.match(/^itemAddForm(\d+)$/);
      if (m) return { rand: m[1], scope: itemAddForm };
    }

    // 2) Otherwise, we are likely inside Elements tab container:
    // find the native "tracking_all_devices" block in the SAME column
    const col = panelEl.closest('div.d-flex.w-100.flex-column');
    if (col) {
      const trackingAll = col.querySelector('div[id^="tracking_all_devices"]');
      if (trackingAll) {
        const itemtypeSel = trackingAll.querySelector('select[id^="dropdown_itemtype"]');
        const rand = parseRandFromId(itemtypeSel ? itemtypeSel.id : null);
        if (rand) return { rand, scope: col };
      }
    }

    // Fallback: pick the first visible dropdown_itemtype
    const candidates = document.querySelectorAll('select[id^="dropdown_itemtype"]');
    for (const c of candidates) {
      if (c.offsetParent !== null) {
        const rand = parseRandFromId(c.id);
        if (rand) return { rand, scope: document.body };
      }
    }

    return { rand: null, scope: null };
  }

  function fillNativeFullSearch(panelEl, d) {
    // Determine which native "Full search" to fill, based on panel location
    const { rand } = getRandForPanel(panelEl);
    if (!rand) return;

    const itemtypeSel = document.getElementById('dropdown_itemtype' + rand);
    if (!itemtypeSel) return;

    // 1) Set native itemtype (this triggers GLPI ajax that creates dropdown_add_items_id{rand})
    $(itemtypeSel).val(d.itemtype).trigger('change');

    // 2) Wait until GLPI creates the item selector, then set selected item
    let tries = 0;
    const timer = setInterval(() => {
      tries++;

      const itemsSel = document.getElementById('dropdown_add_items_id' + rand);
      if (itemsSel) {
        // Ensure option exists and mark it selected
        const opt = new Option(d.text, String(d.items_id), true, true);
        itemsSel.appendChild(opt);

        // Trigger change so GLPI sees the selection
        $(itemsSel).val(String(d.items_id)).trigger('change');

        clearInterval(timer);
      }

      if (tries > 50) clearInterval(timer);
    }, 150);
  }

  /* ==========================================================
   * ORIGINAL panel (itemAddFormXXXX) – keep current behavior
   * ========================================================== */

  function ensureOriginalPanel() {
    let panel = document.getElementById('locassets-section');

    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'locassets-section';
      panel.className = 'input-group mb-1';
      panel.innerHTML = `
        <span class="input-group-text">${LOCASSETS_LABEL}</span>

        <select id="locassets_itemtype" class="form-select" style="max-width:220px">
          <option value="0">-----</option>
          <option value="Database">Base de datos</option>
          <option value="Computer">Computadora</option>
          <option value="NetworkEquipment">Dispositivo de red</option>
          <option value="Printer">Impresora</option>
          <option value="Monitor">Monitor</option>
          <option value="Peripheral">Periférico</option>
          <option value="Rack">Rack</option>
          <option value="Enclosure">Recinto</option>
          <option value="DCRoom">Sala de servidor</option>
          <option value="Software">Software</option>
          <option value="Phone">Teléfono</option>
        </select>

        <select id="locassets_my_location_devices" style="width:100%"></select>
      `;
    }

    const itemAddForm = document.querySelector('div[id^="itemAddForm"]');
    const trackingAll = itemAddForm
      ? itemAddForm.querySelector('div[id^="tracking_all_devices"]')
      : null;

    if (itemAddForm && trackingAll && panel.parentNode !== itemAddForm) {
      itemAddForm.insertBefore(panel, trackingAll);
    }
  }

  function initSelect2Original() {
    if (!window.$ || !$.fn || typeof $.fn.select2 !== 'function') return;

    const sel = $('#locassets_my_location_devices');
    if (!sel.length || sel.data('select2')) return;

    sel.select2({
      width: '100%',
      placeholder: 'Selecciona un activo…',
      allowClear: true,
      dropdownParent: $('#locassets-section'),
      ajax: {
        url: `${CFG_GLPI.root_doc}/plugins/locassets/ajax/items_by_location.php`,
        dataType: 'json',
        delay: 200,
        data: (p) => ({
          q: p.term || '',
          locations_id: getLocationId(),
          itemtype: $('#locassets_itemtype').val() || '0'
        }),
        processResults: (d) => ({ results: d.results || [] })
      }
    });

    sel.on('select2:select', (e) => {
      const d = e.params.data;
      fillNativeFullSearch(document.getElementById('locassets-section'), d);
    });
  }

  /* ==========================================================
   * CLONE panel (Elements tab)
   * ========================================================== */

  function directChildOf(root, node) {
    let cur = node;
    while (cur && cur.parentNode && cur.parentNode !== root) {
      cur = cur.parentNode;
    }
    return cur && cur.parentNode === root ? cur : null;
  }

  function ensureClonePanel() {
    if (document.getElementById('locassets-section-items')) return;

    const original = document.getElementById('locassets-section');
    if (!original) return;

    const tab = document.querySelector('div[id^="tab-Item_Ticket_"]');
    const col = tab ? tab.querySelector('div.d-flex.w-100.flex-column') : null;
    if (!col) return;

    const trackingAllDeep = col.querySelector('div[id^="tracking_all_devices"]');
    if (!trackingAllDeep) return;

    const beforeNode = directChildOf(col, trackingAllDeep);
    if (!beforeNode) return;

    const clone = original.cloneNode(true);
    clone.id = 'locassets-section-items';

    const typeSel = clone.querySelector('#locassets_itemtype');
    const devSel = clone.querySelector('#locassets_my_location_devices');
    if (!typeSel || !devSel) return;

    typeSel.id = 'locassets_itemtype_items';
    devSel.id = 'locassets_my_location_devices_items';

    // Clean select2 artifacts inside the clone
    devSel.classList.remove('select2-hidden-accessible');
    devSel.removeAttribute('data-select2-id');
    devSel.innerHTML = '';
    clone.querySelectorAll('.select2, .select2-container').forEach(n => n.remove());

    col.insertBefore(clone, beforeNode);
  }

  function initSelect2Clone() {
    if (!window.$ || !$.fn || typeof $.fn.select2 !== 'function') return;

    const sel = $('#locassets_my_location_devices_items');
    if (!sel.length || sel.data('select2')) return;

    sel.select2({
      width: '100%',
      placeholder: 'Selecciona un activo…',
      allowClear: true,
      dropdownParent: $('#locassets-section-items'),
      ajax: {
        url: `${CFG_GLPI.root_doc}/plugins/locassets/ajax/items_by_location.php`,
        dataType: 'json',
        delay: 200,
        data: (p) => ({
          q: p.term || '',
          locations_id: getLocationId(),
          itemtype: $('#locassets_itemtype_items').val() || '0'
        }),
        processResults: (d) => ({ results: d.results || [] })
      }
    });

    sel.on('select2:select', (e) => {
      const d = e.params.data;
      fillNativeFullSearch(document.getElementById('locassets-section-items'), d);
    });
  }

  /* ==========================================================
   * Observer: clone only (avoid loops/freezes)
   * ========================================================== */

  let busy = false;

  function injectCloneSafe() {
    if (busy) return;
    busy = true;
    try {
      ensureClonePanel();
      initSelect2Clone();
      onLocationChanged();
    } finally {
      busy = false;
    }
  }

  function observeElementsTab() {
    if (window.__locassetsObserver) return;
    window.__locassetsObserver = true;

    let timer = null;

    const obs = new MutationObserver((mutations) => {
      // Only act when Elements tab exists and clone is missing
      if (document.getElementById('locassets-section-items')) return;

      const tab = document.querySelector('div[id^="tab-Item_Ticket_"]');
      if (!tab) return;

      clearTimeout(timer);
      timer = setTimeout(injectCloneSafe, 250);
    });

    obs.observe(document.body, { childList: true, subtree: true });
  }

  /* ==========================================================
   * Boot
   * ========================================================== */

  function boot() {
    const locField = findLocationField();
    if (!locField) return false;

    ensureOriginalPanel();
    initSelect2Original();

    if (!locField.dataset.locassetsBound) {
      locField.dataset.locassetsBound = '1';
      locField.addEventListener('change', onLocationChanged);
      $(locField).on('select2:select select2:clear change', onLocationChanged);
    }

    injectCloneSafe();
    observeElementsTab();
    onLocationChanged();
    return true;
  }

  let tries = 0;
  const it = setInterval(() => {
    tries++;
    if (boot() || tries > 120) clearInterval(it);
  }, 250);

})();
