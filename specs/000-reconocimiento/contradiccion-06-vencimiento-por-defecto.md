# C06 · Días de vencimiento por defecto

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** cuando el cliente no tiene días de pago, el alta manual vence según `config.VENCIMIENTO_DIAS` y la remesa a los 30 días que lleva escritos en el código. Hoy los dos valen 30. En cuanto alguien cambie `config.js`, divergen sin aviso.

## 1. Implementaciones

| | A · Alta manual | B · Remesa mensual | C · Rectificativa |
| --- | --- | --- | --- |
| Código | `routes/facturas.js:68-69`: `cliente.dias_pago \|\| config.VENCIMIENTO_DIAS`, y luego `util.sumarDias` | `scripts/remesa_mensual.js:60`: `co.dias_pago \|\| 30`, y luego `util.sumarDias` | `routes/facturas.js:142`: vencimiento `null` |
| Origen del valor por defecto | `config.js:39-40` («días de vencimiento por defecto si el cliente no tiene forma de pago»), hoy 30 | El literal `30`. El script ni siquiera importa `config` (`scripts/remesa_mensual.js:9-12`) | No aplica |
| Camino | `POST /facturas/nueva` | `node scripts/remesa_mensual.js AAAA-MM` | `POST /facturas/:id/rectificar` |

## 2. Comparación paso a paso

| Paso | A · Alta | B · Remesa | ¿Igual? |
| --- | --- | --- | --- |
| Días del cliente | `clientes.dias_pago` | `clientes.dias_pago` (unido en `:26`) | Igual |
| Cliente sin días (`NULL`) | `config.VENCIMIENTO_DIAS` | 30 | **Igual hoy; distinto si cambia `config.js`** |
| Cliente con 0 días | `0 \|\| …` → valor por defecto (A12) | `0 \|\| 30` → 30 | Igual hoy |
| Suma de días | `util.sumarDias` | `util.sumarDias` | Igual (mismo efecto de zona horaria, R23) |
| Fecha de partida | La fecha de la factura | El último día del mes facturado | Distinta por diseño (C03) |

## 3. Ejemplos con resultados distintos (E5, código real)

Cliente 1, Cafetería La Parada (`dias_pago` nulo), con factura fechada el 31/10/2026 por los dos caminos y zona horaria de Madrid:

| `VENCIMIENTO_DIAS` en `config.js` | A · Alta | B · Remesa `2026-10` | Diferencia |
| --- | --- | --- | --- |
| 30 (valor actual) | 30/11/2026 | 30/11/2026 | 0 |
| 45 (cambiado solo en la copia) | **15/12/2026** | **30/11/2026** | **15 días** |

Con `dias_pago = 60` (cliente 3, Restaurante Casa Ubaldo), la remesa dio 30/12/2026 en las dos pasadas: el valor por defecto no interviene.

**Datos reales:** 4 de los 6 clientes no tienen días de pago (`SELECT id, dias_pago FROM clientes` → nulo en 1, 2, 4 y 6; 60 en 3 y 5). Todos los vencimientos grabados son la fecha más 30 o más 60 días. Por ejemplo, `FA-2026-000101`: 31/01 → 02/03; `FA-2026-000103`: 20/02 → 21/04 (`SELECT numero, fecha, vencimiento FROM facturas`). Con los datos reales no hay divergencia.

## 4. Cuándo divergen y cuándo coinciden

**Coinciden** mientras `config.VENCIMIENTO_DIAS` valga 30, o cuando el cliente tiene días de pago distintos de 0.

**Divergen** si `config.js` tiene otro valor. Eso puede estar pasando ya sin que se vea en este repositorio:

- `config.js` «se copia a mano al servidor de la oficina» (`config.js:2-3`; memoria H28). El valor real en producción puede no ser 30. Es una **SUPOSICIÓN**, en ningún sentido comprobada.
- La remesa se lanza «desde el ordenador de Marga» (`scripts/remesa_mensual.js:7`). Aunque esa copia tuviese otro `config.js`, la remesa lo ignoraría.

**Por qué nadie lo ha detectado:** el valor nunca ha cambiado en este repositorio, y con 30 días los dos caminos dan lo mismo.

## 5. Historia probable

1. Julián centralizó la constante en `config.js`, junto al IVA por defecto y otros parámetros de empresa (`config.js:24-25,39-40`).
2. En 2021 Roberto escribió la remesa (memoria H20) importando `db`, `util`, `calculo` y `numeracion`, pero no `config` (`scripts/remesa_mensual.js:9-12`). Puso el 30 a mano. Lo más probable es que fuera una copia del valor visible y no una regla distinta (**SUPOSICIÓN**). El script tampoco usa ningún otro parámetro de `config.js`.

## 6. Para el registro y la entrevista

- **Registro:** figura como «vencimiento por defecto distinto» en mapa A5 y en RN-36, pero **no** en `registro-riesgos.md`. Se propone como **Riesgo**: una divergencia latente que se activa al cambiar `config.js`. Impacto: Medio (vencimientos distintos para un mismo cliente según el camino). Probabilidad: Baja. No se propone ninguna corrección.
- **Preguntas:**
  - **C06-1 (Julián):** ¿qué valor tiene `VENCIMIENTO_DIAS` en el `config.js` del servidor de la oficina (`\\SERVIDOR\gesfact`) y en el del ordenador de Marga?
  - **C06-2 (Marga):** si un día se pacta otro plazo por defecto, ¿debe aplicarse también a las cuotas de la remesa?
