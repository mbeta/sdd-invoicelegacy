# Lista de calidad de la especificación: Documento de factura y presentación de importes

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

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros — *FR-007 y partes de otros, por inspección; ver nota 2*
- [x] Las historias de usuario cubren los flujos principales
- [x] La feature cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación — *excepción justificada, ver nota 1*

## Notas

1. **Referencias a código, tests, textos impresos y respuestas HTTP (excepción deliberada).** La spec cita `fichero:líneas`, tests, textos literales del documento y de la consola y los códigos 404/500. Son la **evidencia** que exige la constitución (principio II) y comportamiento observable que protege (principio I). Los enunciados de los requisitos están en lenguaje de negocio; la referencia técnica va aparte, en «Evidencia» y «Test». SC-005 añade una verificación por la usuaria (Marga) sin tecnología.
2. **Verificación por fragmentos.** No hay instantánea del documento completo (LEEME, «Fuera de la red»). FR-007 (fila de recargo y observaciones), la celda de recargo en blanco, la impresión sin botones, el cliente inexistente y el aviso «(sin email)» se verifican por inspección; están en «Huecos de cobertura».
3. **Añadidos de lectura respecto a la entrada.** El título es «FACTURA» también en las rectificativas; el correo de la empresa no se imprime; la columna «Rec. eq.» sale siempre (solo la celda va en blanco); el listado de facturas también usa el formato externo (como dice A-19); al imprimir se ocultan los botones (`public/css/estilos.css:28`); el nombre, el NIF y la dirección del cliente también son los actuales (matiz de A-44 que conviene llevar al registro).
4. **Citas de líneas.** La llamada al envío desde el alta está en `routes/facturas.js:93-95`, como en el registro; el detalle, en `:105-110`.
5. **Precisión de citas.** RS-23 es de Manoli y Julián; N-13 es de Julián; P31, de Manoli. Que las pantallas internas no se usan procede de P28 (Marga, sobre el panel) → RS-22.
6. **Línea base.** El 2026-11-17 se ejecutaron `servidor-facturas`, `servidor-informes`, `util` y `anomalias-calculo`: 128 de 128 en verde, sin cambios en `datos/gesfact.db`.
7. Validación: 1 iteración; todos los elementos pasan.
