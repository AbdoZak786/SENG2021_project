function userDetails(name: string, address: string, abn?: string): string {
  const jsonObject = { name, address, abn };
  return JSON.stringify(jsonObject);
}

function productDetails(
  description: string,
  qty: number,
  rate: number
): string {
  const jsonObject = { description, qty, rate };
  return JSON.stringify(jsonObject);
}

async function generateInvoice(
  sellerDetails: string,
  customerDetails: string,
  productDetails: string[]
) {
  // check if has abn could make seperate function
  console.log(await JSON.parse(sellerDetails));
  console.log(await JSON.parse(customerDetails));
  productDetails.forEach(async (p) => console.log(await JSON.parse(p)));
}

const seller = userDetails("kalib", "UNSW", "123");
const customer = userDetails("Coffee on campus", "ainsworth");
const productList = [
  productDetails("coffee beans", 2, 10),
  productDetails("milk", 4, 2),
];

generateInvoice(seller, customer, productList);
