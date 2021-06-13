export const newVaults = [
  84,
  85,
  86,
  87,
  89,
  90,
  91,
  92,
  93,
  94,
]
export const oldVaults = [
  1,
  2,
  16,
  17,
  3,
  4,
  18,
  5,
  null,
  null,
]

export const newForOldVault = id => newVaults[oldVaults.indexOf(id)]
export const oldForNewVault = id => oldVaults[newVaults.indexOf(id)]

export const migrationTime = 1617922917


