import { Prisma } from "@prisma/client";

export function calculateComparisonChange(currentRevenueValue: string, previousRevenueValue: string, currentTransactions: number, previousTransactions: number) {
  const currentRevenue = new Prisma.Decimal(currentRevenueValue);
  const previousRevenue = new Prisma.Decimal(previousRevenueValue);
  const revenueDifference = currentRevenue.minus(previousRevenue);
  const revenuePercent = previousRevenue.isZero() ? null : revenueDifference.div(previousRevenue).mul(100).toDecimalPlaces(2).toString();
  const transactionDifference = currentTransactions - previousTransactions;
  const transactionPercent = previousTransactions === 0 ? null : new Prisma.Decimal(transactionDifference).div(previousTransactions).mul(100).toDecimalPlaces(2).toString();
  return { revenue: revenueDifference.toFixed(2), revenuePercent, transactionCount: transactionDifference, transactionPercent };
}
