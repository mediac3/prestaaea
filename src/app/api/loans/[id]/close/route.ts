import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const loan = await db.loan.findUnique({
      where: { id },
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    if (loan.status === 'pagado' || loan.status === 'cerrado') {
      return NextResponse.json(
        { error: 'Este préstamo ya está cerrado' },
        { status: 400 }
      )
    }

    const updatedLoan = await db.loan.update({
      where: { id },
      data: { status: 'pagado' },
      include: {
        client: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    })

    return NextResponse.json({ loan: updatedLoan })
  } catch (error) {
    console.error('Error closing loan:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
