const  PDFDocument = require('pdfkit') ;
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const uuid = uuidv4();// for the invoice file name
const doc = new PDFDocument({ size: 'A4', margin: 50 }); // creating the instance of the class

// font style
const fonts = {
  bold: "Helvetica-Bold",
  normal: "Helvetica",
};

async function invoiceLogo(doc){
  return doc.image('./images/wybrid.png', 20, 20, {width: 100})
}

async function CompanyDetails(doc){
  return doc
    .font(fonts.bold)
    .text("Wybrid Technology Private Limited", 20, 80)
    .font(fonts.normal)
    .text("Office No. A1 & B1, 9th Floor", 20, 100)
    .text("Ashar IT Park, Wagle Industrial Estate", 20, 120)
    .text("Thane - 400604, Maharashtra - India", 20, 140)
    .text("GSTIN :", 20, 160)
    .text("67GGGGG1314R9Z6", 65, 160);
}

async function InvoiceDateAndNo(doc){
  return doc
    .text("INVOICE", 360, 80)
    .text("Invoice Date", 360, 100)
    .text("Due Date", 360, 120);
}

async function InvoiceDateAndNoData(doc, data) {
  const { invoiceNo, invoiceData, dueDate } = data;
  return doc
    .font(fonts.bold)
    .text(` : ${invoiceNo}`, 460, 80)
    .font(fonts.normal)
    .text(` : ${invoiceData}`, 460, 100)
    .text(` : ${dueDate}`, 460, 120);
}

async function toAddress(doc, data){
  const { customerName, companyAddress, customerGst } = data;
  return doc
    .text("To", 20, 200)
    .text(customerName, 20, 220)
    .text(companyAddress, 20, 240)
    .text("GSTIN :", 20, 260)
    .text(customerGst, 65, 260);
}

async function tableCompanyName(doc, data) {
  const { propertyName } = data;
  return doc.font(fonts.bold).text(propertyName, 20, 300);
}

async function tableHeader(doc) {
  return doc
    .font(fonts.bold)
    .fillColor("gray")
    .text("#", 20, 330)
    .text("Description", 80, 330)
    .text("Qty", 300, 330)
    .text("Unit Price", 400, 330)
    .text("Amount", 500, 330);
}

async function tableData(doc, data) {
  const { no, desc, qty, unitPrice, amount, height } = data;
  return doc
    .font(fonts.normal)
    .fillColor("black")
    .text(no, 20, height)
    .text(desc, 80, height)
    .text(qty, 300, height)
    .text(unitPrice, 400, height)
    .text(amount, 500, height);
}

async function totalDetail(doc, data) {
  const { height } = data;
  return doc
    .text("Sub Total", 400, height + 20)
    .text("VAT (5%)", 400, height + 40)
    .font(fonts.bold)
    .text("Total", 400, height + 60);
}

async function totalData(doc, data) {
  const { subtotal, vat, total, height } = data;
  return doc
    .font(fonts.normal)
    .text(` : ${subtotal}`, 490, height + 20)
    .text(` : ${vat}`, 490, height + 40)
    .font(fonts.bold)
    .text(` : ${total}`, 490, height + 60);
}

async function footer(doc){
  return doc
    .font(fonts.bold)
    .text("Note", 20, 680)
    .font(fonts.normal)
    .text("Please pay the sum total via bank transfer", 20, 700)
    .text("or cash deposit in the bank. All payments are", 20, 720)
    .text("due within 5 days.", 20, 740)
    .font(fonts.bold)
    .text("Thank you!", 20, 777)
    .font(fonts.normal)
    .fontSize(11)
    .text("team@accounteer.com / 08034567890 / accounteer.com", 250, 778);

}

async function customerAccountDetails(doc){
  return doc
    .font(fonts.bold)
    .text("Account Details", 360, 680)
    .font(fonts.normal)
    .text("Bank Name", 360, 700)
    .text("Account Name", 360, 720)
    .text("Account Number", 360, 740);
}

async function customerAccountDetailsData(doc, data){
  const {bankName, accountName, accountNumber} = data
  return doc
    .text(` : ${bankName}`, 460, 700)
    .text(` :  ${accountName}`, 460, 720)
    .text(` : ${accountNumber}`, 460, 740);
}

async function hrLine(doc, data){
  const {height} = data
  return doc
    .strokeColor("#aaaaaa")
    .lineWidth(2)
    .moveTo(10, height)
    .lineTo(590, height)
    .stroke();
}

// main function
async function generateInvoice(invoiceDetails) {
  const { invoiceData, companyData, bankData, propertyName, TableData, total } = invoiceDetails;
  await invoiceLogo(doc);
  await CompanyDetails(doc);
  await InvoiceDateAndNo(doc);
  await InvoiceDateAndNoData(doc, {
    invoiceNo: invoiceData.invoiceNo,
    invoiceData: invoiceData.invoiceData,
    dueDate: invoiceData.dueDate
  });
  await toAddress(doc, {
    customerName: companyData.customerName,
    companyAddress: companyData.companyAddress,
    customerGst: companyData.customerGst,
  });
  await hrLine(doc, { height: 285 });
  await footer(doc);
  await customerAccountDetails(doc);
  await customerAccountDetailsData(doc, {
    bankName: bankData.bankName,
    accountName: bankData.accountName,
    accountNumber: bankData.accountNumber,
  });
  await tableCompanyName(doc, { propertyName });
  await tableHeader(doc);
  let initialTableDataHeight = 330;
  let SNo = 0
  for await (const item of TableData){
    initialTableDataHeight = initialTableDataHeight + 20;
    SNo = SNo + 1;
     tableData(doc, {
       no: SNo,
       desc: item.desc,
       qty: item.qty,
       unitPrice: item.unitPrice,
       amount: item.amount,
       height: initialTableDataHeight,
     });
  }
  const secondHrLineHeight = TableData.length * 20 + 360;
  await hrLine(doc, { height: secondHrLineHeight });
  await totalDetail(doc, { height: secondHrLineHeight });
  await totalData(doc, {
    subtotal: total.subtotal,
    vat: total.vat,
    total: total.total,
    height: secondHrLineHeight,
  });


  const invoicepdf = fs.createWriteStream(
    `${process.cwd()}/uploads/${uuid}.pdf`
  );
  doc.pipe(invoicepdf);
  doc.end();
}

//input data
const invoiceDetails = {
  invoiceData: {
    invoiceNo: "1234",
    invoiceData: "12-05-2022",
    dueDate: "22-05-2022",
  },
  companyData: {
    customerName: "Odeyinka Ganiu Omowale",
    companyAddress: "No 6 Enoma street, Ago-Palace way,  Okota, Lagos.",
    customerGst: "57GGGGG1314R9Z6",
  },
  bankData: {
    bankName: "BCBCB Bank",
    accountName: "rajkumar",
    accountNumber: "4545656766",
  },
  propertyName: "XYZ company",
  TableData: [
    { desc: "coffee", qty: 1, unitPrice: 20, amount: 200 },
    { desc: "tes", qty: 5, unitPrice: 10, amount: 202 },
    { desc: "cookie", qty: 5, unitPrice: 10, amount: 202 },
    { desc: "bread", qty: 5, unitPrice: 10, amount: 202 },
    { desc: "bread", qty: 5, unitPrice: 10, amount: 202 },
    { desc: "bread", qty: 5, unitPrice: 10, amount: 202 },
    { desc: "bread", qty: 5, unitPrice: 10, amount: 202 },
    { desc: "bread", qty: 5, unitPrice: 10, amount: 202 },
  ],
  total: { subtotal: 5000, vat: 10, total: 30000 },
};

// main function call
generateInvoice(invoiceDetails);