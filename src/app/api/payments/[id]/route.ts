import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit, getClientIp } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params;
    const body = await request.json()
    const { date, type, capitalAmount, interestPaymentAmount, receipt, notes, _audit } = body

    if (!date || !type) {
      return NextResponse.json(
        { error: 'Fecha y tipo de pago son requeridos' },
        { status: 400 }
      )
    }

    const existingPayment = await db.payment.findUnique({
      where: { id: paymentId },
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

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    const loan = existingPayment.loan
    const allPayments = loan.payments

    // Find index of the payment being edited
    const paymentIndex = allPayments.findIndex(p => p.id === paymentId)
    if (paymentIndex === -1) {
      return NextResponse.json(
        { error: 'Pago no encontrado en la lista del préstamo' },
        { status: 404 }
      )
    }

    // Get previous balance (before this payment)
    const previousBalance = paymentIndex > 0 
      ? allPayments[paymentIndex - 1].newBalance 
      : loan.amount

    let interestAmount = 0
    let capital = parseFloat(capitalAmount) || 0
    const interestPayment = parseFloat(interestPaymentAmount) || 0

    if (type === 'interes') {
      interestAmount = loan.amount * (loan.rate / 100)
      capital = 0
    } else if (type === 'interes_capital') {
      interestAmount = loan.amount * (loan.rate / 100)
      capital = parseFloat(capitalAmount) || 0
    } else if (type === 'capital') {
      interestAmount = 0
      capital = parseFloat(capitalAmount) || 0
    } else if (type === 'abono_intereses') {
      interestAmount = 0
      capital = 0
    }

    const newBalance = previousBalance - capital

    // Update the payment
    // Crear objeto de pago (con receipt solo si existe en el schema)
    const updateData: any = {
      date: new Date(date),
      type,
      interestAmount,
      capitalAmount: capital,
      interestPayment,
      previousBalance,
      newBalance: Math.max(newBalance, 0),
      notes: notes || null,
    }

    // Agregar receipt solo si se proporcionó (compatibilidad hacia atrás)
    if (receipt !== undefined && receipt !== null) {
      updateData.receipt = receipt
    }

    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: updateData,
    })

    // Recalculate all subsequent payments
    let runningBalance = Math.max(newBalance, 0)
    const subsequentPayments = allPayments.slice(paymentIndex + 1)
    
    for (const payment of subsequentPayments) {
      let subInterestAmount = 0
      let subCapital = payment.capitalAmount
      const subInterestPayment = payment.interestPayment

      if (payment.type === 'interes') {
        subInterestAmount = loan.amount * (loan.rate / 100)
        subCapital = 0
      } else if (payment.type === 'interes_capital') {
        subInterestAmount = loan.amount * (loan.rate / 100)
      } else if (payment.type === 'capital') {
        subInterestAmount = 0
      } else if (payment.type === 'abono_intereses') {
        subInterestAmount = 0
        subCapital = 0
      }

      const subNewBalance = runningBalance - subCapital

      await db.payment.update({
        where: { id: payment.id },
        data: {
          previousBalance: runningBalance,
          newBalance: Math.max(subNewBalance, 0),
        },
      })

      runningBalance = Math.max(subNewBalance, 0)
    }

    // Check if loan should be closed
    const lastPayment = await db.payment.findFirst({
      where: { loanId: loan.id },
      orderBy: { date: 'desc' },
    })

    if (lastPayment && Math.max(lastPayment.newBalance, 0) <= 0) {
      await db.loan.update({
        where: { id: loan.id },
        data: { status: 'pagado' },
      })
    } else if (lastPayment && Math.max(lastPayment.newBalance, 0) > 0) {
      await db.loan.update({
        where: { id: loan.id },
        data: { status: 'activo' },
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
          paymentId,
          loanId: loan.id,
          clientName: loan.client?.name,
          type,
          interestAmount,
          capitalAmount: capital,
          interestPayment,
          receipt,
          previousBalance,
          newBalance: Math.max(newBalance, 0),
        },
        ipAddress: getClientIp(request),
      })
    }

    return NextResponse.json({ payment: updatedPayment }, { status: 200 })
  } catch (error) {
    console.error('Error updating payment:', error)
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
    const { id: paymentId } = await params;

    const existingPayment = await db.payment.findUnique({
      where: { id: paymentId },
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

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    const loan = existingPayment.loan
    const allPayments = loan.payments

    // Find index of the payment being deleted
    const paymentIndex = allPayments.findIndex(p => p.id === paymentId)
    if (paymentIndex === -1) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Delete the payment
    await db.payment.delete({
      where: { id: paymentId },
    })

    // Recalculate all subsequent payments
    const subsequentPayments = allPayments.filter(p => p.id !== paymentId)
    
    for (let i = 0; i < subsequentPayments.length; i++) {
      const payment = subsequentPayments[i]
      let subInterestAmount = 0
      let subCapital = payment.capitalAmount

      if (payment.type === 'interes') {
        subInterestAmount = loan.amount * (loan.rate / 100)
        subCapital = 0
      } else if (payment.type === 'interes_capital') {
        subInterestAmount = loan.amount * (loan.rate / 100)
      } else if (payment.type === 'capital') {
        subInterestAmount = 0
      } else if (payment.type === 'abono_intereses') {
        subInterestAmount = 0
        subCapital = 0
      }

      const previousBalance = i > 0 
        ? subsequentPayments[i - 1].newBalance 
        : loan.amount

      const subNewBalance = previousBalance - subCapital

      await db.payment.update({
        where: { id: payment.id },
        data: {
          previousBalance,
          newBalance: Math.max(subNewBalance, 0),
        },
      })
    }

    // Update loan status if needed
    const lastPayment = await db.payment.findFirst({
      where: { loanId: loan.id },
      orderBy: { date: 'desc' },
    })

    if (lastPayment && Math.max(lastPayment.newBalance, 0) <= 0) {
      await db.loan.update({
        where: { id: loan.id },
        data: { status: 'pagado' },
      })
    } else {
      await db.loan.update({
        where: { id: loan.id },
        data: { status: 'activo' },
      })
    }

    const _audit = await request.json().catch(() => null)
    if (_audit && _audit.userId) {
      await logAudit({
        userId: _audit.userId,
        userName: _audit.userName,
        userEmail: _audit.userEmail,
        action: 'DELETE_PAYMENT',
        module: 'payments',
        details: {
          paymentId,
          loanId: loan.id,
          clientName: loan.client?.name,
        },
        ipAddress: getClientIp(request),
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
