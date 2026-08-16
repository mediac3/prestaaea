import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit, getClientIp } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const client = await db.client.findUnique({
      where: { id },
      include: {
        loans: {
          include: {
            payments: {
              orderBy: { date: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { loans: true } },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, cedula, phone, address, notes, status, _audit } = body

    const existingClient = await db.client.findUnique({
      where: { id },
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    if (cedula && cedula !== existingClient.cedula) {
      const duplicateCedula = await db.client.findUnique({
        where: { cedula },
      })
      if (duplicateCedula) {
        return NextResponse.json(
          { error: 'Ya existe un cliente con esa cédula' },
          { status: 409 }
        )
      }
    }

    const client = await db.client.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(cedula !== undefined && { cedula }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address: address || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(status !== undefined && { status }),
      },
    })

    if (_audit) {
      await logAudit({
        userId: _audit.userId,
        userName: _audit.userName,
        userEmail: _audit.userEmail,
        action: 'UPDATE_CLIENT',
        module: 'clients',
        details: { clientId: id, clientName: existingClient.name, changes: { name, cedula, phone, status } },
        ipAddress: getClientIp(request),
      })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const client = await db.client.findUnique({
      where: { id },
      include: {
        _count: { select: { loans: true } },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    if (client._count.loans > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente con préstamos activos' },
        { status: 409 }
      )
    }

    const auditHeader = request.headers.get('x-audit')
    let auditData: Record<string, string> | null = null
    if (auditHeader) {
      try { auditData = JSON.parse(auditHeader) } catch { /* ignore */ }
    }

    await db.client.delete({
      where: { id },
    })

    if (auditData) {
      await logAudit({
        userId: auditData.userId || 'unknown',
        userName: auditData.userName || 'Unknown',
        userEmail: auditData.userEmail || '',
        action: 'DELETE_CLIENT',
        module: 'clients',
        details: { clientId: id, clientName: client.name, cedula: client.cedula },
        ipAddress: getClientIp(request),
      })
    }

    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
