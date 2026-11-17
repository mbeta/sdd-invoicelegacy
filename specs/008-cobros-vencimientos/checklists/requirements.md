# Lista de calidad de la especificación: Vencimientos y cobros

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

1. **Referencias a código, tests, zona horaria y respuestas HTTP (excepción deliberada).** La spec cita `fichero:líneas`, tests, la zona `Europe/Madrid` y el 500 «Error BD». Son la **evidencia** que exige la constitución (principio II) y comportamiento observable que protege (principio I). Los enunciados de los requisitos están en lenguaje de negocio; la referencia técnica va aparte, en «Evidencia» y «Test». SC-006 añade una verificación por la usuaria (Marga) sin tecnología.
2. **Partes sin test.** Fallos de la base de datos en el cobro y en el panel, y la ausencia de «deshacer cobro», se verifican por inspección; están en «Huecos de cobertura».
3. **Precisión de citas respecto a la entrada.** P30 es una pregunta a Julián y Marga; la frase de CN-7 es de Marga y el valor 30 de Julián (ratificación). P27 es de Marga y Puri; la convención «una RE no se cobra» es de Marga. RS-35 es de Marga y Dirección. El registro no da decisión de negocio para A-38 (clasificada por código y datos).
4. **Añadidos de lectura, sin hallazgos nuevos.** El panel muestra 0 sin aviso si una consulta falla (`server.js:21-32`); el cobro responde 500 si falla la base de datos (`routes/facturas.js:119`); los 8 vencimientos FA de la copia siguen RN-18 (registro, A-38, QD12).
5. **Línea base.** El 2026-11-17 se ejecutaron `servidor-facturas`, `servidor-informes`, `util`, `remesa` y `golden-master`: 149 de 149 en verde, sin cambios en `datos/gesfact.db`.
6. Validación: 1 iteración; todos los elementos pasan.
