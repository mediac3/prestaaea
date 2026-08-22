# Configuración de Autenticación de Dos Factores (2FA)

## Descripción
Se ha implementado un módulo de autenticación de dos factores que requiere que los usuarios ingresen un código temporal enviado a un correo electrónico único previamente configurado en el sistema.

## Características Implementadas

### 1. Módulo 2FA
- **Generación de código**: Código de 6 dígitos válido por 10 minutos
- **Envío por email**: Plantilla HTML profesional con instrucciones claras
- **Verificación**: Validación del código con expiración automática
- **Reenvío de código**: Opción para solicitar un nuevo código
- **Configuración por usuario**: Cada usuario puede habilitar/deshabilitar 2FA y configurar un email específico

### 2. Informes Excel con Nombres de Columnas
- Los informes de préstamos generados en Excel ahora incluyen nombres claros en cada columna
- Columnas identificadas: Cliente, Fecha, Tipo de Pago, Intereses, Abono a Intereses, Abono a Capital, Total Pagado, Saldo Anterior, Nuevo Saldo, Recibo, Notas

## Configuración Requerida

### Variables de Entorno para SMTP

Agrega las siguientes variables a tu archivo `.env`:

```env
# Configuración SMTP para envío de emails 2FA
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
SMTP_FROM=PrestaAEA <tu_correo@gmail.com>
```

### Notas sobre SMTP

**Para Gmail:**
1. Debes usar una "Contraseña de Aplicación" en lugar de tu contraseña normal
2. Para generarla: Ve a tu Cuenta Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación
3. Genera una contraseña para "Correo" y úsala en `SMTP_PASS`

**Para otros proveedores:**
- Outlook/Hotmail: `smtp-mail.outlook.com`, puerto 587
- Yahoo: `smtp.mail.yahoo.com`, puerto 587
- Office365: `smtp.office365.com`, puerto 587

## Cómo Usar 2FA

### Para Administradores

1. **Habilitar 2FA para un usuario:**
   - Ve a la página de Usuarios
   - Haz clic en "Editar" en el usuario deseado
   - Activa el interruptor "Habilitar 2FA"
   - Opcionalmente, configura un email específico para 2FA (si no se configura, usa el email principal)
   - Guarda los cambios

2. **El usuario al iniciar sesión:**
   - Ingresa su email y contraseña normalmente
   - Si tiene 2FA habilitado, verá una pantalla para ingresar el código de verificación
   - El código se envía automáticamente al email configurado
   - El código es válido por 10 minutos
   - Puede solicitar reenviar el código si es necesario

### Flujo de Autenticación

```
1. Usuario ingresa email y contraseña
   ↓
2. Sistema valida credenciales
   ↓
3. Si 2FA está habilitado:
   - Genera código de 6 dígitos
   - Envía email al usuario
   - Muestra pantalla de verificación
   ↓
4. Usuario ingresa código
   ↓
5. Sistema verifica código
   - Si es válido: permite acceso
   - Si es inválido/expirado: muestra error
```

## Cambios Realizados

### Base de Datos (Prisma)
- Se agregaron campos a la tabla `User`:
  - `twoFactorEnabled`: boolean (default: false)
  - `twoFactorEmail`: string? (email alternativo para 2FA)
  - `twoFactorCode`: string? (código temporal)
  - `twoFactorCodeExpires`: DateTime? (expiración del código)

### Archivos Nuevos
- `/src/lib/email.ts`: Funciones para envío de emails 2FA

### Archivos Modificados
- `/prisma/schema.prisma`: Schema actualizado con campos 2FA
- `/src/app/api/auth/route.ts`: Lógica de autenticación con 2FA
- `/src/components/prestaae/LoginPage.tsx`: UI de login con soporte 2FA
- `/src/components/prestaae/UsersPage.tsx`: UI para gestionar 2FA por usuario
- `/src/app/api/users/route.ts`: API para crear usuarios con 2FA
- `/src/app/api/users/[id]/route.ts`: API para actualizar configuración 2FA
- `/src/components/prestaae/LoansPage.tsx`: Exportación Excel con nombres de columnas

## Pruebas Locales

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Configura un usuario con 2FA:**
   - Inicia sesión como admin
   - Ve a Usuarios
   - Edita un usuario y habilita 2FA
   - Configura el email para 2FA

3. **Prueba el flujo:**
   - Cierra sesión
   - Intenta iniciar sesión con el usuario configurado
   - Verifica que llegue el email con el código
   - Ingresa el código y verifica el acceso

4. **Prueba los informes Excel:**
   - Ve a Préstamos
   - Haz clic en el botón de exportar Excel
   - Verifica que las columnas tengan nombres descriptivos

## Solución de Problemas

### El email no llega
- Verifica las credenciales SMTP en `.env`
- Revisa la carpeta de spam/correo no deseado
- Para Gmail, asegúrate de usar una "Contraseña de Aplicación"
- Verifica los logs del servidor para errores de envío

### Error "Código inválido o expirado"
- El código expira después de 10 minutos
- Solicita un nuevo código usando el botón "Reenviar Código"
- Verifica que estás ingresando el código más reciente

### Error de compilación
- Ejecuta `npm install` para asegurar que todas las dependencias estén instaladas
- Ejecuta `npx prisma db push --accept-data-loss` para actualizar la base de datos

## Seguridad

- Los códigos 2FA son de un solo uso
- Después de usar un código exitosamente, se elimina de la base de datos
- Los códigos expiran automáticamente después de 10 minutos
- La información sensible (contraseñas) nunca se incluye en las respuestas de la API

## Notas Importantes

⚠️ **IMPORTANTE**: El 2FA es opcional y debe ser habilitado manualmente por un administrador para cada usuario. Los usuarios sin 2FA habilitado pueden iniciar sesión normalmente con email y contraseña.

⚠️ **IMPORTANTE**: Asegúrate de configurar correctamente las variables de entorno SMTP antes de habilitar 2FA para los usuarios, de lo contrario no podrán recibir sus códigos de verificación.
