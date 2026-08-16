import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { cedula: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    const clients = await db.client.findMany({
      where,
      include: {
        _count: { select: { loans: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, cedula, phone, address, notes, status } = body

    if (!name || !cedula || !phone) {
      return NextResponse.json(
        { error: 'Nombre, cédula y teléfono son requeridos' },
        { status: 400 }
      )
    }

    const existingClient = await db.client.findUnique({
      where: { cedula },
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con esa cédula' },
        { status: 409 }
      )
    }

    const client = await db.client.create({
      data: {
        name,
        cedula,
        phone,
        address: address || null,
        notes: notes || null,
        status: status || 'activo',
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
