# Guía de Instalación Local - Prestaaea (Windows 11)

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (versión LTS recomendada)
   - Descarga desde: https://nodejs.org/
   - Verifica la instalación: Abre CMD y escribe `node -v`

2. **Git** (opcional, para clonar el repositorio)
   - Descarga desde: https://git-scm.com/

## Características Incluidas

Esta versión incluye todas las funcionalidades actuales:

✅ **Dashboard Completo**
- Resumen de préstamos vencidos
- Estadísticas en tiempo real
- Gráficos de rendimiento

✅ **Gestión de Clientes**
- Registro de nuevos clientes
- Edición de información
- Historial crediticio

✅ **Gestión de Préstamos**
- Creación de nuevos créditos
- Cálculo automático de intereses
- Tablas de amortización

✅ **Módulo de Pagos (ACTUALIZADO)**
- 4 Tipos de pago disponibles:
  1. Solo Intereses
  2. Intereses + Capital
  3. Solo Capital
  4. **Abono a Intereses** (NUEVO)
- Campo **Recibo** para número de comprobante
- **Edición de pagos** con recálculo automático de saldos
- **Botón WhatsApp** para enviar comprobantes
- Validaciones completas

✅ **Reportes**
- Historial de pagos
- Estados de cuenta
- Exportación de datos

## Instrucciones de Instalación

### Método 1: Usando los archivos batch (Recomendado)

1. **Clonar o descargar el proyecto**
   ```bash
   git clone https://github.com/mediac3/prestaaea.git
   cd prestaaea
   ```

2. **Ejecutar instalación**
   - Haz doble clic en `install.bat`
   - O abre CMD en la carpeta del proyecto y ejecuta:
     ```cmd
     install.bat
     ```
   - **Nota**: Durante la instalación se creará automáticamente un acceso directo en tu escritorio llamado "Prestaaea"

3. **Iniciar la aplicación**
   - **Opción A**: Haz doble clic en el ícono "Prestaaea" en tu escritorio
   - **Opción B**: Haz doble clic en `start.bat`
   - **Opción C**: Ejecuta en CMD:
     ```cmd
     start_with_browser.bat
     ```

4. **Acceder a la aplicación**
   - El navegador se abrirá automáticamente en: http://localhost:3000/login
   - Si no se abre automáticamente, ve manualmente a esa URL

### Método 2: Manual (Comandos)

1. **Instalar dependencias**
   ```cmd
   npm install
   ```

2. **Configurar base de datos**
   ```cmd
   npx prisma generate
   npx prisma db push
   ```

3. **Iniciar servidor**
   ```cmd
   npm run dev
   ```

4. **Acceder**
   - Navegador: http://localhost:3000

## Estructura del Proyecto

```
prestaaea/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── dev.db            # Base de datos SQLite local
├── src/
│   ├── app/              # Páginas y rutas API
│   ├── components/       # Componentes React
│   └── lib/              # Utilidades y configuraciones
├── public/               # Archivos estáticos
├── install.bat           # Script de instalación Windows (crea ícono en escritorio)
├── start.bat             # Script de inicio Windows (solo servidor)
├── start_with_browser.bat # Script completo (servidor + abre navegador al login)
├── package.json          # Dependencias del proyecto
└── README.md             # Esta guía
```

## Base de Datos

El proyecto utiliza **SQLite** como base de datos por defecto para facilitar la instalación local:

- **Archivo**: `prisma/dev.db`
- **Ventajas**: No requiere instalación adicional, todo en un archivo
- **Datos iniciales**: Incluye usuarios de prueba (admin/demo)

### Usuarios por Defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin   | admin123  | Administrador |
| demo    | demo123   | Usuario básico |

**⚠️ Importante**: Cambia las contraseñas después del primer acceso.

## Funcionalidades Nuevas Detalladas

### 1. Tipo de Pago: "Abono a Intereses"

- **Descripción**: Permite registrar pagos exclusivos a intereses sin afectar el capital
- **Obligatorio**: Cuando se selecciona este tipo, el campo de abono es requerido
- **Impacto**: Reduce el saldo de intereses pendientes pero mantiene el capital intacto

### 2. Campo "Recibo"

- **Propósito**: Registrar el número de comprobante o factura del pago
- **Opcional**: Puede dejarse vacío si no aplica
- **Visualización**: Se muestra en el historial de pagos y en el mensaje de WhatsApp

### 3. Edición de Pagos

- **Acceso**: Botón con ícono de lápiz en cada pago del historial
- **Campos editables**:
  - Tipo de pago
  - Abono a intereses
  - Abono a capital
  - Número de recibo
  - Fecha del pago
  - Notas adicionales
- **Recálculo**: Ajusta automáticamente los saldos de pagos posteriores

### 4. Botón WhatsApp

- **Ubicación**: Ícono de WhatsApp junto a cada pago en el historial
- **Función**: Abre una nueva conversación con el cliente
- **Mensaje automático**: Incluye todos los detalles del pago:
  - Nombre y cédula del cliente
  - Fecha y tipo de pago
  - Desglose de intereses y capital
  - Total pagado
  - Saldo anterior y nuevo saldo
  - Número de recibo (si existe)
  - Notas adicionales (si existen)

## Solución de Problemas

### Error: "Node.js no está instalado"

**Solución**: 
1. Descarga Node.js desde https://nodejs.org/
2. Instala la versión LTS
3. Reinicia la terminal/CMD
4. Verifica con: `node -v`

### Error: "La columna receipt no existe"

**Solución**:
```cmd
npx prisma db push
```

### Error: "Puerto 3000 ya está en uso"

**Solución**:
1. Cierra otras aplicaciones que usen el puerto 3000
2. O cambia el puerto en `package.json`:
   ```json
   "scripts": {
     "dev": "next dev -p 3001"
   }
   ```

### La aplicación no carga en el navegador

**Solución**:
1. Verifica que el servidor esté corriendo (debe decir "Ready in Xms")
2. Intenta http://127.0.0.1:3000 en lugar de localhost
3. Limpia el caché del navegador (Ctrl+F5)

## Actualizaciones

Para actualizar a la última versión:

```cmd
git pull origin main
npm install
npx prisma db push
```

## Soporte

Si encuentras errores o necesitas ayuda:

1. Revisa este README
2. Verifica los logs en la terminal donde corre el servidor
3. Consulta la documentación de Next.js: https://nextjs.org/docs
4. Reporta issues en: https://github.com/mediac3/prestaaea/issues

## Licencia

Este software es propiedad de Mediac3. Todos los derechos reservados.

---

**Versión**: 2.0.0  
**Última actualización**: 2024  
**Compatible con**: Windows 10/11, macOS, Linux
