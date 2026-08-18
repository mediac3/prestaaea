import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit, getClientIp } from '@/lib/audit'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { date, type, capitalAmount, interestPaymentAmount, notes, receipt, _audit } = body

    if (!date || !type) {
      return NextResponse.json(
        { error: 'Fecha y tipo de pago son requeridos' },
        { status: 400 }
      )
    }

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        loan: {
          include: {
            client: true,
            payments: {
              orderBy: { date: 'asc' },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    const loan = payment.loan
    const previousBalance = payment.previousBalance

    let interestAmount = 0
    let capital = parseFloat(capitalAmount) || 0
    const interestPayment = parseFloat(interestPaymentAmount) || 0

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
    }

    const newBalance = previousBalance - capital

    const updatedPayment = await db.payment.update({
      where: { id },
      data: {
        date: new Date(date),
        type,
        interestAmount,
        capitalAmount: capital,
        interestPayment,
        newBalance: Math.max(newBalance, 0),
        notes: notes || null,
        receipt: receipt || null,
      },
    })

    const allPayments = await db.payment.findMany({
      where: { loanId: loan.id },
      orderBy: { date: 'asc' },
    })

    const currentIndex = allPayments.findIndex(p => p.id === id)
    const subsequentPayments = allPayments.slice(currentIndex + 1)

    let runningBalance = updatedPayment.newBalance
    for (const p of subsequentPayments) {
      let pInterest = 0
      let pCapital = p.capitalAmount

      if (p.type === 'interes') {
        pInterest = runningBalance * (loan.rate / 100)
        pCapital = 0
      } else if (p.type === 'interes_capital') {
        pInterest = runningBalance * (loan.rate / 100)
      } else if (p.type === 'capital') {
        pInterest = 0
      } else if (p.type === 'abono_intereses') {
        pInterest = 0
        pCapital = 0
      }

      const pNewBalance = runningBalance - pCapital

      await db.payment.update({
        where: { id: p.id },
        data: {
          previousBalance: runningBalance,
          interestAmount: pInterest,
          capitalAmount: pCapital,
          newBalance: Math.max(pNewBalance, 0),
        },
      })

      runningBalance = pNewBalance
    }

    if (runningBalance <= 0) {
      await db.loan.update({
        where: { id: loan.id },
        data: { status: 'pagado' },
      })
    }

    if (_audit) {
      await logAudit({
        userId: _audit.userId,
        userName: _audit.userName,
        userEmail: _audit.userEmail,
        action: 'UPDATE_PAYMENT',
        module: 'payments',
        details: {
          paymentId: id,
          loanId: loan.id,
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

    return NextResponse.json({ payment: updatedPayment })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        loan: {
          include: {
            client: true,
            payments: {
              orderBy: { date: 'asc' },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    await db.payment.delete({
      where: { id },
    })

    const allPayments = await db.payment.findMany({
      where: { loanId: payment.loanId },
      orderBy: { date: 'asc' },
    })

    let runningBalance = payment.loan.amount
    for (const p of allPayments) {
      let pInterest = 0
      let pCapital = p.capitalAmount

      if (p.type === 'interes') {
        pInterest = runningBalance * (payment.loan.rate / 100)
        pCapital = 0
      } else if (p.type === 'interes_capital') {
        pInterest = runningBalance * (payment.loan.rate / 100)
      } else if (p.type === 'capital') {
        pInterest = 0
      } else if (p.type === 'abono_intereses') {
        pInterest = 0
        pCapital = 0
      }

      const pNewBalance = runningBalance - pCapital

      await db.payment.update({
        where: { id: p.id },
        data: {
          previousBalance: runningBalance,
          interestAmount: pInterest,
          capitalAmount: pCapital,
          newBalance: Math.max(pNewBalance, 0),
        },
      })

      runningBalance = pNewBalance
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
