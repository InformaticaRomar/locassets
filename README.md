# LocAssets (GLPI 11)

LocAssets adds an additional asset selector **“My assets (by location)”** to the GLPI 11 ticket form.  
It filters assets by the **ticket location** and **asset type**.

The plugin **does not replace or hide** any native GLPI UI.  
It injects an extra block and lets GLPI keep full control of the **Add** action.

## Features

- New block: **My assets (by location)**
- Filters:
  - Ticket location (`locations_id`)
  - Asset type (Computer, Printer, etc.)
  - Text search
- Select2 with AJAX (GLPI 11 compatible)

### Asset selection behavior

- **Does NOT auto-add** the asset.
- Fills the native **“Or complete search”** fields:
  - `dropdown_itemtype{RAND}`
  - `dropdown_add_items_id{RAND}`
- The user clicks the native **+ Add** button.

## UI injection (non-intrusive)

The plugin is injected in **two places**, without breaking native HTML.

### 1) Elements tab

Inside:

- `div[id^="tab-Item_Ticket_"]`
- `div.d-flex.w-100.flex-column`

Placed **between**:

1. `#tracking_my_devices` (native)
2. **My assets (by location)** (plugin)
3. `#tracking_all_devices*` (native “Or complete search”)

### 2) Ticket tab

The block coexists with:

- Description
- Comments
- Ticket fields

Nothing is hidden or replaced.

## Backend endpoint

The selector loads data from:

`/plugins/locassets/ajax/items_by_location.php`

Expected Select2 response:

```json
{
  "results": [
    {
      "id": "Computer:123",
      "text": "PC-01",
      "itemtype": "Computer",
      "items_id": 123
    }
  ],
  "pagination": { "more": false }
}
