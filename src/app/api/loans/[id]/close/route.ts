import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit, getClientIp } from '@/lib/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { _audit } = body

    const loan = await db.loan.findUnique({
      where: { id },
      include: { client: true },
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

    if (_audit) {
      await logAudit({
        userId: _audit.userId,
        userName: _audit.userName,
        userEmail: _audit.userEmail,
        action: 'CLOSE_LOAN',
        module: 'loans',
        details: { loanId: id, clientName: loan.client?.name, amount: loan.amount },
        ipAddress: getClientIp(request),
      })
    }

    return NextResponse.json({ loan: updatedLoan })
  } catch (error) {
    console.error('Error closing loan:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
