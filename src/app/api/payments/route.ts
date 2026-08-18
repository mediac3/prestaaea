import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit, getClientIp } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loanId, date, type, capitalAmount, interestPaymentAmount, notes, receipt, _audit } = body

    if (!loanId || !date || !type) {
      return NextResponse.json(
        { error: 'Préstamo, fecha y tipo de pago son requeridos' },
        { status: 400 }
      )
    }

    const loan = await db.loan.findUnique({
      where: { id: loanId },
      include: {
        client: true,
        payments: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    })

    if (!loan) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado' },
        { status: 404 }
      )
    }

    if (loan.status === 'pagado' || loan.status === 'cerrado') {
      return NextResponse.json(
        { error: 'No se pueden registrar pagos en un préstamo cerrado' },
        { status: 400 }
      )
    }

    const previousBalance =
      loan.payments.length > 0 ? loan.payments[0].newBalance : loan.amount

    let interestAmount = 0
    let capital = parseFloat(capitalAmount) || 0
    const interestPayment = parseFloat(interestPaymentAmount) || 0

    // Calcular intereses según el tipo de pago
    if (type === 'interes') {
      interestAmount = previousBalance * (loan.rate / 100)
      capital = 0
    } else if (type === 'interes_capital') {
      interestAmount = previousBalance * (loan.rate / 100)
      capital = parseFloat(capitalAmount) || 0
    } else if (type === 'capital') {
      interestAmount = 0
      capital = parseFloat(capitalAmount) || 0
    } else if (type === 'abono_intereses') {
      interestAmount = 0
      capital = 0
      // interestPayment es el monto del abono a intereses
    }

    const newBalance = previousBalance - capital

    const payment = await db.payment.create({
      data: {
        loanId,
        date: new Date(date),
        type,
        interestAmount,
        capitalAmount: capital,
        interestPayment,
        previousBalance,
        newBalance: Math.max(newBalance, 0),
        notes: notes || null,
        receipt: receipt || null,
      },
      include: {
        loan: {
          include: {
            client: true,
            payments: {
              orderBy: { date: 'desc' },
            },
          },
        },
      },
    })

    // Auto-close loan if balance reaches zero
    if (Math.max(newBalance, 0) <= 0) {
      await db.loan.update({
        where: { id: loanId },
        data: { status: 'pagado' },
      })
    }

    if (_audit) {
      await logAudit({
        userId: _audit.userId,
        userName: _audit.userName,
        userEmail: _audit.userEmail,
        action: 'REGISTER_PAYMENT',
        module: 'payments',
        details: {
          loanId,
          clientName: loan.client?.name,
          type,
          interestAmount,
          capitalAmount: capital,
          interestPayment,
          previousBalance,
          newBalance: Math.max(newBalance, 0),
          receipt,
        },
        ipAddress: getClientIp(request),
      })
    }

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
