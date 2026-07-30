# AgroPlano Gestión Demo User Guide

This guide explains the day-to-day workflow in the public AgroPlano portfolio
edition. The public demo opens in English and offers a persistent
**English / Español** selector in the header. This guide also preserves the
original Spanish labels where useful, so either interface can be followed.

> **Synthetic data only — not for operating a real farm.** The bundled farm,
> field geometry, herds, headcounts, dates and records are entirely fictional.
> They are designed to exercise the product safely and reproducibly, not to
> support real livestock, commercial, regulatory or veterinary decisions.

## 1. Before you start

1. Open **AgroPlano Gestión Demo**.
2. Confirm that the header says **DATOS FICTICIOS · NO USAR PARA OPERAR**
   (“synthetic data · do not use for operations”).
3. Identify the operating mode:
   - In the public live demo or local mode, edits remain in that browser or on
     that device. Export a JSON backup if you want to preserve or move them.
   - Optional shared mode works only after a dedicated Supabase deployment has
     been configured. It is disabled by default in the public edition.
4. If you are using a configured shared deployment, check the synchronization
   indicator:
   - **Todo sincronizado** (“fully synchronized”): you can work normally.
   - **Solo lectura** (“read-only”): you can inspect data but cannot save
     changes.
   - **Sin internet** or **cambio pendiente** (“offline” or “pending change”):
     do not close the application, sign out or switch farms until the change
     synchronizes or you download the local draft.
5. Before a major data-entry session, bulk test or JSON import, use
   **Más → Exportar JSON** to create a recoverable snapshot.

Synchronization is not a backup policy. Even in shared mode, define a regular
JSON export routine.

## 2. Understand the map

- Hover over a field (*lote*). A quick card appears near the pointer with its
  number, code, area, status, current herds, headcount, occupation days and the
  most relevant alert or upcoming event.
- Click or tap a field to open its full record.
- Use search to find a field number or code, herd, category, crop or note.
- Change the visual layer to color fields by occupation, livestock, crop,
  water, rest, quality or reported problems.
- Use `+`, `−` or the zoom slider, and drag the map to move around it.
- Select **Ajustar** (“fit”) if you lose sight of an area and want to show the
  complete map again.
- The quick card automatically repositions near the viewport edges and hides
  while you drag, scroll or zoom. It does not block map clicks or movement.
- With a keyboard, focus a field and press `Enter` or the space bar to open it;
  press `Escape` to close the quick card.

Color is a prioritization aid. The field record and the date being reviewed
remain the source of detailed information.

## 3. Record livestock movements from the map

Select a field in **Mapa** (“Map”). Five separate actions appear at the top of
the field record; each action exposes only the inputs it needs. You can also
review and complete movements from **Hacienda** (“Livestock”).

### Entry

1. Select **Ingresar rodeo** (“Add herd”).
2. Choose the livestock category and herd from the available lists.
3. Enter the headcount, effective date and an optional note.
4. Save.

An entry starts with an empty form and adds a new herd; it neither replaces nor
copies any herd already occupying the field. If the field was marked for
agriculture only, its status changes to **Mixto** (“Mixed”) so both uses remain
visible.

### Transfer

1. Select **Mover a otro lote** (“Move to another field”).
2. If more than one herd is present, choose exactly which herd to move.
3. Select the destination field and effective date.
4. Save.

The application closes the occupation period at the source and opens a new
period at the destination as one operation. It preserves the herd's previous
route.

### Remove from the farm

1. Select **Retirar del campo** (“Remove from farm”).
2. Choose the exact herd.
3. Enter the effective date and a required reason.
4. Review the warning and confirm.

This action removes the complete herd without a destination field. If the
reason is a commercial transaction, use **Venta realizada** instead.

### Completed sale

1. Select **Venta realizada** (“Completed sale”).
2. Choose the herd and the number of head sold.
3. Enter the date and, when available, the buyer, destination and DT-e
   transport-document reference.
4. Save.

The sale reduces the selected herd's inventory, closes its occupation if the
remaining headcount reaches zero, and records the operation in history. The
DT-e field is informational: AgroPlano does not issue or replace any official
transport, commercial or regulatory document.

### Mortality

1. Select **Mortandad** (“Mortality”).
2. Choose the herd and number of head.
3. Enter the date and cause. If the cause is not yet known, select or enter
   **Sin determinar** (“Undetermined”).
4. Save.

The reduction affects only the selected herd and retains the cause for analysis
and audit.

### Important validations

- When multiple herds share a field, always select the exact occupation period
  before transferring, removing or reducing inventory.
- An invalid date is rejected; AgroPlano does not silently replace it with the
  current date.
- If any step in a transfer or inventory reduction fails, the application
  restores the affected fields, occupations, herds and movement records rather
  than leaving inventory in a partially updated state.

### Alternative entry from Livestock

In **Hacienda → Registrar entrada, salida o traslado** (“Livestock → Record an
entry, exit or transfer”), you can also complete the general movement flows:

1. Choose the operation.
2. Select the relevant field.
3. Choose the category and herd from the lists.
4. Enter the headcount, effective date and an optional note.
5. Save.

Creating an event named **Venta** (“Sale”) only documents or plans a date. It
does not reduce inventory; use **Venta realizada** to change stock.

### Multiple herds in one field

Record each entry separately. The field shows all open occupations and the
combined headcount, while history retains the category, herd, quantity and date
for each group. Select the correct group whenever you transfer or remove one.

## 4. Correct a movement

1. Open **Historial** (“History”).
2. Find **Movimientos de hacienda** (“Livestock movements”).
3. Locate the latest related movement.
4. Select **Anular / volver atrás** (“Annul / roll back”).
5. Enter a clear reason and confirm.

Only an **Administrador** (“Administrator”) can annul a movement. AgroPlano
blocks rollback when a related later movement already depends on it. Annulment
does not delete the record: it retains the date, user and reason for audit.

## 5. Plan and review grazing

Open **Pastoreo** (“Grazing”).

1. Set **Desde** (“From”) and **Hasta** (“To”). You can review up to one year
   at a time.
2. Choose how to display the range:
   - **Ajustar al ancho** (“Fit to width”) compresses the complete range for an
     overview.
   - **Diario · desplazar** (“Daily · scroll”) keeps a fixed width per day and
     allows horizontal navigation.
3. Use the Gantt zoom controls to expand or compress the day scale.
4. Filter by herd, category, actual/planned status or event type.
5. Sort fields by number, code, activity or another available criterion.
6. Hover over an occupied cell to inspect the field, date, herd, category,
   headcount and duration.
7. If one cell contains multiple herds, open **Registros del plazo** (“Records
   in range”) and select the exact record.

Continuous bars represent occupation periods. Single-date events appear as
vertical markers and retain their reference color.

## 6. Read the indicators

In **Indicadores** (“Indicators”), first choose the date range, field and
category, then select **Actualizar** (“Refresh”).

Pay particular attention to:

- **Ocupaciones actuales más largas**: fields with the longest current
  occupation and no intervening rest day.
- **Días ocupados por lote**: intensity of field use within the selected
  period.
- **Tiempo de cada categoría en cada lote**: days, passes and head-days for
  each category in each field.
- **Descanso actual vs objetivo**: fields approaching their configured target
  rest period.
- **Plan versus registros reales**: planned activity compared with records
  entered through the configured current date.
- **Cabeza-días/ha registrados**: accumulated stocking pressure only where
  headcount coverage is sufficient for the calculation.
- **Recorrido por rodeo**: days, fields visited, records and head-days by herd.
- **Consistencia del inventario**: discrepancies across Livestock, open
  occupations, herd identities and recorded inventory reductions.
- **Registros a revisar**: missing headcount, herd or category values that
  reduce dashboard reliability.

An indicator does not make an operational decision by itself. Use it to frame
questions, inspect priority fields and then record the resulting observation.
In this public edition, all values and apparent anomalies belong to the
synthetic scenario.

## 7. Crops and the annual cycle

In **Cultivos** (“Crops”), you can enter the current crop, sowing date,
predecessor crop and next operation. In **Ciclo anual** (“Annual cycle”), you
can compare occupation, rest, livestock activity and agricultural activity by
field.

To change the available options, an Administrator opens
**Más → Categorías, rodeos y cultivos** (“More → Categories, herds and crops”).
Renaming updates related references; deactivating hides an option from new
entries without deleting its history.

## 8. Events and history

- **Eventos → Pendientes** (“Events → Pending”) groups overdue and upcoming
  work for operational planning.
- **Eventos → Todos** (“Events → All”) supports filters for date, field, type,
  herd, category, owner, status or text.
- **Eventos → Análisis** (“Events → Analysis”) summarizes activity by type,
  status, month and owner.
- **Historial** retains completed events, reported problems, field work and
  livestock movements.
- Distinguish **Planificado**, **Realizado** and **Anulado** (“Planned,”
  “Completed” and “Annulled”). Mark a task as completed when the work is done.
- Keep notes concise but verifiable: what happened, quantity, responsible
  person and any material observation.

A **Venta** event plans or documents a date; only **Venta realizada** changes
inventory. Similarly, an overdue event that remains open shows that its record
has not been confirmed. It does not prove that the work was not performed.

## 9. Backups and data exchange

- **Exportar JSON**: exports a complete copy for recovery or transfer.
- **Importar JSON**: replaces or loads a dataset; create a backup first.
- **CSV lotes**: exports the main field-level data for external analysis.
- **CSV historial**: exports event history for external analysis.
- **Plantilla CSV**: provides the expected example format for CSV imports.

JSON files may contain every record in the active workspace. Treat any export
from a real deployment as confidential operational data. The public repository
and bundled demo must remain synthetic.

Cloud synchronization does not replace backups. A configured shared deployment
still needs a defined export cadence, retention policy and recovery test.

## 10. Suggested daily routine

1. Confirm the synchronization state and the working date.
2. Record livestock movements first.
3. Record veterinary, production or agricultural events.
4. Review pending events and the longest current occupations.
5. Open Grazing to validate the actual route and plan.
6. Correct incomplete records surfaced by Indicators.
7. Export JSON at the frequency defined by the operating team.

This routine describes the intended interaction pattern. It is not veterinary,
agronomic, financial, regulatory or workplace-safety advice.

## Related documentation

- [Spanish user guide](GUIA_DE_USO.md)
- [Synthetic-data design](DATOS_FICTICIOS.md)
- [Privacy and public/private separation](PRIVACIDAD_Y_SEPARACION.md)
- [Optional Supabase shared mode](SUPABASE_OPCIONAL.md)
- [Installation and updates](INSTALACION_Y_ACTUALIZACION.md)
