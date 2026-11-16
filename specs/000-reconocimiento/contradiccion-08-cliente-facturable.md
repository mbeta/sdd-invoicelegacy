# C08 · A qué cliente se le puede facturar

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** «cliente dado de baja» significa cosas distintas según el camino. El formulario de factura no lo ofrece y el panel no lo cuenta como activo. Sin embargo, el alta de facturas lo acepta si se le envía, y la remesa le sigue facturando sus contratos todos los meses.

## 1. Implementaciones

| | A · Formulario de nueva factura | B · Grabación del alta | C · Remesa mensual | D · Panel |
| --- | --- | --- | --- | --- |
| Código | `routes/facturas.js:31`: `WHERE activo = 1`; `views/factura_nueva.ejs:7` | `routes/facturas.js:46`: `SELECT * FROM clientes WHERE id = ?`, sin mirar `activo` | `scripts/remesa_mensual.js:26-29`: une `clientes` pero solo filtra por las fechas del **contrato** | `server.js:25`: «Clientes activos», `WHERE activo = 1` |
| ¿Admite un cliente de baja? | No | **Sí** | **Sí** | No lo cuenta |
| Camino | Facturas → Nueva factura | `POST /facturas/nueva` | Remesa del día 1 | Inicio |

La baja de un cliente (`routes/clientes.js:32-37`) solo pone `activo = 0`. No toca sus contratos, que siguen sin `fecha_baja`.

Los artículos siguen el mismo patrón: el desplegable solo lista los activos (`routes/facturas.js:33`), pero la línea de factura es texto libre y no se comprueba contra el catálogo.

## 2. Comparación paso a paso

| Paso | A | B | C | ¿Igual? |
| --- | --- | --- | --- | --- |
| Cliente existe | Sí | Sí (`400` si no existe, `:47`) | Sí (por el `JOIN`) | Igual |
| Cliente activo | Se exige | No se mira | No se mira | **Distinto** |
| Contrato vigente | — | — | Se exige (rango de fechas, ver C10) | Solo C |

## 3. Ejemplos con resultados distintos (E3 y E4, código real)

Sobre la copia se dio de baja al cliente 6, Bar Nuevo Siglo (`POST /clientes/6/baja`):

| Paso | Resultado |
| --- | --- |
| Formulario de nueva factura | «Bar Nuevo Siglo» ya no aparece (0 coincidencias en la página) |
| `POST /facturas/nueva` con `cliente_id=6` | `302` a `/facturas/11`: se grabó **FA-2026-000109** a su nombre |
| Remesa `2026-11` | **FA-2026-000113**, «Alquiler máquina de café Futurmat F3 (noviembre 2026)», 108,90 € |
| Remesa `2026-12` | **FA-2026-000117**, mismo concepto, 108,90 € |

Consulta tras E4: `SELECT f.numero, c.activo FROM facturas f JOIN clientes c ON c.id = f.cliente_id WHERE f.id > 12` → las facturas del cliente 6 salen con `activo = 0`.

## 4. Cuándo divergen y cuándo coinciden

**Coinciden** mientras todos los clientes estén activos. Hoy lo están los 6 (`SELECT id, activo FROM clientes`).

**Divergen:**

- Cuando se da de baja a un cliente que tiene un contrato sin `fecha_baja`: la remesa le sigue facturando todos los meses.
- Cuando alguien envía el alta de factura directamente, por ejemplo desde un formulario abierto antes de la baja o con la URL (R9).

**Por qué nadie lo ha detectado:** no consta ninguna baja de cliente en los datos. Además, dar de baja el cliente y dar de baja su contrato son dos acciones en dos pantallas, y ninguna avisa de la otra.

## 5. Historia probable

1. El esquema prevé la baja lógica de clientes desde 2018 o antes (`db.js:29`, `activo INTEGER DEFAULT 1`). El listado del formulario y el panel la respetan.
2. El alta de facturas confía en el formulario: el filtro está en la consulta que lo rellena (`:31`), no en la que graba (`:46`). Es el mismo patrón que la validación «fuerte» delegada en Marga (`routes/clientes.js:16`; memoria H31).
3. En 2021 la remesa de Roberto (memoria H20) se centró en la vigencia del **contrato**. Lo más probable es que diera por hecho que un cliente de baja tendría sus contratos de baja (**SUPOSICIÓN**).

## 6. Para el registro y la entrevista

- **Registro:** R9 ya recoge que el alta acepta un cliente de baja por petición directa. Se propone una entrada **nueva** para la remesa. **Riesgo**: la remesa factura los contratos de clientes dados de baja. Impacto: Alto (facturas numeradas que no se pueden borrar y obligan a rectificar). Probabilidad: Media (basta con dar de baja un cliente con contrato y olvidar el contrato). No se propone ninguna corrección.
- **Preguntas:**
  - **C08-1 (Marga):** cuando un cliente se da de baja, ¿se dan de baja también sus contratos? ¿Quién lo hace y cuándo?
  - **C08-2 (Marga, Paco):** ¿hay casos en que se deba seguir facturando a un cliente «de baja», por ejemplo un contrato que sigue vivo hasta su fin?
