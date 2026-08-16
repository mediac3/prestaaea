import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const loan = await db.loan.findUnique({
      where: { id },
      include: {
        client: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(loan)
  } catch (error) {
    console.error('Error fetching loan:', error)
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
    const { amount, rate, term, paymentDay, amortization, status, notes } = body

    const existingLoan = await db.loan.findUnique({
      where: { id },
    })

    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    const loan = await db.loan.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(rate !== undefined && { rate: parseFloat(rate) }),
        ...(term !== undefined && { term: parseInt(term, 10) }),
        ...(paymentDay !== undefined && { paymentDay: parseInt(paymentDay, 10) }),
        ...(amortization !== undefined && { amortization }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: {
        client: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    })

    return NextResponse.json(loan)
  } catch (error) {
    console.error('Error updating loan:', error)
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

    const existingLoan = await db.loan.findUnique({
      where: { id },
      include: {
        _count: { select: { payments: true } },
      },
    })

    if (!existingLoan) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    if (existingLoan._count.payments > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un préstamo con pagos registrados' },
        { status: 409 }
      )
    }

    await db.loan.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Préstamo eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting loan:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
