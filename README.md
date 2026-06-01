# 🛠️ FixNow - Rider App (Aplicación de Clientes)

### 1. Link al deploy de producción

**[🔗 Visitar FixNow Rider App en Producción](https://proyecto-a-rider-fixnow.vercel.app/)**

---

### 1. Breve descripción del proyecto

FixNow es una plataforma diseñada para organizar, transparentar y facilitar la contratación de servicios de mantenimiento para el hogar, focalizada en los rubros de plomería, electricidad y gas. Habitualmente, la búsqueda de un profesional para solucionar un desperfecto depende de contactos informales, lo que suele generar problemas de coordinación, incertidumbre en los presupuestos y falta de garantías.

A través de la **Rider App** (la interfaz destinada a los clientes), un usuario puede crear solicitudes precisas, geolocalizar el servicio y realizar un seguimiento en tiempo real del estado de su pedido. La aplicación funciona como el nexo formal entre la necesidad del cliente y la ejecución del trabajo.

El sistema garantiza trazabilidad total: permite abonar el servicio de manera electrónica dentro de un entorno seguro y calificar el desempeño del trabajador, alimentando un sistema de reputación público y verificable que brinda previsibilidad a ambas partes.

---

### 2. Listado de usuarios disponibles para realizar pruebas

Para evaluar la plataforma en su totalidad, solicitamos utilizar las siguientes credenciales provistas a través de nuestro entorno de pruebas en Clerk:

- **Usuario 1 (Prueba de Onboarding):**
  - **Email:** `rider1+clerktest@iaw.com`
  - **Contraseña:** `iawuser#1`
  - _Propósito:_ Utilizar este usuario para evaluar el flujo de registro por primera vez y la carga de datos obligatorios en la pantalla de "Completar Perfil".
- **Usuario 2 (Prueba de Flujos Principales):**
  - **Email:** `rider2+clerktest@iaw.com`
  - **Contraseña:** `iawuser#2`
  - _Propósito:_ Este usuario ya posee datos cargados y un historial. Utilizarlo para ejecutar las instrucciones de evaluación detalladas en la siguiente sección.

---

### 3. Instrucciones que consideren necesarias para utilizar o evaluar la aplicación

Recomendamos seguir este flujo de pruebas secuencial utilizando el **Usuario 2** para experimentar todas las integraciones de la etapa actual:

1. **Persistencia de sesión:** Haga clic en el logo de FixNow para regresar a la _Welcome Page_. Notará que la sesión se mantiene activa; presione "Ir al dashboard" para volver.
2. **Edición y Cancelación sin cargo:** Solicite un servicio _Inmediato_. Mientras está en estado "Pendiente", utilice el botón "Editar solicitud" para cambiar los datos, ya sea dirección, tipo de servicio o descripcion (la UI se actualizará al instante). Luego, cancele el servicio para corroborar que, al no haber profesional asignado, no se cobra multa.
3. **Flujo Inmediato Completo (con timeout y variación de precio):** * Solicite un servicio de *Electricidad\* inmediato.
   - **No asigne profesional.** Espere 15 segundos en la pantalla de seguimiento para ver el aviso de "Profesionales no disponibles". Elija "Seguir esperando".
   - Simule el avance (asignación del profesional) y, una vez definido el profesional, haga click en "Ver perfil del profesional" para obtener detalles del mismo. Tambien puede hacer click en "Ver opiniones de clientes" para obtener comentarios de otros usuarios a los que el progesional les ha realizado algun servicio anteriormente.
   - Vuelva al Inicio para ver que hay un trabajo activo. Para comprobar cómo el trabajo activo bloquea la solicitud de nuevos servicios, haga click en las tarjetas de servicio para intentar solicitar uno nuevo.
   - Regrese a Trabajo Activo y simule hasta la finalización del trabajo. Vuelva a Inicio nuevamente y observe que no puede pedir otro servicio hasta abonar este.
   - Notará que ahora, en Trabajo Activo, hay un boton "Abonar trabajo", presionelo. Al pagar, notará que el precio aumentó (lógica mockeada para Electricidad) y verá el reporte técnico, seleccione "Ir a Payments" para simular la redireccion a dicha aplicaicon. Tras el pago, será redirigido al Inicio donde podrá calificar al profesional mediante un modal de Feedback. Si bien puede elegir hacerlo mas tarde, recomendamos que lo haga ahora para finalizar el flujo completo.
4. **Cancelación por el Profesional:** Solicite otro trabajo inmediato, simule la asignación de un profesional y luego presione "Simular: Prof. Cancela". Verificará que el sistema no le cobra multa al cliente y lo invita a crear una nueva solicitud.
5. **Flujo Programado (Happy Path):** En "Turnos Programados", solicite un servicio a futuro (si intenta elegir una fecha pasada, no podrá continuar). Asigne un profesional mediante el boton de simulación "Simular: Asignar Prof", y luego presione "Simular: Llegó el día" para ver cómo el trabajo se transfiere automáticamente al dashboard de _Trabajo Activo_. Lo que sigue, será idéntico a lo que ya estuvimos testeando en el punto 3. Puede elegir cancelarlo y pagar multa, o continuar el trabajo para finalizarlo de manera completa.
6. **Flujo Programado (Auto-cancelación):** Cree un turno programado, déjelo en estado "Pendiente" y presione "Simular: Llegó el día". El sistema auto-cancelará la solicitud por falta de profesionales y permitirá eliminar la tarjeta.
7. **Flujo Programado (Multa):** Cree un turno, asigne un profesional y luego cancélelo manualmente. El sistema detectará que ya había un trabajador comprometido y le exigirá el pago de una multa.
8. **Historial y Feedback diferido:** Ingrese a "Mi Historial", abra el comprobante de un servicio anterior, revise el perfil del profesional asignado y déjele una reseña.
9. **Gestión de Perfil:** Diríjase a "Mi Perfil" y actualice su información personal.

---

### 4. Comentarios

**Stack Tecnológico:**

- **Frontend:** Next.js 15 (App Router), React, TailwindCSS, Lucide-React.
- **Autenticación:** Clerk.
- **Base de Datos & ORM:** PostgreSQL (Supabase) gestionado a través de Prisma ORM.
- **Mapas y Geolocalización:** React-Leaflet integrado con la API pública de Nominatim (OpenStreetMap).

**Decisiones de Diseño y Mocks (Etapa 2):**
Para esta entrega, la Rider App se desarrolló de forma independiente. Para poder evaluar los flujos que dependen de otras aplicaciones del ecosistema (Driver App, Payments App, Feedback App), implementamos una serie de **APIs Mockeadas** internas (`/api/v1/driver-mock/`, `/api/v1/feedback-mock/`). Esto nos permitió simular asignaciones inteligentes, variaciones de precios post-servicio, penalizaciones y obtención de perfiles sin romper la arquitectura de microservicios propuesta.

- _Limitación en Turnos Programados:_ El selector de fecha actualmente permite seleccionar minutos exactos; la restricción para limitar la selección a intervalos estrictos de 30 minutos (ej: 14:00, 14:30) se encuentra en desarrollo.
- _Limitación de Geolocalización y Renderizado de Mapas:_ La aplicación utiliza la API pública de Nominatim para la geocodificación inversa. Se ha detectado que, dependiendo de la asignación de IP del cliente o red utilizada, la API externa puede rechazar la conexión temporalmente debido a políticas de _rate limiting_ o bloqueos de CORS. Para evitar un fallo crítico, implementamos un mecanismo de _fallback_. Como consecuencia, la renderización visual del mapa o el _tracking_ en tiempo real puede fallar en pantalla por momentos. No obstante, **la integridad del servicio está garantizada**, ya que la dirección exacta en formato texto viaja correctamente en el _payload_ hacia el servidor y la base de datos, asegurando que el profesional reciba el domicilio preciso.

**Proyecciones para la Etapa 3:**

1. **Comprobantes Reales:** Obtener información en vivo de la Payment App para generar facturas/comprobantes detallados.
2. **Sistema de Reclamos:** Incorporar la posibilidad de disputar un trabajo, pasando el _Job_ a un estado de `REVIEW`.
3. **Ubicación en Tiempo Real:** Reemplazar los botones de simulación por un seguimiento periódico (WebSockets/Polling) de la ubicación del profesional en camino.
4. **Chatbot IA:** Incluir un asistente virtual que analice el problema descrito por el usuario y le recomiende automáticamente el tipo de servicio a solicitar.
