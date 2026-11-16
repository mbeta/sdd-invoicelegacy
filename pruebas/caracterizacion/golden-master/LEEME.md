# Golden master del ciclo de vida de una factura

## Qué es

`master.json` es una **foto completa** de lo que hace hoy GesFact en su flujo central de negocio: el ciclo de vida de una factura descrito en [`flujo-factura.md`](../../../specs/000-reconocimiento/flujo-factura.md). Cubre el alta manual (camino 1), el cobro y la rectificación (camino 3).

Se genera ejecutando **12 casos fijos** (`casos.js`, de GM-01 a GM-12) contra el **servidor real** (`server.js`, sin modificar). El servidor trabaja sobre una **copia temporal** de `datos/gesfact.db`, con zona horaria `Europe/Madrid` y el reloj fijado en `2026-11-16T10:00:00+01:00`. La BD de producción no se abre nunca.

Entre todos, los casos recorren las reglas y anomalías principales. Cada caso dice qué ejercita en su campo `ejercita`:

| Caso | Qué fija |
| --- | --- |
| GM-01 | Redondeo línea a línea con IVA mixto; vencimiento que cruza febrero |
| GM-02 | Recargo de equivalencia; tipos antiguos (16, 7) y fuera de tabla (5 → recargo 0) |
| GM-03 / GM-04 | Frontera del descuento: 1.000,00 sin descuento; 1.000,01 con 2 % y anotación con espacio inicial |
| GM-05 / GM-06 | Falta de monotonía: 183 aceites cuestan menos que 182 |
| GM-07 | Coma flotante (81,585 → 81,58) y línea negativa asimétrica (−19,42) |
| GM-08 | Entrada del formulario («1.234,56» → 1,234; «1,5»; fila vacía; fecha vacía → hoy); cliente de baja |
| GM-09 | Error al grabar → 500 y número consumido (hueco) |
| GM-10 | Cliente con 0 días de pago → 30; fecha no ISO que pierde un día en octubre |
| GM-11 | Cobro y rectificación de GM-01: espejo sin recalcular, fecha de hoy, pierde la marca de cobro |
| GM-12 | Rectificación de la histórica descuadrada `FA-2026-000105`; segundo intento rechazado |

Por cada caso, el master guarda:

- las respuestas HTTP (estado, `Location` y texto de error);
- todas las facturas creadas o modificadas, con **todas sus columnas** y sus líneas;
- los contadores de numeración.

El formato es estable:

- JSON con las claves ordenadas alfabéticamente y 2 espacios de sangría.
- Los números se escriben con todos los dígitos necesarios para recuperar el valor exacto.
- Las líneas de cada factura van ordenadas por descripción. El orden en que GesFact las graba **no es estable** entre ejecuciones (anomalía A-46), así que no se puede fijar.

`golden-master.test.js` regenera la salida con el código actual y la compara campo a campo con el master. Si algo cambia, el fallo dice el caso, la factura y el campo exactos. Por ejemplo:

```text
GM-04 › facturas[0] (FA-2026-000112).iva: esperado 205.81, obtenido 205.8
```

## Cuándo DEBE regenerarse

**Solo cuando el negocio haya decidido por escrito cambiar un comportamiento** que el master recoge, y ese cambio se haya hecho a propósito. La constitución lo exige (principio I: «NO se introduce ningún cambio de comportamiento observable […] sin una decisión explícita y por escrito del negocio»).

- Si el test falla y **no hay** una decisión escrita que lo explique, el código ha cambiado el comportamiento sin permiso. Lo que se corrige es el **código**, no el master.
- Si el test falla porque alguien ha modificado `datos/gesfact.db`, lo detecta el primer test, que compara el SHA-1 de la BD de partida. La BD de producción no se toca (principio I).
- Tampoco se regenera para «arreglar» un caso que parezca un error: congelar no es aprobar. Las anomalías se corrigen en la fase de modernización, con su decisión escrita.
- Añadir, quitar o modificar un caso de `casos.js` también cambia el master. Requiere la misma justificación por escrito.

## Cómo se regenera

1. Ten a mano la referencia de la decisión escrita: quién, cuándo y dónde consta.
2. Comprueba qué ha cambiado:

   ```bash
   node --test pruebas/caracterizacion/golden-master.test.js
   ```

   Revisa que **todas** las diferencias, y solo ellas, son las que la decisión autoriza.
3. Regenera indicando la decisión. Sin `--decision`, el script no escribe nada:

   ```bash
   node pruebas/caracterizacion/golden-master/regenerar.js --decision "DN-AAAA-NNN: <qué se decidió>, <quién>, <fecha>"
   ```

   La referencia queda grabada en `master.json`, en el campo `regeneracion`.
4. Revisa el diff de `master.json` en git antes de confirmar. Debe contener solo los cambios autorizados y la nueva `regeneracion`.
5. Confirma el master junto con el cambio de código y la decisión, en el mismo commit.

Para comprobar sin escribir nada:

```bash
node pruebas/caracterizacion/golden-master/regenerar.js --comprobar
```

## Generación actual

- **Fecha:** 2026-11-16.
- **Motivo:** generación inicial de la red de caracterización. Congela el comportamiento existente, sin ninguna decisión de cambio.
- **BD de partida:** `datos/gesfact.db` con SHA-1 `0535fde925d01cc39e5307ef6c1044f8d722a7b6`.
- **Revisión:** todas las cifras del master se han contrastado con los ejemplos de [`reglas-de-negocio.md`](../../../specs/000-reconocimiento/reglas-de-negocio.md). Por ejemplo, GM-04 reproduce la tabla de RN-09, GM-05 y GM-06 la de RN-12, y GM-10 el ejemplo de RN-19.
