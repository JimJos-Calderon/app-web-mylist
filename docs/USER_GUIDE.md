# Guía de usuario

Uso funcional de **WhichNext** para personas que gestionan listas compartidas de películas y series.

---

## Acceso

1. Abre la app (web o PWA instalada).
2. **Regístrate** con email y contraseña o inicia sesión.
3. Si es tu primera vez, puede pedirte un **nombre de usuario** (onboarding).

---

## Listas compartidas

### Crear una lista

En el selector de listas (Películas o Series) → **Crear lista** → nombre y opciones.

### Invitar

- Genera o copia el **código de invitación**.
- Comparte el enlace `/join/CODIGO`.
- Quien no tenga sesión puede guardar el código y completar el join tras login.

### Cambiar de lista activa

Usa el selector en la parte superior de **Películas** o **Series**. Todo el contenido (filtros, ítems, feed) corresponde a la lista activa.

### Ajustes de lista (propietario)

Icono de engranaje junto a la lista activa:

- Webhook de **Discord** para avisos al añadir títulos.
- Tema de notificaciones de la lista.
- Etiquetas a nivel lista.
- **Exportar / importar** ítems en JSON o CSV.

CSV: cabecera `titulo,tipo,tags,sort_index`; etiquetas separadas por `;` en `tags`.

---

## Añadir y gestionar títulos

1. **Buscar** en la barra (sugerencias OMDB; mejor con TMDB configurado en el servidor/cliente).
2. Elige una sugerencia o confirma título manual.
3. **Pendientes / Vistas:** el estado de visto es **por usuario** en listas compartidas.
4. **Marcar como visto** abre la **crítica rápida** (estrellas, me gusta/no, texto opcional).
5. **Detalle** (clic en tarjeta): sinopsis, comentarios, **dónde verlo**, marcar no visto, eliminar de la lista (según permisos).
6. **Aleatorio:** «¿Qué ver hoy?» elige un pendiente al azar.

---

## Orden y cola

- **Ordenar:** fecha, título, valoración o **manual** (arrastrar en pendientes cuando el orden es manual).
- Con orden manual, la paginación se desactiva en esa vista para poder reordenar todos los ítems visibles.
- **Siguiente en cola:** marca un ítem destacado; aparece en el dashboard.

---

## Filtros y etiquetas

- Pestañas o filtros **Pendientes** / **Vistas**.
- Búsqueda por texto.
- Filtro por **etiqueta** (ítem o lista).
- **Activity Feed:** timeline colapsable con cambios recientes de la lista.

---

## Oráculo (IA)

En el dashboard, si hay datos suficientes de tus valoraciones:

- Genera **tres recomendaciones** según lo que te gusta y lo que evitas.
- Requiere `GROQ_API_KEY` configurado en el proyecto (ver [INTEGRATIONS.md](./INTEGRATIONS.md)).

---

## Perfil y cuenta

| Ruta | Contenido |
|------|-----------|
| `/perfil` | Estadísticas y títulos que has valorado |
| `/ajustes` | Username, bio, avatar, email, contraseña, **tema visual**, idioma |

### Quitar valoración

Desde perfil o detalle: elimina tu nota y comentario y deja el ítem en **pendiente** para ti; **no** borra el título de la lista para el resto.

---

## Temas visuales

En **Ajustes** → Tema:

- **Cyberpunk** — neón y fondo de líneas animadas.
- **Terminal** — verde consola y lluvia Matrix.
- **Retro cartoon** — estilo cómic / neubrutalista.

La preferencia se guarda en tu perfil.

---

## PWA y offline

- Instalable en Android (prompt) e iOS (Añadir a pantalla de inicio).
- Lectura de listas cacheadas posible sin conexión; las mutaciones requieren red.

---

## Soporte técnico

Desarrolladores: [README de documentación](./README.md) y [GETTING_STARTED.md](./GETTING_STARTED.md).
