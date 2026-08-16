import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days') || '7'
    const days = parseInt(daysParam, 10)

    const now = new Date()
    const futureDate = new Date(now)
    futureDate.setDate(futureDate.getDate() + days)

    const activeLoans = await db.loan.findMany({
      where: {
        status: 'activo',
      },
      include: {
        client: true,
        payments: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    })

    const upcomingPayments = []

    for (const loan of activeLoans) {
      // Calculate the next expected payment date
      const lastPaymentDate =
        loan.payments.length > 0 ? new Date(loan.payments[0].date) : new Date(loan.startDate)

      let nextPaymentDate = new Date(lastPaymentDate)
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
      // Set to the loan's payment day
      nextPaymentDate.setDate(loan.paymentDay)

      // If the payment day hasn't occurred yet this month, use this month
      if (nextPaymentDate <= now) {
        nextPaymentDate = new Date(now.getFullYear(), now.getMonth(), loan.paymentDay)
        // If today is past the payment day this month, next is next month
        if (nextPaymentDate <= now) {
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
        }
      }

      // Check if next payment falls within the window
      if (nextPaymentDate >= now && nextPaymentDate <= futureDate) {
        const daysUntil = Math.ceil(
          (nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        const currentBalance =
          loan.payments.length > 0 ? loan.payments[0].newBalance : loan.amount

        upcomingPayments.push({
          loan,
          nextPaymentDate,
          daysUntil,
          currentBalance,
          expectedInterest: loan.amount * (loan.rate / 100),
        })
      }
    }

    // Sort by days until payment (ascending)
    upcomingPayments.sort((a, b) => a.daysUntil - b.daysUntil)

    const result = upcomingPayments.map((up) => ({
      loanId: up.loan.id,
      clientName: up.loan.client.name,
      balance: up.currentBalance,
      expectedInterest: up.expectedInterest,
      paymentDay: up.loan.paymentDay,
      nextPaymentDate: up.nextPaymentDate.toISOString(),
      daysUntil: up.daysUntil,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
