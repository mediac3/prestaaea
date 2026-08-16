import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.payment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.client.deleteMany();
  await prisma.creditProduct.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@prestame.com',
      password: '1038796568',
      name: 'Administrador',
      role: 'admin',
    },
  });
  const demo = await prisma.user.create({
    data: {
      email: 'demo@prestame.com',
      password: 'demo',
      name: 'Demo User',
      role: 'user',
    },
  });

  // Create credit products
  await prisma.creditProduct.createMany({
    data: [
      { name: 'Microcrédito', baseRate: 2.5, maxTerm: 12, maxAmount: 2000000, requirements: 'Fiador solidario' },
      { name: 'Consumo', baseRate: 1.8, maxTerm: 36, maxAmount: 10000000, requirements: 'Comprobación de ingresos' },
      { name: 'Comercial', baseRate: 1.5, maxTerm: 48, maxAmount: 50000000, requirements: 'Estados financieros' },
      { name: 'Vivienda', baseRate: 1.2, maxTerm: 120, maxAmount: 200000000, requirements: 'Garantía hipotecaria' },
    ],
  });

  // Create clients
  const clientNames = [
    { name: 'María González', cedula: '1098765432', phone: '3166019544', address: 'Calle 10 #5-23, Bogotá' },
    { name: 'Eduardo Rodríguez', cedula: '1037784901', phone: '3158876543', address: 'Carrera 7 #45-12, Medellín' },
    { name: 'Carlos Andrés Martínez', cedula: '1001234567', phone: '3145567890', address: 'Av. 6 #23-45, Cali' },
    { name: 'Diana Patricia López', cedula: '1019876543', phone: '3123456789', address: 'Calle 15 #8-90, Barranquilla' },
    { name: 'Juan Camilo Ramírez', cedula: '1045678901', phone: '3187654321', address: 'Diag. 50 #12-34, Bucaramanga' },
    { name: 'Ana Sofía Hernández', cedula: '1009876543', phone: '3134567890', address: 'Calle 22 #7-56, Pereira' },
    { name: 'Roberto Díaz', cedula: '1054321678', phone: '3176543210', address: 'Carrera 10 #30-78, Cartagena' },
    { name: 'Laura Valentina Torres', cedula: '1012345678', phone: '3112345678', address: 'Calle 5 #15-23, Manizales' },
    { name: 'Andrés Felipe Castro', cedula: '1067890123', phone: '3167890123', address: 'Av. El Dorado #90-12, Bogotá' },
    { name: 'Camila Buendía', cedula: '1023456789', phone: '3145678901', address: 'Carrera 15 #20-45, Medellín' },
    { name: 'Diego Fernando Moreno', cedula: '1078901234', phone: '3189012345', address: 'Calle 30 #5-67, Cali' },
    { name: 'Valentina Duque', cedula: '1034567890', phone: '3126789012', address: 'Av. Boyacá #60-89, Bogotá' },
    { name: 'Santiago Giraldo', cedula: '1089012345', phone: '3150123456', address: 'Calle 8 #25-34, Envigado' },
    { name: 'Isabella Restrepo', cedula: '1045678912', phone: '3171234567', address: 'Carrera 20 #10-56, Rionegro' },
    { name: 'Sebastián Ospina', cedula: '1090123456', phone: '3112345670', address: 'Calle 12 #3-78, Itagüí' },
    { name: 'Mariana Álvarez', cedula: '1012345680', phone: '3135678901', address: 'Av. 68 #45-12, Bogotá' },
    { name: 'Felipe Mejía', cedula: '1056789023', phone: '3168901234', address: 'Carrera 5 #18-90, Ibague' },
    { name: 'Daniela Cardona', cedula: '1067890134', phone: '3180123456', address: 'Calle 40 #8-23, Villavicencio' },
    { name: 'Jorge Enrique Peña', cedula: '1078901245', phone: '3123456701', address: 'Diag. 75 #15-67, Barranquilla' },
    { name: 'Natalia Gómez', cedula: '1089012356', phone: '3156789012', address: 'Calle 25 #10-45, Cúcuta' },
    { name: 'Ricardo Arango', cedula: '1090123467', phone: '3179012345', address: 'Carrera 12 #22-34, Pasto' },
    { name: 'Paola Zapata', cedula: '1001234580', phone: '3181234567', address: 'Av. 3 #50-78, Armenia' },
    { name: 'Gustavo Adolfo Ríos', cedula: '1012345691', phone: '3114567890', address: 'Calle 18 #6-12, Neiva' },
    { name: 'Carolina Montoya', cedula: '1023456802', phone: '3137890123', address: 'Carrera 25 #30-45, Popayán' },
    { name: 'Mauricio Vargas', cedula: '1034567913', phone: '3160123456', address: 'Calle 7 #40-89, Montería' },
    { name: 'Lucía Fernández', cedula: '1045678024', phone: '3173456789', address: 'Av. 1 #15-67, Sincelejo' },
    { name: 'David Alejandro Suárez', cedula: '1056789135', phone: '3186789012', address: 'Calle 50 #20-34, Valledupar' },
    { name: 'Alejandra Morales', cedula: '1067890246', phone: '3129012345', address: 'Carrera 30 #5-78, Florencia' },
    { name: 'Cristian Camacho', cedula: '1078901357', phone: '3152345678', address: 'Calle 9 #35-12, Tunja' },
    { name: 'Juliana Soto', cedula: '1089012468', phone: '3165678901', address: 'Av. 4 #45-56, Pereira' },
    { name: 'Mateo Henao', cedula: '1090123579', phone: '3178901234', address: 'Calle 14 #55-89, Manizales' },
    { name: 'Andrea Pardo', cedula: '1001234691', phone: '3181234580', address: 'Carrera 8 #60-23, Bucaramanga' },
    { name: 'Sergio Londoño', cedula: '1012345702', phone: '3114567901', address: 'Calle 20 #70-45, Pereira' },
    { name: 'María José Salazar', cedula: '1023456813', phone: '3137890234', address: 'Av. 7 #25-67, Santa Marta' },
    { name: 'Esteban Gutiérrez', cedula: '1034567924', phone: '3160123567', address: 'Calle 28 #10-89, Cartagena' },
    { name: 'Viviana Orozco', cedula: '1045678035', phone: '3173456890', address: 'Carrera 18 #40-12, Medellín' },
    { name: 'Nicolás Betancur', cedula: '1056789146', phone: '3186789123', address: 'Calle 35 #5-34, Envigado' },
    { name: 'Lorena Mejía', cedula: '1009876520', phone: '3115678901', address: 'Carrera 22 #8-56, Soacha' },
    { name: 'Catalina Herrera', cedula: '1010987632', phone: '3138901234', address: 'Av. 19 #30-12, Soledad' },
    { name: 'Óscar Julián Pineda', cedula: '1021098743', phone: '3160234567', address: 'Calle 45 #15-78, Villamaria' },
  ];

  const clients = [];
  for (const c of clientNames) {
    const client = await prisma.client.create({
      data: { ...c, status: 'activo' },
    });
    clients.push(client);
  }

  // Create loans
  const loanData = [
    { clientIdx: 0, amount: 1500000, rate: 10, term: 3, startDate: '2026-05-15', paymentDay: 1, status: 'activo', notes: '' },
    { clientIdx: 1, amount: 2500000, rate: 8, term: 6, startDate: '2026-06-01', paymentDay: 7, status: 'activo', notes: '' },
    { clientIdx: 2, amount: 500000, rate: 10, term: 2, startDate: '2026-05-15', paymentDay: 15, status: 'activo', notes: 'Se le presta a la hermana' },
    { clientIdx: 3, amount: 3000000, rate: 7, term: 12, startDate: '2026-03-01', paymentDay: 9, status: 'activo', notes: '' },
    { clientIdx: 4, amount: 800000, rate: 10, term: 3, startDate: '2026-06-10', paymentDay: 11, status: 'activo', notes: '' },
    { clientIdx: 5, amount: 200000, rate: 8, term: 2, startDate: '2026-07-01', paymentDay: 13, status: 'activo', notes: '' },
    { clientIdx: 6, amount: 1000000, rate: 7, term: 6, startDate: '2026-04-15', paymentDay: 20, status: 'activo', notes: '' },
    { clientIdx: 7, amount: 150000, rate: 10, term: 1, startDate: '2026-07-15', paymentDay: 15, status: 'activo', notes: '' },
    { clientIdx: 8, amount: 2000000, rate: 6, term: 12, startDate: '2026-02-01', paymentDay: 5, status: 'activo', notes: '' },
    { clientIdx: 9, amount: 400000, rate: 10, term: 2, startDate: '2026-06-20', paymentDay: 20, status: 'activo', notes: '' },
    { clientIdx: 10, amount: 3500000, rate: 5, term: 18, startDate: '2026-01-15', paymentDay: 10, status: 'activo', notes: '' },
    { clientIdx: 11, amount: 4500000, rate: 7, term: 12, startDate: '2026-03-01', paymentDay: 13, status: 'activo', notes: '' },
    { clientIdx: 12, amount: 600000, rate: 10, term: 3, startDate: '2026-05-01', paymentDay: 25, status: 'activo', notes: '' },
    { clientIdx: 13, amount: 1800000, rate: 8, term: 6, startDate: '2026-04-01', paymentDay: 1, status: 'activo', notes: '' },
    { clientIdx: 14, amount: 750000, rate: 10, term: 2, startDate: '2026-06-15', paymentDay: 15, status: 'activo', notes: '' },
    { clientIdx: 15, amount: 1200000, rate: 7, term: 6, startDate: '2026-05-10', paymentDay: 10, status: 'activo', notes: '' },
    { clientIdx: 16, amount: 900000, rate: 8, term: 4, startDate: '2026-06-01', paymentDay: 5, status: 'activo', notes: '' },
    { clientIdx: 17, amount: 500000, rate: 10, term: 2, startDate: '2026-07-01', paymentDay: 1, status: 'activo', notes: '' },
    { clientIdx: 18, amount: 2200000, rate: 6, term: 12, startDate: '2026-03-15', paymentDay: 15, status: 'activo', notes: '' },
    { clientIdx: 19, amount: 300000, rate: 10, term: 2, startDate: '2026-06-20', paymentDay: 20, status: 'activo', notes: '' },
    { clientIdx: 20, amount: 1000000, rate: 7, term: 6, startDate: '2026-05-01', paymentDay: 1, status: 'pagado', notes: '' },
    { clientIdx: 21, amount: 1500000, rate: 8, term: 4, startDate: '2026-01-15', paymentDay: 15, status: 'pagado', notes: '' },
    { clientIdx: 22, amount: 800000, rate: 10, term: 3, startDate: '2026-02-01', paymentDay: 1, status: 'pagado', notes: '' },
    { clientIdx: 23, amount: 2500000, rate: 6, term: 12, startDate: '2026-01-01', paymentDay: 10, status: 'pagado', notes: '' },
    { clientIdx: 24, amount: 450000, rate: 10, term: 2, startDate: '2026-03-15', paymentDay: 15, status: 'pagado', notes: '' },
    { clientIdx: 25, amount: 1200000, rate: 7, term: 6, startDate: '2026-02-15', paymentDay: 20, status: 'pagado', notes: '' },
    { clientIdx: 26, amount: 3500000, rate: 5, term: 18, startDate: '2026-01-01', paymentDay: 5, status: 'pagado', notes: '' },
    { clientIdx: 27, amount: 600000, rate: 10, term: 3, startDate: '2026-03-01', paymentDay: 1, status: 'pagado', notes: '' },
    { clientIdx: 28, amount: 1800000, rate: 8, term: 6, startDate: '2026-02-01', paymentDay: 10, status: 'pagado', notes: '' },
    { clientIdx: 29, amount: 750000, rate: 10, term: 2, startDate: '2026-04-01', paymentDay: 1, status: 'pagado', notes: '' },
    { clientIdx: 30, amount: 900000, rate: 7, term: 6, startDate: '2026-02-15', paymentDay: 15, status: 'pagado', notes: '' },
    { clientIdx: 31, amount: 2000000, rate: 6, term: 12, startDate: '2026-01-15', paymentDay: 20, status: 'pagado', notes: '' },
    { clientIdx: 32, amount: 500000, rate: 10, term: 3, startDate: '2026-03-15', paymentDay: 1, status: 'pagado', notes: '' },
    { clientIdx: 33, amount: 3000000, rate: 5, term: 18, startDate: '2026-01-01', paymentDay: 10, status: 'pagado', notes: '' },
    { clientIdx: 34, amount: 150000, rate: 10, term: 1, startDate: '2026-04-15', paymentDay: 15, status: 'pagado', notes: '' },
    { clientIdx: 35, amount: 400000, rate: 8, term: 2, startDate: '2026-04-01', paymentDay: 1, status: 'pagado', notes: '' },
    { clientIdx: 36, amount: 1000000, rate: 7, term: 6, startDate: '2026-02-01', paymentDay: 15, status: 'pagado', notes: '' },
    { clientIdx: 37, amount: 2200000, rate: 6, term: 12, startDate: '2026-01-15', paymentDay: 5, status: 'pagado', notes: '' },
    { clientIdx: 38, amount: 650000, rate: 10, term: 3, startDate: '2026-03-01', paymentDay: 1, status: 'pagado', notes: '' },
    { clientIdx: 39, amount: 1100000, rate: 8, term: 4, startDate: '2026-02-15', paymentDay: 20, status: 'pagado', notes: '' },
  ];

  const loans = [];
  for (const ld of loanData) {
    const loan = await prisma.loan.create({
      data: {
        clientId: clients[ld.clientIdx].id,
        amount: ld.amount,
        rate: ld.rate,
        term: ld.term,
        startDate: new Date(ld.startDate),
        paymentDay: ld.paymentDay,
        status: ld.status,
        notes: ld.notes,
        amortization: 'interes_fijo',
      },
    });
    loans.push(loan);
  }

  // Create payments for active loans (some with history)
  // Loan 0: María González $1,500,000 10% - 2 interest payments made, balance still $1,500,000 (interest only)
  await prisma.payment.createMany({
    data: [
      { loanId: loans[0].id, date: new Date('2026-06-17'), type: 'interes', interestAmount: 150000, capitalAmount: 0, previousBalance: 1500000, newBalance: 1500000 },
      { loanId: loans[0].id, date: new Date('2026-07-22'), type: 'interes', interestAmount: 150000, capitalAmount: 0, previousBalance: 1500000, newBalance: 1500000 },
    ],
  });

  // Loan 1: Eduardo Rodríguez $2,500,000 8% - 1 payment
  await prisma.payment.create({
    data: { loanId: loans[1].id, date: new Date('2026-07-07'), type: 'interes', interestAmount: 200000, capitalAmount: 0, previousBalance: 2500000, newBalance: 2500000 },
  });

  // Loan 2: Carlos Martínez $500,000 10% - 2 payments
  await prisma.payment.createMany({
    data: [
      { loanId: loans[2].id, date: new Date('2026-06-17'), type: 'interes', interestAmount: 50000, capitalAmount: 0, previousBalance: 500000, newBalance: 500000 },
      { loanId: loans[2].id, date: new Date('2026-07-22'), type: 'interes', interestAmount: 50000, capitalAmount: 0, previousBalance: 500000, newBalance: 500000 },
    ],
  });

  // Loan 3: Diana López $3,000,000 7% - 4 payments
  await prisma.payment.createMany({
    data: [
      { loanId: loans[3].id, date: new Date('2026-04-09'), type: 'interes', interestAmount: 210000, capitalAmount: 0, previousBalance: 3000000, newBalance: 3000000 },
      { loanId: loans[3].id, date: new Date('2026-05-09'), type: 'interes', interestAmount: 210000, capitalAmount: 0, previousBalance: 3000000, newBalance: 3000000 },
      { loanId: loans[3].id, date: new Date('2026-06-09'), type: 'interes', interestAmount: 210000, capitalAmount: 0, previousBalance: 3000000, newBalance: 3000000 },
      { loanId: loans[3].id, date: new Date('2026-07-09'), type: 'interes', interestAmount: 210000, capitalAmount: 0, previousBalance: 3000000, newBalance: 3000000 },
    ],
  });

  // Loan 4: Juan Camilo $800,000 10% - 1 payment
  await prisma.payment.create({
    data: { loanId: loans[4].id, date: new Date('2026-07-11'), type: 'interes', interestAmount: 80000, capitalAmount: 0, previousBalance: 800000, newBalance: 800000 },
  });

  // Loan 6: Roberto Díaz $1,000,000 7% - 3 payments
  await prisma.payment.createMany({
    data: [
      { loanId: loans[6].id, date: new Date('2026-05-20'), type: 'interes', interestAmount: 70000, capitalAmount: 0, previousBalance: 1000000, newBalance: 1000000 },
      { loanId: loans[6].id, date: new Date('2026-06-20'), type: 'interes', interestAmount: 70000, capitalAmount: 0, previousBalance: 1000000, newBalance: 1000000 },
      { loanId: loans[6].id, date: new Date('2026-07-20'), type: 'interes', interestAmount: 70000, capitalAmount: 0, previousBalance: 1000000, newBalance: 1000000 },
    ],
  });

  // Loan 8: Andrés Castro $2,000,000 6% - 5 payments
  await prisma.payment.createMany({
    data: [
      { loanId: loans[8].id, date: new Date('2026-03-05'), type: 'interes', interestAmount: 120000, capitalAmount: 0, previousBalance: 2000000, newBalance: 2000000 },
      { loanId: loans[8].id, date: new Date('2026-04-05'), type: 'interes', interestAmount: 120000, capitalAmount: 0, previousBalance: 2000000, newBalance: 2000000 },
      { loanId: loans[8].id, date: new Date('2026-05-05'), type: 'interes', interestAmount: 120000, capitalAmount: 0, previousBalance: 2000000, newBalance: 2000000 },
      { loanId: loans[8].id, date: new Date('2026-06-05'), type: 'interes', interestAmount: 120000, capitalAmount: 0, previousBalance: 2000000, newBalance: 2000000 },
      { loanId: loans[8].id, date: new Date('2026-07-05'), type: 'interes', interestAmount: 120000, capitalAmount: 0, previousBalance: 2000000, newBalance: 2000000 },
    ],
  });

  // Loan 10: Diego Moreno $3,500,000 5% - 6 payments
  await prisma.payment.createMany({
    data: [
      { loanId: loans[10].id, date: new Date('2026-02-10'), type: 'interes', interestAmount: 175000, capitalAmount: 0, previousBalance: 3500000, newBalance: 3500000 },
      { loanId: loans[10].id, date: new Date('2026-03-10'), type: 'interes', interestAmount: 175000, capitalAmount: 0, previousBalance: 3500000, newBalance: 3500000 },
      { loanId: loans[10].id, date: new Date('2026-04-10'), type: 'interes', interestAmount: 175000, capitalAmount: 0, previousBalance: 3500000, newBalance: 3500000 },
      { loanId: loans[10].id, date: new Date('2026-05-10'), type: 'interes', interestAmount: 175000, capitalAmount: 0, previousBalance: 3500000, newBalance: 3500000 },
      { loanId: loans[10].id, date: new Date('2026-06-10'), type: 'interes', interestAmount: 175000, capitalAmount: 0, previousBalance: 3500000, newBalance: 3500000 },
      { loanId: loans[10].id, date: new Date('2026-07-10'), type: 'interes', interestAmount: 175000, capitalAmount: 0, previousBalance: 3500000, newBalance: 3500000 },
    ],
  });

  // Loan 11: Valentina Duque $4,500,000 7% - 4 payments
  await prisma.payment.createMany({
    data: [
      { loanId: loans[11].id, date: new Date('2026-04-13'), type: 'interes', interestAmount: 315000, capitalAmount: 0, previousBalance: 4500000, newBalance: 4500000 },
      { loanId: loans[11].id, date: new Date('2026-05-13'), type: 'interes', interestAmount: 315000, capitalAmount: 0, previousBalance: 4500000, newBalance: 4500000 },
      { loanId: loans[11].id, date: new Date('2026-06-13'), type: 'interes', interestAmount: 315000, capitalAmount: 0, previousBalance: 4500000, newBalance: 4500000 },
      { loanId: loans[11].id, date: new Date('2026-07-13'), type: 'interes', interestAmount: 315000, capitalAmount: 0, previousBalance: 4500000, newBalance: 4500000 },
    ],
  });

  // Loan 13: Isabella Restrepo $1,800,000 8% - 3 payments
  await prisma.payment.createMany({
    data: [
      { loanId: loans[13].id, date: new Date('2026-05-01'), type: 'interes', interestAmount: 144000, capitalAmount: 0, previousBalance: 1800000, newBalance: 1800000 },
      { loanId: loans[13].id, date: new Date('2026-06-01'), type: 'interes', interestAmount: 144000, capitalAmount: 0, previousBalance: 1800000, newBalance: 1800000 },
      { loanId: loans[13].id, date: new Date('2026-07-01'), type: 'interes', interestAmount: 144000, capitalAmount: 0, previousBalance: 1800000, newBalance: 1800000 },
    ],
  });

  // Loan 15: Mariana Álvarez $1,200,000 7% - 2 payments
  await prisma.payment.createMany({
    data: [
      { loanId: loans[15].id, date: new Date('2026-06-10'), type: 'interes', interestAmount: 84000, capitalAmount: 0, previousBalance: 1200000, newBalance: 1200000 },
      { loanId: loans[15].id, date: new Date('2026-07-10'), type: 'interes', interestAmount: 84000, capitalAmount: 0, previousBalance: 1200000, newBalance: 1200000 },
    ],
  });

  // Loan 18: Jorge Peña $2,200,000 6% - 4 payments
  await prisma.payment.createMany({
    data: [
      { loanId: loans[18].id, date: new Date('2026-04-15'), type: 'interes', interestAmount: 132000, capitalAmount: 0, previousBalance: 2200000, newBalance: 2200000 },
      { loanId: loans[18].id, date: new Date('2026-05-15'), type: 'interes', interestAmount: 132000, capitalAmount: 0, previousBalance: 2200000, newBalance: 2200000 },
      { loanId: loans[18].id, date: new Date('2026-06-15'), type: 'interes', interestAmount: 132000, capitalAmount: 0, previousBalance: 2200000, newBalance: 2200000 },
      { loanId: loans[18].id, date: new Date('2026-07-15'), type: 'interes', interestAmount: 132000, capitalAmount: 0, previousBalance: 2200000, newBalance: 2200000 },
    ],
  });

  console.log('Seed completed!');
  console.log(`Created: 2 users, 40 clients, 44 loans, payments`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
