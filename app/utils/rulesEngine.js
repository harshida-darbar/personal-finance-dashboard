// personal-finance-dashboard/app/utils/rulesEngine.js

export const rules = [
  { keyword: "swiggy", category: "Food" },
  { keyword: "zomato", category: "Food" },
  { keyword: "uber", category: "Travel" },
  { keyword: "amazon", category: "Shopping" },
  { keyword: "Equitysoft Technology", category: "salary"},
  { keyword: "netflix", category: "Entertainment" },
];

export const autoCategorize = (merchant) => {
  if (!merchant) return "Others";

  const lowerMerchant = merchant.toLowerCase();

  const matchedRule = rules.find((rule) =>
    lowerMerchant.includes(rule.keyword)
  );

  return matchedRule ? matchedRule.category : "Others";
};
