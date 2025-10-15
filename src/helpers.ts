import pool from "./db";

export const isValidABN = (abn: string) => {
  if (!/^\d{11}$/.test(abn)) return false;

  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = abn.split("").map(Number);

  digits[0] -= 1;

  const total = digits.reduce(
    (sum, digit, index) => sum + digit * weights[index],
    0
  );

  return total % 89 === 0;
};

export const sellerIsValid = async (seller: {
  id?: number;
  name?: string;
  abn?: number;
  address?: string;
  user_id?: number;
}): Promise<boolean> => {
  if (
    !seller ||
    !seller.id ||
    !seller.abn ||
    !seller.name ||
    !seller.address ||
    !seller.user_id
  ) {
    return false;
  }
  const sellerQuery = await pool.query("SELECT * FROM SELLERS WHERE id = $1", [
    seller.id,
  ]);
  if (sellerQuery.rows.length === 0) {
    return false;
  }
  const storedSeller = sellerQuery.rows[0];
  if (
    Number(storedSeller.abn) !== Number(seller.abn) ||
    storedSeller.user_id !== seller.user_id ||
    storedSeller.name !== seller.name ||
    storedSeller.address !== seller.address
  ) {
    return false;
  }
  return true;
};

export const customerIsValid = async (customer: {
  id?: number;
  name?: string;
  abn?: number;
  address?: string;
  user_id?: number;
}): Promise<boolean> => {
  if (
    !customer ||
    !customer.id ||
    !customer.name ||
    !customer.address ||
    !customer.user_id
  ) {
    return false;
  }
  const customerQuery = await pool.query(
    "SELECT * FROM CUSTOMERS WHERE id = $1",
    [customer.id]
  );
  if (customerQuery.rows.length === 0) {
    return false;
  }
  const storedCustomer = customerQuery.rows[0];
  if (
    (storedCustomer.abn && !customer.abn) ||
    (!storedCustomer.abn && customer.abn)
  ) {
    return false;
  } else if (
    storedCustomer.abn &&
    customer.abn &&
    Number(storedCustomer.abn) !== Number(customer.abn)
  ) {
    return false;
  } else if (
    storedCustomer.user_id !== customer.user_id ||
    storedCustomer.name !== customer.name ||
    storedCustomer.address !== customer.address
  ) {
    return false;
  }
  return true;
};
