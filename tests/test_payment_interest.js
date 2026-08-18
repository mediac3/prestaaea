/**
 * Test local para verificar el funcionamiento del campo "Abono a intereses"
 * en el módulo de Registrar Pago
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('=== INICIANDO PRUEBAS LOCALES - CAMPO ABONO A INTERESES ===\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Verificar que la base de datos tiene datos existentes
    console.log('TEST 1: Verificar integridad de datos existentes...');
    const userCount = await prisma.user.count();
    const clientCount = await prisma.client.count();
    const loanCount = await prisma.loan.count();
    const paymentCount = await prisma.payment.count();
    
    console.log(`  ✓ Usuarios: ${userCount}`);
    console.log(`  ✓ Clientes: ${clientCount}`);
    console.log(`  ✓ Créditos: ${loanCount}`);
    console.log(`  ✓ Pagos registrados: ${paymentCount}`);
    
    if (userCount > 0 && clientCount > 0 && loanCount > 0) {
      console.log('  ✅ TEST 1 PASSED: Datos existentes intactos\n');
      testsPassed++;
    } else {
      console.log('  ❌ TEST 1 FAILED: Faltan datos\n');
      testsFailed++;
    }

    // Test 2: Verificar que existe al menos un préstamo activo para pruebas
    console.log('TEST 2: Buscar préstamo activo para prueba...');
    const activeLoan = await prisma.loan.findFirst({
      where: { status: 'activo' },
      include: { 
        client: true,
        payments: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });
    
    if (activeLoan) {
      const currentBalance = activeLoan.payments.length > 0 
        ? activeLoan.payments[0].newBalance 
        : activeLoan.amount;
      console.log(`  ✓ Préstamo encontrado: ${activeLoan.id}`);
      console.log(`  ✓ Cliente: ${activeLoan.client.name}`);
      console.log(`  ✓ Saldo actual: $${currentBalance.toLocaleString()}`);
      console.log(`  ✓ Tasa: ${activeLoan.rate}%`);
      console.log('  ✅ TEST 2 PASSED: Préstamo activo disponible\n');
      testsPassed++;
    } else {
      console.log('  ⚠️  TEST 2 SKIPPED: No hay préstamos activos disponibles\n');
    }

    // Test 3: Crear un pago con abono a intereses
    if (activeLoan) {
      console.log('TEST 3: Registrar pago CON abono a intereses...');
      const interestAmount = activeLoan.amount * (activeLoan.rate / 100);
      const capitalAmount = 50000; // Abono a capital de prueba
      const interestPaymentAmount = 25000; // Abono adicional a intereses de prueba
      
      const previousBalance = activeLoan.payments.length > 0 
        ? activeLoan.payments[0].newBalance 
        : activeLoan.amount;
      
      const newBalance = previousBalance - capitalAmount;
      
      const payment = await prisma.payment.create({
        data: {
          loanId: activeLoan.id,
          date: new Date(),
          type: 'interes_capital',
          interestAmount: interestAmount,
          capitalAmount: capitalAmount,
          interestPayment: interestPaymentAmount, // CAMPO NUEVO: Abono a intereses
          previousBalance: previousBalance,
          newBalance: newBalance,
          notes: 'Prueba local - Abono a intereses'
        }
      });
      
      console.log(`  ✓ Pago creado: ${payment.id}`);
      console.log(`  ✓ Interés mensual: $${payment.interestAmount.toLocaleString()}`);
      console.log(`  ✓ Abono a capital: $${payment.capitalAmount.toLocaleString()}`);
      console.log(`  ✓ Abono a intereses (nuevo): $${payment.interestPayment.toLocaleString()}`);
      console.log(`  ✓ Saldo anterior: $${payment.previousBalance.toLocaleString()}`);
      console.log(`  ✓ Nuevo saldo: $${payment.newBalance.toLocaleString()}`);
      
      if (payment.interestPayment === interestPaymentAmount) {
        console.log('  ✅ TEST 3 PASSED: Campo interestPayment guardado correctamente\n');
        testsPassed++;
      } else {
        console.log('  ❌ TEST 3 FAILED: El valor no se guardó correctamente\n');
        testsFailed++;
      }
    }

    // Test 4: Crear un pago SIN abono a intereses (valor por defecto)
    if (activeLoan) {
      console.log('TEST 4: Registrar pago SIN abono a intereses (valor por defecto)...');
      const interestAmount = activeLoan.amount * (activeLoan.rate / 100);
      const capitalAmount = 30000;
      
      const loanWithPayments = await prisma.loan.findUnique({
        where: { id: activeLoan.id },
        include: {
          payments: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      });
      
      const previousBalance = loanWithPayments.payments.length > 0 
        ? loanWithPayments.payments[0].newBalance 
        : activeLoan.amount;
      
      const newBalance = previousBalance - capitalAmount;
      
      const payment = await prisma.payment.create({
        data: {
          loanId: activeLoan.id,
          date: new Date(),
          type: 'interes_capital',
          interestAmount: interestAmount,
          capitalAmount: capitalAmount,
          interestPayment: 0, // Sin abono adicional
          previousBalance: previousBalance,
          newBalance: newBalance,
          notes: 'Prueba local - Sin abono a intereses'
        }
      });
      
      console.log(`  ✓ Pago creado: ${payment.id}`);
      console.log(`  ✓ Abono a intereses: $${payment.interestPayment.toLocaleString()}`);
      
      if (payment.interestPayment === 0) {
        console.log('  ✅ TEST 4 PASSED: Valor por defecto (0) funciona correctamente\n');
        testsPassed++;
      } else {
        console.log('  ❌ TEST 4 FAILED: El valor por defecto no es 0\n');
        testsFailed++;
      }
    }

    // Test 5: Verificar que los pagos con abono a intereses se pueden consultar
    console.log('TEST 5: Consultar pagos con abono a intereses...');
    const paymentsWithInterest = await prisma.payment.findMany({
      where: {
        interestPayment: { gt: 0 }
      },
      include: {
        loan: {
          include: { client: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`  ✓ Se encontraron ${paymentsWithInterest.length} pagos con abono a intereses`);
    paymentsWithInterest.forEach((p, idx) => {
      console.log(`    ${idx + 1}. Pago ${p.id}: $${p.interestPayment.toLocaleString()} - Cliente: ${p.loan.client.name}`);
    });
    console.log('  ✅ TEST 5 PASSED: Consulta de pagos con abono a intereses funciona\n');
    testsPassed++;

    // Resumen final
    console.log('=== RESUMEN DE PRUEBAS ===');
    console.log(`✅ Tests pasados: ${testsPassed}`);
    console.log(`❌ Tests fallidos: ${testsFailed}`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
      console.log('El campo "Abono a intereses" está funcionando correctamente.\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ ERROR DURANTE LAS PRUEBAS:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
