# Lista de calidad de la especificación: Rectificación y conservación de facturas

**Propósito**: validar que la especificación está completa y tiene calidad suficiente antes de pasar a la planificación
**Creada**: 2026-11-17
**Spec**: [spec.md](../spec.md)

## Calidad del contenido

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs) — *excepción justificada, ver nota 1*
- [x] Centrada en el valor para el usuario y en las necesidades del negocio
- [x] Redactada para interlocutores no técnicos
- [x] Todas las secciones obligatorias completas

## Completitud de los requisitos

- [x] No queda ningún marcador [NEEDS CLARIFICATION]
- [x] Los requisitos se pueden probar y no son ambiguos
- [x] Los criterios de éxito son medibles
- [x] Los criterios de éxito no dependen de la tecnología — *excepción justificada, ver nota 1*
- [x] Todos los escenarios de aceptación están definidos
- [x] Los casos límite están identificados
- [x] El alcance está delimitado
- [x] Las dependencias y las suposiciones están identificadas

## Preparación de la feature

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros — *partes por inspección, ver nota 2*
- [x] Las historias de usuario cubren los flujos principales
- [x] La feature cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación — *excepción justificada, ver nota 1*

## Notas

1. **Referencias a código, tests y respuestas HTTP (excepción deliberada).** La spec cita `fichero:líneas`, los tests, los códigos 400/404 y sus textos. Son la **evidencia** que exige la constitución (principio II) y comportamiento observable que protege (principio I). Los enunciados de los requisitos están en lenguaje de negocio; la referencia técnica va aparte, en «Evidencia» y «Test». SC-005 añade una verificación por la usuaria (Puri) sin tecnología.
2. **Partes sin test.** El botón de rectificar (el test solo mira el de cobro), los errores ignorados al grabar líneas o marcar la original y la factura con cliente inexistente se verifican por inspección; están en «Huecos de cobertura».
3. **Precisión de citas respecto a la entrada.** La entrada cita `routes/facturas.js:141-143, :154` para RN-29; la spec separa cabecera (`:141-142`), observaciones (`:143`) y marca de la original (`:153-155`). P27 es una pregunta a Marga y Puri; la frase citada es de Puri. Se añaden como hallazgos de lectura, no nuevos, el 404 por cliente inexistente o error de lectura (`:130-131`) y los errores ignorados (`:151`, `:154`, ya en A-24).
4. **Línea base.** El 2026-11-17 se ejecutaron `servidor-facturas.test.js`, `servidor-informes.test.js` y `golden-master.test.js`: 75 de 75 en verde, sin cambios en `datos/gesfact.db`.
5. Validación: 1 iteración; todos los elementos pasan.
