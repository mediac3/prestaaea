import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { client: { name: { contains: search } } },
        { client: { cedula: { contains: search } } },
        { notes: { contains: search } },
      ]
    }

    const loans = await db.loan.findMany({
      where,
      include: {
        client: true,
        payments: {
          orderBy: { date: 'desc' },
        },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(loans)
  } catch (error) {
    console.error('Error fetching loans:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, amount, rate, term, startDate, paymentDay, amortization, notes } = body

    if (!clientId || !amount || !rate || !term || !startDate || !paymentDay) {
      return NextResponse.json(
        { error: 'Cliente, monto, tasa, plazo, fecha de inicio y día de pago son requeridos' },
        { status: 400 }
      )
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const loan = await db.loan.create({
      data: {
        clientId,
        amount: parseFloat(amount),
        rate: parseFloat(rate),
        term: parseInt(term, 10),
        startDate: new Date(startDate),
        paymentDay: parseInt(paymentDay, 10),
        amortization: amortization || 'interes_fijo',
        notes: notes || null,
        status: 'activo',
      },
      include: {
        client: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    })

    return NextResponse.json(loan, { status: 201 })
  } catch (error) {
    console.error('Error creating loan:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
