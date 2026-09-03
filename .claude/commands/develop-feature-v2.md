---
argument-hint: [ticket-id] [spec-files...]
description: Implementa un feature con el agente developer, a partir de un ticket y sus Specs de arquitectura
---

Usa el agente developer para implementar el feature.

Argumentos recibidos: $ARGUMENTS

El primer argumento es el ID del ticket — ejemplo: TF-3.md en la ruta docs/tickets.

Todos los argumentos siguientes son
archivos de arquitectura en la ruta docs/ (mínimo 1, sin límite superior), cada uno debe empezar con el prefijo `Spec` (ej. SpecAuth.md, SpecState.md).

Ejemplo con una sola spec: TF-3.md SpecAuth.md
Ejemplo con varias specs: TF-3.md SpecPurchase.md SpecState.md

Si algún argumento a partir del segundo no empieza con el prefijo `Spec`,
detente y avisa que ese archivo no parece ser una spec válida — no lo proceses como si lo fuera.

Implementa el feature descrito en @docs/tickets/[el primer argumento].md
usando como contexto de arquitectura cada uno de los archivos @docs/[Spec].md correspondientes a los argumentos restantes.

Antes de escribir código:
1. Lee el ticket completo
2. Lee cada uno de los archivos de arquitectura indicados
3. Crea la rama AI/feature/[ticket-id] desde la rama actual

Al implementar:
- Respeta estrictamente las entidades de TODOS los archivos de arquitectura indicados
- Básate en la estructura de componentes ya implementada
- Nunca modifiques el contrato de la API

Al terminar:

- Coloca un comentario en cada método/function que hayas creado con // TODO UNIT TEST
- Si el método/function ya existían y las modificaste, añade el comentario // REFACTOR UNIT TEST
- Reporta qué archivos creaste o modificaste
- Espera validación del developer antes de continuar
- No hagas commit — el commit se hace desde el comando de tests, una vez verificado el comportamiento