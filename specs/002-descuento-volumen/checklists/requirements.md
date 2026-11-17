# Lista de calidad de la especificación: Descuento por volumen

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

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros
- [x] Las historias de usuario cubren los flujos principales
- [x] La feature cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación — *excepción justificada, ver nota 1*

## Notas

1. **Referencias a código y tests (excepción deliberada).** La spec cita `fichero:líneas`, nombres de funciones y ficheros de test. Son la **evidencia** que exige la constitución (principio II) y que pidió expresamente el usuario para una spec inversa, no decisiones de implementación. Los enunciados de los requisitos están en lenguaje de negocio; la referencia técnica va aparte, en «Evidencia» y «Test». SC-007 añade una verificación manual sin tecnología (calculadora).
2. **Cobertura completa.** Los 8 requisitos tienen test. FR-007 (sin descuento, observaciones tal cual) se apoya en GM-01 y en el código, porque ningún test lo afirma por separado.
3. **Línea base.** El 2026-11-16 se ejecutaron los seis ficheros de test citados: 175 de 175 en verde, sin cambios en `datos/gesfact.db`.
4. **Discrepancia detectada en el registro (no se corrige aquí).** La ficha de A-10 del [registro de anomalías](../../000-reconocimiento/registro-de-anomalias.md) cifra el impacto en la frontera de 1.000 € en «24,20 € (1.210,00 € sin descuento frente a 1.185,80 € con el 2 %)». El código, el test de A-09 y RN-12 dan **1.185,81 €** y una diferencia de **24,19 €**. La spec usa la cifra verificada por el test.
5. Validación: 1 iteración; todos los elementos pasan.
