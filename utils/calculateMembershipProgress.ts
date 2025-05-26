export const calculateMembershipProgress = (startDate: Date, endDate: Date) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const remainingDays = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (remainingDays < 0) return 0;
  if (remainingDays > totalDays) return 100;

  return Math.round((remainingDays / totalDays) * 100);
};
