### DESCRIPCION
Como usuario de TicketFlow, necesito que mi sesión se mantenga activa de forma transparente mientras navego la aplicación, y que los errores del sistema se manejen de forma consistente en toda la app, sin que cada pantalla tenga que resolverlo por su cuenta.

### CRITERIOS DE ACEPTACION
- [ ] Toda petición que requiera sesión iniciada incluye automáticamente mis credenciales — no tengo que iniciar sesión más de una vez
- [ ] Si mi sesión expira o es inválida, se me redirige al login automáticamente
- [ ] Si intento una acción para la que no tengo permiso, veo un mensaje claro explicando por qué no puedo realizarla
- [ ] Si el servidor falla de forma inesperada, veo un mensaje genérico de error y puedo reintentar
- [ ] Quedan implementadas las rutas de comunicación con el backend para autenticación, perfil, eventos, reservas y pagos, de forma que la aplicación pueda traer y enviar toda la información con la que interactúa TicketFlow

### DEFINICION DE TERMINADO (DOD)
- [ ] Todos los criterios de aceptación se cumplen
- [ ] No hay errores visibles en la consola del navegador durante el flujo normal de uso
- [ ] El código fue revisado y aprobado por el equipo antes de integrarse
- [ ] Verificado manualmente en el entorno de desarrollo