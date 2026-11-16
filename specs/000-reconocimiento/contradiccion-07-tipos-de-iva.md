# C07 · Tipos de IVA admitidos y tipo por defecto

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** qué tipos de IVA existen y cuál se usa si no se indica ninguno está escrito en varios sitios. Las pantallas ofrecen 21, 10 y 4 %; la tabla de recargo conoce 7 tipos; el servidor acepta cualquier entero. Hay tres valores por defecto independientes: uno de `config.js`, un literal en una ruta y otro en el esquema.

## 1. Implementaciones

### 1.1 Qué tipos hay

| | Tipos | Código | Camino |
| --- | --- | --- | --- |
| Desplegable de la factura | 21, 10, 4 | `views/factura_nueva.ejs:18` | Nueva factura |
| Desplegable de artículos | 21, 10, 4 | `views/articulos.ejs:18` | Nuevo artículo |
| Comentario del esquema | «21 / 10 / 4» | `db.js:36` | — |
| Tabla de recargo | 21 → 5,2; 10 → 1,4; 4 → 0,5; 18 y 16 → 4; 8 y 7 → 1; **cualquier otro → 0** | `services/calculo.js:12-23` | Todo cálculo con recargo |
| Validación en el servidor | **Ninguna**: `parseInt` del valor recibido | `routes/facturas.js:61`, `routes/articulos.js:16`, `routes/contratos.js:20` | Las tres altas |
| Autorrelleno | Copia el tipo del artículo al desplegable | `public/js/factura.js:10` | Nueva factura |

### 1.2 Qué tipo se usa si no se indica

| | Valor por defecto | Código |
| --- | --- | --- |
| Alta de artículo | `config.IVA_DEFECTO` (21) | `routes/articulos.js:16`; `config.js:24-25` |
| Alta de contrato | Literal `21` | `routes/contratos.js:20` |
| Esquema de contratos | `DEFAULT 21` | `db.js:46` |
| Línea de factura | Ninguno (`parseInt(undefined)` → `NaN`) | `routes/facturas.js:61` |
| Desplegables | La primera opción, 21 | `views/factura_nueva.ejs:18`, `views/articulos.ejs:18` |

## 2. Comparación paso a paso

| Paso | Pantallas | Tabla de recargo | Servidor | ¿Igual? |
| --- | --- | --- | --- | --- |
| Tipos vigentes 21/10/4 | Sí | Sí | Sí | Igual |
| Tipos antiguos 18/16/8/7 | No | Sí | Sí | **Distinto** |
| Cualquier otro (5, 2, 0…) | No | No: recargo 0 | Sí | **Distinto** |
| Valor por defecto | 21 (primera opción) | — | `config` (artículos), 21 (contratos), `NaN` (facturas) | **Distinto entre rutas** |

## 3. Ejemplos con resultados distintos

### 3.1 Tipos fuera de las pantallas (E3, servidor real)

Factura enviada por POST directo para el cliente 2, Ferretería El Tornillo, que está en recargo de equivalencia:

| Línea | Tipo | Base | IVA | Recargo | Comentario |
| --- | --- | --- | --- | --- | --- |
| «IVA 5» | 5 % | 100,00 | 5,00 | **0,00** | La tabla no tiene el 5 %: se acepta el tipo, pero el recargo sale a 0 |
| «IVA 7» | 7 % | 100,00 | 7,00 | **1,00** | Tipo antiguo: el formulario no lo ofrece, el servidor lo acepta y la tabla le aplica un 1 % |

Se grabaron como `FA-2026-000110`, numerada y sin posibilidad de borrarla. Qué recargo correspondería legalmente a un tipo del 5 % no se puede afirmar desde el código: es la pregunta P3.

### 3.2 Valores por defecto (E5, código real con `IVA_DEFECTO: 10` solo en la copia)

| Alta sin tipo de IVA | Resultado con `IVA_DEFECTO: 21` (E3) | Resultado con `IVA_DEFECTO: 10` (E5) |
| --- | --- | --- |
| Artículo («Articulo sin IVA») | 21 | **10** |
| Contrato («Contrato sin IVA») | 21 | **21** |

### 3.3 Datos reales

Solo se usan 21, 10 y 4. Consultas: `SELECT DISTINCT tipo_iva FROM lineas` y `SELECT DISTINCT tipo_iva FROM articulos`. No hay divergencia en los datos actuales.

## 4. Cuándo divergen y cuándo coinciden

**Coinciden** siempre que se trabaja desde las pantallas: los desplegables solo envían 21, 10 o 4, y los tres valores por defecto valen 21.

**Divergen:**

- **Tipos que no ofrecen las pantallas**, enviados por POST directo o desde un artículo grabado con otro tipo. Por el autorrelleno, si un artículo tuviera un tipo que no está en el desplegable, el `select` quedaría sin opción válida. Qué enviaría entonces el navegador no se ha comprobado (**SUPOSICIÓN**).
- **Cambio de `config.IVA_DEFECTO`.** En la práctica no se alcanza: el formulario de artículos siempre envía el tipo, y los contratos no tienen pantalla de alta (`views/contratos.ejs` no tiene formulario de nuevo contrato). Solo se puede llegar por POST directo.

**Por qué nadie lo ha detectado:** desde las pantallas no se puede producir ninguna de las dos divergencias.

## 5. Historia probable

1. **Antes de 2017:** los tipos antiguos y sus recargos vienen del Access, «no borrar por si hay que reabrir ejercicios viejos» (`services/calculo.js:16-17`; memoria H2).
2. **2017 en adelante:** las pantallas de la versión Node se escribieron con los tipos vigentes. Cada lista está copiada a mano en su vista.
3. **Sin fecha:** `IVA_DEFECTO` se centralizó en `config.js`, pero el alta de contratos y el esquema llevan su propio 21. Que la ruta de contratos sea anterior a la constante, o que se escribiera sin conocerla, es **SUPOSICIÓN**.
4. **2021:** el autorrelleno de Roberto (`public/js/factura.js:1-2`; memoria H21) copia el tipo del artículo sin comprobar que esté en la lista.
5. **2023-2024:** si hubo ventas a tipos temporales (P3), el programa no tenía forma de ofrecerlos desde la pantalla. No consta cómo se facturaron.

## 6. Para el registro y la entrevista

- **Registro:** nueva entrada propuesta. **Riesgo**: el servidor acepta cualquier tipo de IVA y aplica recargo 0 a los que la tabla no conoce. Impacto: Alto (recargo mal liquidado en una factura que no se puede borrar). Probabilidad: Baja (requiere POST directo o datos tocados a mano). Además, **Rareza**: tres valores por defecto independientes. Impacto: Bajo. Probabilidad: Baja. Relacionado con RN-06, RN-08, P3 y R9. No se propone ninguna corrección.
- **Preguntas:**
  - **C07-1 (Puri, Marga):** ¿se ha facturado alguna vez a un tipo distinto de 21, 10 o 4 % (temporales de 2023-2024, tipos antiguos al reabrir ejercicios)? ¿Cómo, y con qué recargo? (amplía P3)
  - **C07-2 (Julián):** ¿cómo se dan de alta los contratos, si no hay pantalla para hacerlo? ¿Quién eligió su tipo de IVA?
  - **C07-3 (Julián):** si un día se cambia `IVA_DEFECTO`, ¿debe aplicarse también a los contratos?
