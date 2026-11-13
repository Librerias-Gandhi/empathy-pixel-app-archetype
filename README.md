# Empathy Pixel App for VTEX

**Template de integración** desarrollado para implementar la experiencia de búsqueda **Empathy** en tiendas VTEX. Esta aplicación inyecta un widget de búsqueda avanzada mediante VTEX Pixel, siguiendo las prácticas recomendadas por VTEX.

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Arquitectura](#arquitectura)
- [Componentes Principales](#componentes-principales)
- [Flujo de Integración](#flujo-de-integración)
- [Conceptos Clave](#conceptos-clave)
- [Configuración por Cliente](#configuración-por-cliente)
- [Debugging](#debugging)
- [Contributors](#contributors)

---

## Descripción General

Esta app es una **solución template configurable** que permite integrar el buscador de Empathy en tiendas VTEX. Cada cliente puede tener diferentes configuraciones según sus necesidades:

✅ **Con o sin variantes** de productos  
✅ **Con o sin botón de add to cart**  
✅ **Con o sin quantity selector**  
✅ **Con o sin wishlist**  

### Funcionalidades Principales

- 🔍 **Búsqueda avanzada** mediante el widget de Empathy
- 🛒 **Integración con carrito VTEX** (add/remove/update)
- ❤️ **Gestión de wishlist** con sincronización visual
- 📊 **Eventos de analítica GA4** personalizados
- 🔄 **Comunicación bidireccional** mediante el `setSnippetConfig`

---

## Requisitos Previos

> **⚠️ IMPORTANTE:** Antes de instalar esta app, asegúrate de que:

1. El **conector backend** de Empathy esté correctamente configurado
2. El **catálogo de VTEX** se esté enviando como feed a Empathy
3. El equipo de **Empathy haya mapeado el feed** correctamente

---

## Instalación

Esta aplicación está diseñada para operar como una **App Privada**. Sigue estos pasos para configurarla e instalarla bajo la cuenta correspondiente.

### Prerrequisitos
Asegúrate de estar logueado en la cuenta objetivo:
```bash
   vtex login <account-name>
```

### Pasos

1. **Opción A - Hacer fork del repositorio (recomendado):**
   
   1. Haz fork del repositorio desde GitHub: https://github.com/empathyco/empathy-pixel-app-archetype/fork
   2. Clona tu fork:
   ```bash
   git clone https://github.com/TU_USUARIO/empathy-pixel-app-archetype
   cd empathy-pixel-app-archetype
   ```

   **Opción B - Clonar repositorio:**
   ```bash
   git clone https://github.com/empathyco/empathy-pixel-app-archetype
   cd empathy-pixel-app-archetype
   ```

2. Configura tu aplicación: Sigue la guía de configuración detallada en la sección [Configuración](#configuración).

3. Prueba la aplicación: En este punto puedes probar la aplicación localmente para asegurarte de que se carga correctamente en tu tienda VTEX.
   ```bash
   vtex link
   ```

4. Publica la aplicación: Publica la app en el registry de VTEX para que esté disponible en tu cuenta:
   ```bash
   vtex publish
   ```

5. Instala la aplicación: Instala la versión recién publicada en el workspace actual:
   ```bash
   vtex install
   ```

6. Verifica la instalación:
   ```bash
   vtex ls | grep <account-name>.empathy-pixel-app
   ```

---

## Configuración

### 1. manifest.json - Vendor y Versionado

Configura el Vendor (Account Name): Abre el archivo manifest.json en la raíz del proyecto. Cambia el valor del campo vendor por el nombre de la cuenta (account name) donde se instalará la aplicación.

```json
// manifest.json
{
"name": "empathy-pixel-app",
"vendor": "TU_ACCOUNT_NAME",
"version": "0.0.x"
}
```

Nota: Esto cambiará el ID de la app a TU_ACCOUNT_NAME.empathy-pixel-app.


### 2. Configuración InitX

En `react/Components/EmpathySearchbar/index.tsx`, configura los parámetros del cliente:

Ejemplo:
```tsx
(window as any).initX = {
    instance: "{INSTANCE}",        // Identificador del cliente provisto por Empathy. Ej: 'chedraui'
    lang: "es",                    // Idioma: 'es', 'en', 'pt', etc.
    scope,                         // 'desktop' | 'mobile' — resuelto por useEmpathyScope (ver abajo)
    currency: "EUR",               // 'EUR', 'USD', 'MXN', etc.
    consent: false,
    viewMode: 'embedded',
    callbacks: { ... }
};
```

### 3. Integración de los componentes

En tu theme, agrega los componentes `empathy-searchbar` y `empathy-results` en las templates donde necesites. Estos componentes pueden ubicarse **independientemente** en diferentes templates según la estructura de tu tienda.

#### ¿Dónde colocar cada componente?

- **`empathy-searchbar`**: En el header o donde necesites el cajón de búsqueda
- **`empathy-results`**: En la template donde quieras mostrar los resultados (home, search, category, etc.)

#### Configuración de EmpathyResults

El componente `empathy-results` tiene un comportamiento especial que requiere una configuración específica.

**¿Cómo funciona?**

`empathy-results` renderiza un `div` con `data-teleport="empathy-results-container"`. Cuando el usuario realiza una búsqueda, el script de Empathy inyecta los resultados dentro de este contenedor y **automáticamente oculta todos sus elementos hermanos en el DOM**. Esto permite que el grid de resultados se incruste en el contenido de la página sin necesidad de CSS adicional.

**Configuración requerida:**

Para que este mecanismo funcione correctamente, **el contenido de la página que quieras ocultar durante la búsqueda debe estar declarado como children de `empathy-results`**, convirtiéndose así en hermanos de los resultados de búsqueda.

> 💡 **Nota:** No es necesario incluir todo el contenido de la página. Elementos como partes del footer, chatbots, o componentes específicos que quieras mantener visibles durante la búsqueda pueden quedar fuera de los children de `empathy-results`.

#### Ejemplos de Integración

**Ejemplo A: Searchbar en header, Results en home**

**Antes de la integración - Home:**
```json
{
  "store.home": {
    "blocks": [
      "flex-layout.row#hero",
      "flex-layout.row#integrate",
      "flex-layout.row#promises"
    ]
  }
}
```

**Después de la integración - Home:**
```json
{
  "store.home": {
    "blocks": [
      "empathy-results",
      "flex-layout.row#promises"
    ]
  },
  "empathy-results": {
    "children": [
      "flex-layout.row#hero",
      "flex-layout.row#integrate"
    ]
  }
}
```

> **💡** Aquí, `flex-layout.row#promises` queda fuera de los children de `empathy-results` porque no queremos que se oculte durante la búsqueda. Solo los elementos dentro de los children se ocultan automáticamente cuando aparecen los resultados.

**Antes de la integración - Header:**
```json
{
  "header": {
    "blocks": [
      "header-layout.desktop"
    ]
  },
  "flex-layout.row#desktop": {
    "children": [
      "logo",
      "minicart"
    ]
  }
}
```

**Después de la integración - Header:**
```json
{
  "header": {
    "blocks": [
      "header-layout.desktop"
    ]
  },
  "flex-layout.row#desktop": {
    "children": [
      "logo",
      "empathy-searchbar",
      "minicart"
    ]
  }
}
```

> **💡** Aquí, el cajón de búsqueda se integrará en una fila del header, entre el logo de la store y el carrito.

**Ejemplo B: Ambos componentes en search page**

**Antes de la integración:**
```json
{
  "store.search": {
    "blocks": [
      "flex-layout.row#products"
    ]
  }
}
```

**Después de la integración:**
```json
{
  "store.search": {
    "blocks": [
      "empathy-searchbar",
      "empathy-results"
    ]
  },
  "empathy-results": {
    "children": [
      "flex-layout.row#products"
    ]
  }
}
```

> **💡** En este ejemplo, tanto el cajón de búsqueda como los resultados están integrados consecutivamente. Todos los elementos originales del search page están dentro de los children de `empathy-results`, por lo que se ocultarán automáticamente cuando aparezcan los resultados de búsqueda.

> **📌 Recuerda:** Puedes decidir dónde colocar cada componente según su estructura de templates. Por ejemplo: podrías usar `empathy-searchbar` sin `empathy-results` si solo necesitas el cajón de búsqueda, o usar solamente `empathy-results` manejando la query, filtros, etc. por los parámetros de la url.

> 📚 **Más información:** Puedes obtener más detalles sobre cómo se integra Empathy en la [documentación oficial de Empathy](https://docs.empathy.co/develop-empathy-platform/build-search-ui/web-archetype-integration-guide.html).

---

## Arquitectura

### Estructura del Proyecto

```
empathy-pixel-app-archetype/
├── manifest.json             # Configuración de la app VTEX
├── pixel/
│   └── head.html             # Script de inicialización de Empathy
├── store/
│   ├── interfaces.json       # Definición de componentes React
│   └── plugins.json          # Configuración de pixel manager
├── react/
│   ├── index.tsx             # Entry point del pixel
│   ├── Components/
│   │   ├── EmpathySearchbar/ # 🔑 Componente principal
│   │   │   ├── index.tsx
│   │   │   ├── constants.tsx
│   │   │   ├── utils/
│   │   │   │   ├── index.tsx       # Utilidades generales
│   │   │   │   └── handleCart.ts   # Lógica de carrito
│   │   │   ├── hooks/
│   │   │   │   ├── handleWishlist.ts
│   │   │   │   └── useGAAnalytics.ts
│   │   │   └── gql/               # GraphQL queries
│   │   └── EmpathyResults/    # Overlay de resultados
└── docs/
    └── README.md
```

### Dependencias VTEX

```json
{
  "vtex.pixel-interfaces": "1.x",
  "vtex.order-items": "0.x",
  "vtex.order-manager": "0.x",
  "vtex.styleguide": "9.x",
  "vtex.pixel-manager": "1.x",
  "vtex.session-client": "1.x",
  "vtex.wish-list": "1.x"  // Opcional (solo si se usa wishlist)
}
```

---

## Componentes Principales

### EmpathySearchbar

El componente principal que:
- Inicializa el widget de Empathy mediante `initX`
- Configura callbacks para interacciones del usuario
- Gestiona la comunicación con VTEX (carrito, wishlist)
- Envía eventos de analítica a GA4

**Callbacks disponibles:**

| Callback | Descripción |
|----------|-------------|
| `UserClickedResultAddToCart` | Click en "agregar al carrito" (producto simple) |
| `UserClickedResultVariantAddToCart` | Click en "agregar al carrito" (con variantes) |
| `UserClickedResultRemoveFromCart` | Click en "quitar del carrito" (producto simple) |
| `UserClickedResultVariantRemoveFromCart` | Click en "quitar del carrito" (con variantes) |
| `UserClickedResultWishlist` | Click en el icono de wishlist |

### EmpathyResults

Contenedor overlay para mostrar los resultados de búsqueda. Empathy "teleporta" su UI a este componente usando `data-teleport`.

### Utils y Hooks

- **`handleCart.ts`**: Lógica centralizada para operaciones de carrito
- **`handleWishlist.ts`**: Gestión completa de wishlist con GraphQL
- **`useGAAnalytics.ts`**: Envío de eventos personalizados a GA4
- **`index.tsx` (utils)**: Funciones auxiliares (`findProductBySkuId`, `mapProductForGA4`)

---

## Flujo de Integración

### 1. Inicialización (Carga de Página)

```mermaid
sequenceDiagram
    participant Browser
    participant VTEX
    participant Empathy
    participant Component

    Browser->>VTEX: Carga página
    VTEX->>Browser: Inyecta head.html
    Browser->>Empathy: Descarga app.js
    Empathy->>Browser: window.InterfaceX disponible
    Component->>Empathy: Configura initX + callbacks
    Component->>Empathy: InterfaceX.init()
    Empathy->>Component: Widget renderizado en teleport
```

### 2. Flujo Add to Cart

```mermaid
sequenceDiagram
    participant User
    participant Empathy
    participant Callback
    participant VTEX
    participant GA4

    User->>Empathy: Click "Agregar al carrito"
    Empathy->>Callback: UserClickedResultAddToCart(result, metadata)
    Callback->>Callback: handleCartOperation()
    Callback->>Callback: Determina acción (newProduct/updateQuantity)
    Callback->>Empathy: setSnippetConfig({ cart: {...} })
    Callback->>VTEX: findProductBySkuId()
    VTEX->>Callback: Datos del producto
    Callback->>GA4: pushAddToCartEvent()
    Callback->>VTEX: addItems() o updateQuantity()
    VTEX->>User: Producto en carrito
```

### 3. Flujo Wishlist

```mermaid
sequenceDiagram
    participant User
    participant Empathy
    participant Hook
    participant VTEX
    participant GA4

    User->>Empathy: Click icono wishlist
    Empathy->>Hook: UserClickedResultWishlist(result)
    Hook->>VTEX: checkSession()
    alt Usuario no autenticado
        Hook->>User: Redirigir a /login
    else Usuario autenticado
        Hook->>VTEX: checkItemQuery (GraphQL)
        alt Ya en wishlist
            Hook->>VTEX: removeMutation (GraphQL)
            Hook->>Empathy: setSnippetConfig({ wishlist: [...] })
        else No en wishlist
            Hook->>VTEX: addMutation (GraphQL)
            Hook->>GA4: pushWishlistEvent()
            Hook->>Empathy: setSnippetConfig({ wishlist: [...] })
        end
    end
```

---

## Conceptos Clave

### `setSnippetConfig` - API de Comunicación

Esta es la **interfaz principal** para comunicarse con el widget de Empathy:

```tsx
(window as any).InterfaceX.setSnippetConfig({
    cart: { 
        "123": 2,      // SKU ID → Cantidad
        "456": 1 
    },          
    wishlist: ["789", "101112"],   // Array de SKU IDs en wishlist
    // ... otros parámetros
});
```

**¿Qué hace?**
- ✅ Actualiza el estado visual del widget
- ✅ Muestra cantidades en el carrito
- ✅ Marca productos con icono de wishlist "filled"


> 📚 **Más información:** Puedes obtener más información sobre la configuración del snippet en la [documentación oficial de Empathy](https://docs.empathy.co/develop-empathy-platform/build-search-ui/web-archetype-integration-guide.html#snippet-configuration).

### `scope` por dispositivo (`useEmpathyScope`)

El `scope` de Empathy (`'desktop'` | `'mobile'`) se resuelve con `useDevice` de `vtex.device-detector`, el mismo hook que usa `header-layout` para elegir entre header desktop y mobile:

- **Por defecto:** `'desktop'`. En phone/tablet (`isMobile`) es `'mobile'`.
- **Al montar:** el valor se escribe en `window.initX.scope` antes de `InterfaceX.init()`.
- **Al cambiar de breakpoint:** se llama a `InterfaceX.setSnippetConfig({ scope })`.
- **Debug:** en consola aparecen `[Empathy] scope inicial: ...` y `[Empathy] scope cambió: desktop -> mobile`.

```javascript
// Ver el scope actual
console.log(window.__empathyScope, window.InterfaceX.getSnippetConfig()?.scope);
```

### Eventos GA4

La app envía 3 eventos personalizados:

- **`add_to_cart_empathy`**: Cuando se agrega un producto
- **`remove_from_cart_empathy`**: Cuando se quita un producto
- **`add_to_wishlist_empathy`**: Cuando se agrega a favoritos

Todos incluyen:
- `search_term`: El término de búsqueda que generó la interacción
- `ecommerce.items[]`: Datos del producto en formato GA4

---

## Configuración por Cliente

### Checklist de Implementación

#### Script de Empathy
- [ ] Verificar que el script se cargue correctamente (`console.log(window.InterfaceX)`)

#### InitX Configuration
- [ ] Actualizar `instance` (identificador del cliente en Empathy)
- [ ] Ajustar `lang` según idioma del sitio
- [ ] Configurar `currency` según moneda de la tienda
- [ ] Verificar `scope`: lo resuelve `useEmpathyScope` (`'desktop'` por defecto, `'mobile'` en phone/tablet)

#### Funcionalidades Opcionales
- [ ] ¿El cliente tiene **variantes**? → Mantener callbacks de `Variant`
- [ ] ¿El cliente tiene **add to cart**? → Configurar callbacks de `AddToCart`
- [ ] ¿El cliente tiene **quantity selector**? → Verificar `metadata.inputValue`
- [ ] ¿El cliente tiene **wishlist**? → Verificar dependencia `vtex.wish-list`

#### Backend y Testing
- [ ] Verificar que el conector backend esté instalado
- [ ] Confirmar que el feed se envíe correctamente a Empathy
- [ ] Validar que Empathy haya mapeado el feed
- [ ] Probar búsqueda y resultados
- [ ] Probar add/remove from cart (con y sin variantes)
- [ ] Probar wishlist (agregar/remover)
- [ ] Verificar eventos GA4 en `window.dataLayer`

---

## Debugging

### Verificaciones Básicas

```javascript
// 1. Verificar que Empathy está cargado
console.log(window.InterfaceX);

// 2. Ver configuración actual
console.log(window.InterfaceX.getSnippetConfig());

// 3. Ver cart sincronizado
console.log(window.InterfaceX.getSnippetConfig()?.cart);

// 4. Ver wishlist sincronizada
console.log(window.InterfaceX.getSnippetConfig()?.wishlist);

// 5. Ver eventos GA4
console.log(window.dataLayer);
```

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| Widget no se muestra | Verificar que el script en `head.html` se cargue correctamente |
| `InterfaceX is undefined` | El script de Empathy no se cargó. Revisar URL y conectividad |
| Cart no sincroniza | Revisar que `setSnippetConfig` se llame después de `init()` |
| Wishlist no funciona | Verificar que `vtex.wish-list` esté instalada |
| Eventos GA4 no aparecen | Revisar que `window.dataLayer` exista antes de push |

---

## Contributors

Desarrollado por el equipo de **Experimentality** para implementaciones de Empathy en VTEX.

---
