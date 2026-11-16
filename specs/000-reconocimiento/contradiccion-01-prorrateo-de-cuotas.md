# C01 · Prorrateo de una cuota de contrato en un mes parcial

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** el importe de un mes que no se sirve entero (alta o baja a mitad de mes) se calcula de dos formas. La pantalla de baja divide la cuota entre 30. La remesa la divide entre los días reales del mes. Solo coinciden en los meses de 30 días.

## 1. Implementaciones

| | A · Pantalla de baja de contratos | B · Remesa mensual |
| --- | --- | --- |
| Código | `calcularProrrateo` en `services/calculo.js:90-102` | Fórmula escrita dentro del script: `scripts/remesa_mensual.js:43-51`, con los límites del mes de `:20-21` y `util.diasDelMes` (`lib/util.js:35-39`) |
| Quién la llama | `routes/contratos.js:31-43`; en concreto, `:38-40` | Solo el propio script. Es el único usuario de `diasDelMes` (búsqueda de `diasDelMes` en el proyecto) |
| Camino del sistema | Botón «baja» de `views/contratos.ejs:11-12` → `POST /contratos/:id/baja` | `node scripts/remesa_mensual.js AAAA-MM`, que Marga lanza el día 1 (`scripts/remesa_mensual.js:5-7`; `views/index.ejs:9-10`) |
| Qué periodos cubre | Solo bajas: del día 1 al día de la baja (`routes/contratos.js:37-39`) | Altas y bajas: de `max(alta, día 1)` a `min(baja, último día)` (`:45-46`) |
| Qué hace con el importe | Nada en la BD: lo pone en la URL (`?prorrateo=45.00`, `:40`). Administración emite después «a mano» la factura (`:28-30`; `views/contratos.ejs:17`) | Lo graba como precio de una línea de cantidad 1, que pasa por `calcularFactura` (`:54-55`) y se factura en el acto (`:61-68`) |
| Lo que dice el comentario | «Se prorratea "a lo comercial": el mes son siempre 30 días… Así lo hacía Paco a mano en el Access y así lo espera la gestoría» (`services/calculo.js:90-93`) | «si el alta o la baja caen dentro del mes se prorratea por los días reales del mes» (`scripts/remesa_mensual.js:43-44`) |

## 2. Comparación paso a paso

| Paso | A · Baja (`calcularProrrateo`) | B · Remesa | ¿Igual? |
| --- | --- | --- | --- |
| Día inicial | Siempre el día 1 del mes de la baja (`routes/contratos.js:38`) | El mayor entre el alta y el día 1 (`:45`) | Igual en las bajas. A no se aplica a las altas |
| Día final | La fecha de baja | El menor entre la baja y el último día del mes (`:46`) | Igual en las bajas |
| Días de servicio | `d2 - d1 + 1` (`services/calculo.js:96-98`) | `d2 - d1 + 1` (`:48-50`) | **Igual**, incluso en el nombre de las variables |
| Tope de días | Más de 30 → 30; menos de 0 → 0 (`:99-100`) | Ninguno | **Distinto**: B puede dar importes negativos (R21) |
| Divisor | 30 fijo (`:101`) | Días reales del mes: 28, 29, 30 o 31 (`:47`) | **Distinto** |
| Fórmula | `redondear2(cuota / 30 * dias)` | `redondear2(cuota / diasMes * diasServicio)` | Misma forma y mismo orden de operaciones |
| Redondeo | `redondear2` al céntimo | `redondear2` al céntimo | Igual |
| Mes completo | 30 → cuota; 31 → cuota (el día 31 no se cobra, `:99`); febrero → 28/30 de la cuota | Siempre la cuota entera | **Distinto en febrero** |
| Después | Se muestra con `toFixed(2)` (C05) | Se le aplican IVA, recargo y, por encima de 1.000 €, descuento (R25) | Distinto destino |

## 3. Ejemplos con resultados distintos

### 3.1 Con contratos reales

Consulta: `SELECT * FROM contratos` → contratos 1 (90 €, alta 2024-03-01), 2 (145 €, alta 2023-01-15), 3 (60 €, alta 2025-06-16, baja 2025-09-15) y 4 (90 €, alta 2026-02-15).

| Caso real | B · Remesa real (E1) | A · 30 días | Diferencia |
| --- | --- | --- | --- |
| Contrato 4, Bar Nuevo Siglo, alta 15/02/2026 | **45,00** € («Alquiler máquina de café Futurmat F3 (14 dias)») | **42,00** € (`calcularProrrateo(90,'2026-02-15','2026-02-28')`) | 3,00 € de base; 3,63 € con IVA |
| Contrato 3, lavavasos, alta 16/06/2025 | 30,00 € («(15 dias)») | 30,00 € | 0 |
| Contrato 3, lavavasos, baja 15/09/2025 | 30,00 € («(15 dias)») | 30,00 € (lo que habría mostrado la pantalla de baja) | 0 |

El caso del contrato 4 es una **comparación de convenios**: en el código actual ninguna pantalla calcula las altas con 30 días. Sirve para cuantificar lo que dice el comentario de `services/calculo.js:91-93` frente a lo que hace la remesa.

**Dato llamativo:** en la BD no hay ninguna factura de febrero de 2026 para el cliente 6 (`SELECT numero, fecha FROM facturas WHERE cliente_id = 6` → solo `FA-2026-000106`, `RE-2026-000001` y `FA-2026-000107`, de abril y mayo). No se sabe cómo se facturó, si se facturó, ese primer medio mes.

### 3.2 Bajas con la cuota real de 90 € (E2, E3, E4)

| Fecha de baja | B · Remesa | A · Pantalla de baja | Diferencia (B − A) |
| --- | --- | --- | --- |
| 14/02/2026 | 45,00 | 42,00 | +3,00 |
| 28/02/2026 (febrero entero) | 90,00 | 84,00 | **+6,00** |
| 15/01/2026 | 43,55 | 45,00 | −1,45 |
| 20/03/2026 | 58,06 | 60,00 | −1,94 |
| 30/03/2026 | 87,10 | 90,00 | −2,90 |
| 31/03/2026 | 90,00 | 90,00 | 0 |
| 15/04/2026 | 45,00 | 45,00 | 0 |
| 15/12/2026 (ejecutado de verdad en E3 y E4) | 43,55 (`FA-2026-000115`, «(15 dias)») | 45,00 (redirección a `/contratos?prorrateo=45.00`) | −1,45 |

### 3.3 Cuantificación sobre todo 2026 (E2)

| Cuota (real) | Días de baja posibles | Difieren | B > A | A > B | Diferencia máxima | Diferencia media cuando difieren |
| --- | --- | --- | --- | --- | --- | --- |
| 90 € (contratos 1 y 4) | 365 | **238 (65 %)** | 28 (todos en febrero) | 210 | 6,00 € (28/02) | 1,69 € |
| 145 € (contrato 2) | 365 | 238 | 28 | 210 | 9,67 € (28/02) | 2,72 € |
| 60 € (contrato 3) | 365 | 238 | 28 | 210 | 4,00 € (28/02) | 1,13 € |

- La diferencia máxima es 2/30 de la cuota (6,67 %): el febrero completo.
- En los meses de 31 días, la pantalla de baja cobra **más** que la remesa todos los días salvo el 31.
- En febrero, la pantalla de baja cobra **menos** que la remesa todos los días.

### 3.4 Efecto combinado: el mes de la baja se puede cobrar dos veces

La remesa del mes de la baja **también** factura ese contrato, porque lo incluye mientras `fecha_baja >= primerDia` (`scripts/remesa_mensual.js:26-29`). Si administración emite además la factura manual con el importe de la pantalla (`routes/contratos.js:28-30`), el cliente paga los mismos días dos veces y con dos importes distintos. En E3 y E4, el contrato 1 con baja el 15/12/2026 dio 43,55 € en la remesa más 45,00 € en la pantalla, es decir, 88,55 € por 15 días. Que esto ocurra en la práctica es una **SUPOSICIÓN** (pregunta P5 de `reglas-de-negocio.md`).

## 4. Cuándo divergen y cuándo coinciden

**Coinciden:**

- Cualquier día de un mes de 30 días: abril, junio, septiembre y noviembre (E2: 0 diferencias en esos meses).
- Las bajas el día 31: las dos dan la cuota entera.
- Los meses completos sin alta ni baja: solo interviene la remesa.

**Divergen:**

- Los días 1 a 30 de los meses de 31 días (30 de 31 días en enero, marzo, mayo, julio, agosto, octubre y diciembre).
- Todos los días de febrero.

**Por qué nadie lo ha detectado:**

- El único contrato real con alta y baja (contrato 3) empezó y acabó en meses de 30 días (junio y septiembre de 2025): ahí las dos fórmulas dan lo mismo.
- El importe de la pantalla de baja **no se guarda en ningún sitio**, solo aparece en la barra de direcciones (`routes/contratos.js:40`). Ningún informe puede compararlo con la remesa.
- La pantalla nunca calcula altas, así que el alta de febrero del contrato 4 no tenía con qué compararse.
- Las diferencias son de uno a tres euros por contrato y mes, salvo en febrero.

## 5. Historia probable

1. **Antes de 2017**, Paco prorrateaba a mano en el Access con meses de 30 días, y «así lo espera la gestoría» (`services/calculo.js:90-93`; memoria H3). `lib/util.js:1-2` avisa de que algunas funciones «vienen del gesfact 1.x en Access». Que `calcularProrrateo` sea una de ellas es una **SUPOSICIÓN**.
2. **Alguna vez entre 2017 y 2021** (sin fecha; el historial de git empieza el 2026-11-16) se añadió la baja de contratos, que usa `calcularProrrateo` para el importe de la factura manual (`routes/contratos.js:28-30`; memoria H30).
3. **En verano de 2021**, Roberto (becario) escribió la remesa (`scripts/remesa_mensual.js:6-7`; memoria H20). El script importa `services/calculo` (`:11`) y usa `calcularFactura` (`:55`), pero **no** `calcularProrrateo`. Escribe su propia fórmula con `util.diasDelMes`, del que es el único usuario.
4. **Indicios de copia.** Las dos implementaciones usan los mismos nombres (`d1`, `d2`) y la misma expresión `d2 - d1 + 1` (`services/calculo.js:96-98` frente a `scripts/remesa_mensual.js:48-50`). Parece que una se escribió a partir de la otra, cambiando el divisor y quitando los topes. El sentido de la copia no se puede saber.
5. **¿Elección o desconocimiento?** El comentario de la remesa enuncia los «días reales» como criterio (`:43-44`), pero no menciona el convenio comercial ni a la gestoría. No consta si fue una decisión de negocio o una elección del becario: **SUPOSICIÓN** en ambos sentidos.

## 6. Para el registro y la entrevista

- **Registro:** ya existe como **R11** (Rareza, impacto Medio, probabilidad Alta), y el doble cobro del mes de baja como **R13**. Se propone añadir a R11 la cuantificación de §3.3 y el caso real del contrato 4. No se propone ninguna corrección.
- **Preguntas** (amplían P4 y P5 de `reglas-de-negocio.md`):
  - **C01-1 (Paco, Puri):** cuando un contrato empieza o termina a mitad de mes, ¿qué se ha pactado con el cliente y qué espera la gestoría: cuota/30 por día o cuota/días del mes? ¿Debe un febrero completo cobrar la cuota entera?
  - **C01-2 (Marga):** ¿cómo se facturó el alta de Bar Nuevo Siglo del 15/02/2026? En la BD no hay factura de febrero para ese cliente.
  - **C01-3 (Marga):** al dar de baja un contrato a mitad de mes, ¿se emite la factura manual **además** de la que genera la remesa de ese mes? ¿Con qué importe?
  - **C01-4 (Roberto, si se le localiza; si no, Julián):** ¿por qué la remesa no usa `calcularProrrateo`? ¿Fue una decisión de negocio?
