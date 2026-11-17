# Lista de calidad de la especificación: Alta manual de facturas y datos del cliente

**Propósito**: validar que la especificación está completa y tiene calidad suficiente antes de pasar a la planificación
**Creada**: 2026-11-16
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

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros — *FR-011 solo por inspección, ver nota 2*
- [x] Las historias de usuario cubren los flujos principales
- [x] La feature cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación — *excepción justificada, ver nota 1*

## Notas

1. **Referencias a código, tests y textos de error (excepción deliberada).** La spec cita `fichero:líneas`, ficheros de test y los textos literales de las respuestas de error. Son la **evidencia** que exige la constitución (principio II) y, en el caso de las respuestas, comportamiento observable que la constitución protege (principio I). Los enunciados de los requisitos están en lenguaje de negocio; la referencia técnica va aparte, en «Evidencia» y «Test». SC-006 añade una verificación por la usuaria (Marga) sin tecnología.
2. **FR-011 (A-25) sin test.** Su criterio se verifica solo por inspección del código, como pidió el usuario, porque haría falta inyectar fallos de la base de datos (`pruebas/caracterizacion/LEEME.md:144`). Está declarado en «Huecos de cobertura».
3. **Huecos menores.** La descripción de solo espacios y el texto con dos comas tienen evidencia de código pero no test propio; están en «Huecos de cobertura».
4. **Matiz respecto al registro (no se corrige aquí).** La ficha de A-21 dice que una fecha no ISO da vencimiento «NaN-NaN-NaN». Los tests muestran que eso solo pasa con fechas que no se pueden interpretar (`util.test.js`, RN-19). «2026/10/20» y «2026-1-5» sí producen vencimiento (2026-11-18 y 2026-02-04). La spec se limita a la fecha grabada y deja el vencimiento a la 008.
5. **Línea base.** El 2026-11-16 se ejecutaron los cuatro ficheros de test citados: 122 de 122 en verde, sin cambios en `datos/gesfact.db`.
6. Validación: 1 iteración; todos los elementos pasan.
