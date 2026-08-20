import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit, getClientIp } from '@/lib/audit'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent'

function getApiKey() {
  // The user sets GEMINI_API_KEY in .env
  return process.env.GEMINI_API_KEY || ''
}

async function buildSystemContext(): Promise<string> {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Get active loans with client info and payment history
  const activeLoans = await db.loan.findMany({
    where: { status: 'activo' },
    include: {
      client: true,
      payments: { orderBy: { date: 'desc' } },
    },
  })

  // Calculate upcoming payments (next 15 days)
  const upcomingPayments: { clientName: string; loanAmount: number; rate: number; paymentDay: number; monthlyInterest: number; phone: string; cedula: string }[] = []
  const pendingPayments: { clientName: string; loanAmount: number; currentBalance: number; rate: number; monthlyInterest: number; lastPaymentDate: string | null; phone: string }[] = []
  
  let totalActiveCapital = 0
  let totalMonthlyInterest = 0
  let totalCollected = 0
  let totalLoans = activeLoans.length
  let overdueCount = 0

  for (const loan of activeLoans) {
    const lastPayment = loan.payments[0]
    const currentBalance = lastPayment ? lastPayment.newBalance : loan.amount
    totalActiveCapital += currentBalance
    const monthlyInterest = loan.amount * (loan.rate / 100)
    totalMonthlyInterest += monthlyInterest

    // Calculate next payment date
    const now = new Date()
    let nextPaymentMonth = now.getMonth()
    let nextPaymentYear = now.getFullYear()
    if (now.getDate() > loan.paymentDay) {
      nextPaymentMonth++
      if (nextPaymentMonth > 11) { nextPaymentMonth = 0; nextPaymentYear++ }
    }
    const nextPaymentDate = new Date(nextPaymentYear, nextPaymentMonth, loan.paymentDay)
    const daysUntilPayment = Math.ceil((nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilPayment <= 15 && daysUntilPayment >= 0) {
      upcomingPayments.push({
        clientName: loan.client.name,
        loanAmount: loan.amount,
        rate: loan.rate,
        paymentDay: loan.paymentDay,
        monthlyInterest,
        phone: loan.client.phone,
        cedula: loan.client.cedula,
      })
    }

    // Check if payment is overdue (past payment day this month, no payment this month)
    if (daysUntilPayment < 0) {
      overdueCount++
      pendingPayments.push({
        clientName: loan.client.name,
        loanAmount: loan.amount,
        currentBalance,
        rate: loan.rate,
        monthlyInterest,
        lastPaymentDate: lastPayment ? lastPayment.date.toISOString().split('T')[0] : null,
        phone: loan.client.phone,
      })
    }

    // Total collected
    for (const p of loan.payments) {
      totalCollected += p.interestAmount + p.capitalAmount
    }
  }

  // Portfolio summary
  const paidLoans = await db.loan.count({ where: { status: 'pagado' } })
  const totalClients = await db.client.count()

  return `Eres un asistente de inteligencia artificial para PrestaAEA, una plataforma colombiana de gestión de créditos y préstamos. Tu objetivo es ayudar al administrador con información útil sobre su portafolio de préstamos.

CONTEXTO ACTUAL DEL PORTAFOLIO (Fecha: ${todayStr}):
- Total de clientes registrados: ${totalClients}
- Préstamos activos: ${totalLoans}
- Préstamos pagados (historial): ${paidLoans}
- Capital activo (saldo pendiente): $${new Intl.NumberFormat('es-CO').format(Math.round(totalActiveCapital))} COP
- Interés mensual esperado: $${new Intl.NumberFormat('es-CO').format(Math.round(totalMonthlyInterest))} COP
- Total recaudado (histórico): $${new Intl.NumberFormat('es-CO').format(Math.round(totalCollected))} COP
- Préstamos con pagos vencidos: ${overdueCount}

PRÓXIMOS COBROS (próximos 15 días):
${upcomingPayments.length > 0 
  ? upcomingPayments.map((p, i) => `${i + 1}. ${p.clientName} (CC: ${p.cedula}) - Interés mensual: $${new Intl.NumberFormat('es-CO').format(Math.round(p.monthlyInterest))} COP - Día de pago: ${p.paymentDay} - Tel: ${p.phone}`).join('\n')
  : 'No hay cobros programados en los próximos 15 días.'}

CLIENTES CON PAGOS PENDIENTES/VENCIDOS:
${pendingPayments.length > 0
  ? pendingPayments.map((p, i) => `${i + 1}. ${p.clientName} - Saldo: $${new Intl.NumberFormat('es-CO').format(Math.round(p.currentBalance))} COP - Interés mensual: $${new Intl.NumberFormat('es-CO').format(Math.round(p.monthlyInterest))} COP - Último pago: ${p.lastPaymentDate || 'Nunca'} - Tel: ${p.phone}`).join('\n')
  : 'No hay clientes con pagos vencidos. ¡Excelente!'}

INSTRUCCIONES:
- Responde SIEMPRE en español colombiano
- Sé conciso pero informativo
- Cuando menciones montos, usa formato COP con separadores de miles
- Si el usuario pregunta sobre algo que no está en el contexto, dile que no tienes esa información disponible
- Puedes dar recomendaciones sobre gestión de cobro
- Usa un tono profesional pero amigable
- Formatea las listas con viñetas para facilitar la lectura
- Si no hay API key configurada, responde que el administrador necesita configurar la API key de Google AI Studio`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, _audit } = body

    if (!message) {
      return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 })
    }

    // Log audit
    if (_audit) {
      await logAudit({
        userId: _audit.userId,
        userName: _audit.userName,
        userEmail: _audit.userEmail,
        action: 'AI_CHAT',
        module: 'ai',
        details: { message: message.substring(0, 200) },
        ipAddress: getClientIp(request),
      })
    }

    const apiKey = getApiKey()

    // If no API key, return a helpful fallback response using the system context
    if (!apiKey) {
      const systemContext = await buildSystemContext()
      // Simple rule-based fallback when no API key
      const lowerMsg = message.toLowerCase()
      let response = ''

      if (lowerMsg.includes('próximo') || lowerMsg.includes('cobro')) {
        const today = new Date()
        const activeLoans = await db.loan.findMany({
          where: { status: 'activo' },
          include: { client: true, payments: { orderBy: { date: 'desc' }, take: 1 } },
        })
        const upcoming: string[] = []
        for (const loan of activeLoans) {
          const now = new Date()
          let nm = now.getMonth(), ny = now.getFullYear()
          if (now.getDate() > loan.paymentDay) { nm++; if (nm > 11) { nm = 0; ny++ } }
          const npd = new Date(ny, nm, loan.paymentDay)
          const days = Math.ceil((npd.getTime() - now.getTime()) / (1000*60*60*24))
          if (days <= 15 && days >= 0) {
            const mi = loan.amount * (loan.rate / 100)
            upcoming.push(`• ${loan.client.name} (CC: ${loan.client.cedula}) — Interés: $${new Intl.NumberFormat('es-CO').format(Math.round(mi))} COP — Día de pago: ${loan.paymentDay} — Tel: ${loan.client.phone}`)
          }
        }
        response = upcoming.length > 0
          ? `📅 **Próximos cobros (15 días):**\n\n${upcoming.join('\n')}`
          : 'No hay cobros programados en los próximos 15 días.'
      } else if (lowerMsg.includes('pendiente') || lowerMsg.includes('mora') || lowerMsg.includes('vencido')) {
        const activeLoans = await db.loan.findMany({
          where: { status: 'activo' },
          include: { client: true, payments: { orderBy: { date: 'desc' }, take: 1 } },
        })
        const overdue: string[] = []
        for (const loan of activeLoans) {
          const now = new Date()
          let nm = now.getMonth(), ny = now.getFullYear()
          if (now.getDate() > loan.paymentDay) { nm++; if (nm > 11) { nm = 0; ny++ } }
          const npd = new Date(ny, nm, loan.paymentDay)
          const days = Math.ceil((npd.getTime() - now.getTime()) / (1000*60*60*24))
          if (days < 0) {
            const last = loan.payments[0]
            const cb = last ? last.newBalance : loan.amount
            const mi = loan.amount * (loan.rate / 100)
            overdue.push(`• ${loan.client.name} — Saldo: $${new Intl.NumberFormat('es-CO').format(Math.round(cb))} COP — Interés mensual: $${new Intl.NumberFormat('es-CO').format(Math.round(mi))} COP — Último pago: ${last ? last.date.toISOString().split('T')[0] : 'Nunca'} — Tel: ${loan.client.phone}`)
          }
        }
        response = overdue.length > 0
          ? `⚠️ **Clientes con pagos vencidos:**\n\n${overdue.join('\n')}`
          : '¡Excelente! No hay clientes con pagos vencidos actualmente.'
      } else if (lowerMsg.includes('resumen') || lowerMsg.includes('portafolio') || lowerMsg.includes('estado')) {
        const activeLoans = await db.loan.findMany({
          where: { status: 'activo' },
          include: { payments: true, client: true },
        })
        let totalCapital = 0, totalInterest = 0, totalCollected = 0
        for (const l of activeLoans) {
          const last = l.payments.sort((a, b) => b.date.getTime() - a.date.getTime())[0]
          totalCapital += last ? last.newBalance : l.amount
          totalInterest += l.amount * (l.rate / 100)
          for (const p of l.payments) totalCollected += p.interestAmount + p.capitalAmount
        }
        const paidLoans = await db.loan.count({ where: { status: 'pagado' } })
        const totalClients = await db.client.count()
        response = `📊 **Resumen del Portafolio:**\n\n• Clientes registrados: ${totalClients}\n• Préstamos activos: ${activeLoans.length}\n• Préstamos pagados: ${paidLoans}\n• Capital activo: $${new Intl.NumberFormat('es-CO').format(Math.round(totalCapital))} COP\n• Interés mensual esperado: $${new Intl.NumberFormat('es-CO').format(Math.round(totalInterest))} COP\n• Total recaudado: $${new Intl.NumberFormat('es-CO').format(Math.round(totalCollected))} COP`
      } else if (lowerMsg.includes('moroso')) {
        const morosos = await db.client.findMany({ where: { status: 'moroso' }, include: { _count: { select: { loans: true } } } })
        response = morosos.length > 0
          ? `🔴 **Clientes en estado moroso:**\n\n${morosos.map(c => `• ${c.name} (CC: ${c.cedula}) — Préstamos: ${c._count.loans}`).join('\n')}`
          : 'No hay clientes marcados como morosos en el sistema.'
      } else {
        response = 'Puedo ayudarte con información sobre: próximos cobros, pagos pendientes/vencidos, resumen del portafolio, y clientes morosos. También puedes configurar una API key de Google AI Studio (GEMINI_API_KEY en .env) para obtener respuestas más inteligentes y conversacionales. ¿Qué necesitas saber?'
      }

      return NextResponse.json({ response })
    }

    // With API key: use Gemini
    const systemContext = await buildSystemContext()

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemContext }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error:', errText)
      return NextResponse.json(
        { error: 'Error al comunicarse con el servicio de IA. Verifica la API key.' },
        { status: 502 }
      )
    }

    const geminiData = await geminiResponse.json()
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No se obtuvo respuesta del servicio de IA.'

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
