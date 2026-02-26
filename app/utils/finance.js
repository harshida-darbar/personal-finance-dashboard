// personal-finance-dashboard/app/utils/finance.js

export const calculateMonthlySummary = (transactions, selectedMonth) => {
  const monthlyTransactions = transactions.filter(
    (t) => t.month === selectedMonth
  );

  const income = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expense = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  return {
    income,
    expense,
    net: income - expense,
  };
};

export const calculateCategorySpending = (transactions, selectedMonth) => {
  return transactions
    .filter(
      (t) => t.type === "expense" && t.month === selectedMonth
    )
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});
};

export const calculateLastSixMonthsCashflow = (transactions) => {
  const result = {};

  transactions.forEach((t) => {
    if (!result[t.month]) {
      result[t.month] = { income: 0, expense: 0 };
    }

    result[t.month][t.type] += Number(t.amount);
  });

  return result;
};
