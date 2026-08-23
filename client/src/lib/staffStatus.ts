export type StaffStatusRecord = { accountStatus: string };

export function splitStaffByStatus<T extends StaffStatusRecord>(accounts: T[]) {
  return {
    active: accounts.filter(account => account.accountStatus === "active"),
    rejected: accounts.filter(account => account.accountStatus === "rejected"),
    suspended: accounts.filter(account => account.accountStatus === "suspended"),
  };
}
