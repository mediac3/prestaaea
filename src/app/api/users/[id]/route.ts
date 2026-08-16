import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit, getClientIp } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, role, password, _audit } = body

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (email && email !== existing.email) {
      const dup = await db.user.findUnique({ where: { email } })
      if (dup) {
        return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (password && password.trim()) updateData.password = password

    const user = await db.user.update({
      where: { id },
      data: updateData,
    })

    if (_audit) {
      await logAudit({
        userId: _audit.userId,
        userName: _audit.userName,
        userEmail: _audit.userEmail,
        action: 'UPDATE_USER',
        module: 'users',
        details: { targetUserId: id, targetUserName: existing.name, changes: { name, email, role } },
        ipAddress: getClientIp(request),
      })
    }

    const { password: _, ...userWithoutPw } = user
    return NextResponse.json(userWithoutPw)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let _audit: Record<string, string> | null = null
    try {
      const body = await request.json()
      _audit = body?._audit || null
    } catch { /* no body */ }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    await db.user.delete({ where: { id } })

    if (_audit) {
      await logAudit({
        userId: _audit.userId || 'unknown',
        userName: _audit.userName || 'Unknown',
        userEmail: _audit.userEmail || '',
        action: 'DELETE_USER',
        module: 'users',
        details: { deletedUserId: id, deletedUserName: existing.name, deletedEmail: existing.email },
        ipAddress: getClientIp(request),
      })
    }

    return NextResponse.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
