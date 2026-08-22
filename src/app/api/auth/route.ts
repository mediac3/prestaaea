import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit, getClientIp } from '@/lib/audit'
import { sendTwoFactorCode, generateTwoFactorCode, verifyTwoFactorCode } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, twoFactorCode, userId } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Si el usuario tiene 2FA habilitado y no ha proporcionado el código
    if (user.twoFactorEnabled && !twoFactorCode) {
      // Generar y enviar código 2FA
      const code = generateTwoFactorCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
      
      await db.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: code,
          twoFactorCodeExpires: expiresAt,
        },
      });

      const emailToSend = user.twoFactorEmail || user.email;
      const sent = await sendTwoFactorCode(emailToSend, code, user.name);
      
      if (!sent) {
        return NextResponse.json(
          { error: 'Error al enviar el código de verificación' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        requiresTwoFactor: true,
        message: 'Código de verificación enviado',
        userId: user.id 
      });
    }

    // Si el usuario tiene 2FA habilitado y proporcionó el código, verificarlo
    if (user.twoFactorEnabled && twoFactorCode) {
      const isValid = await verifyTwoFactorCode(
        twoFactorCode,
        user.twoFactorCode,
        user.twoFactorCodeExpires
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Código de verificación inválido o expirado' },
          { status: 401 }
        );
      }

      // Limpiar el código después de usarlo
      await db.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: null,
          twoFactorCodeExpires: null,
        },
      });
    }

    const { password: _, twoFactorCode: __, twoFactorCodeExpires: ___, ...userWithoutPassword } = user

    await logAudit({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      action: 'LOGIN',
      module: 'auth',
      ipAddress: getClientIp(request),
    })

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
