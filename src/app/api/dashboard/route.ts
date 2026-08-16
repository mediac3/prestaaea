import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const now = new Date()

    const totalPrestadoResult = await db.loan.aggregate({
      _sum: { amount: true },
    })
    const totalPrestado = totalPrestadoResult._sum.amount || 0

    const interesesCobradosResult = await db.payment.aggregate({
      _sum: { interestAmount: true },
    })
    const interesesCobrados = interesesCobradosResult._sum.interestAmount || 0

    const clientesActivos = await db.client.count({
      where: { status: 'activo' },
    })

    const vencidosCount = await db.loan.count({
      where: { status: 'vencido' },
    })

    // Chart data
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const payments = await db.payment.findMany({
      where: {
        date: { gte: sixMonthsAgo },
        interestAmount: { gt: 0 },
      },
      select: { date: true, interestAmount: true },
    })

    const monthlyData: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = 0
    }
    for (const payment of payments) {
      const d = new Date(payment.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += payment.interestAmount
      }
    }

    const chartData = Object.entries(monthlyData).map(([month, intereses]) => ({
      month,
      intereses,
      desembolsos: 0,
    }))

    // Recent active loans
    const recentLoansRaw = await db.loan.findMany({
      where: { status: 'activo' },
      include: {
        client: { select: { name: true } },
        payments: { orderBy: { date: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const recentLoans = recentLoansRaw.map((l) => ({
      id: l.id,
      clientName: l.client.name,
      amount: l.amount,
      currentBalance: l.payments.length > 0 ? l.payments[0].newBalance : l.amount,
      paymentDay: l.paymentDay,
      status: l.status,
    }))

    // Alerts: active loans with payment day within 3 days
    const today = now.getDate()
    const activeLoans = await db.loan.findMany({
      where: { status: 'activo' },
      include: { client: { select: { name: true } } },
    })
    const alerts = activeLoans
      .filter((l) => {
        let daysUntil = l.paymentDay - today
        if (daysUntil < 0) daysUntil += 30
        return daysUntil <= 3
      })
      .map((l) => {
        let daysUntil = l.paymentDay - today
        if (daysUntil < 0) daysUntil += 30
        return {
          loanId: l.id,
          clientName: l.client.name,
          balance: l.amount,
          expectedInterest: l.amount * (l.rate / 100),
          paymentDay: l.paymentDay,
          daysUntil,
        }
      })

    return NextResponse.json({
      totalPrestado,
      interesesCobrados,
      clientesActivos,
      prestamosVencidos: { count: vencidosCount, totalAmount: 0 },
      chartData,
      recentLoans,
      alerts,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
