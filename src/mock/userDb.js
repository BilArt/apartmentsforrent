const STORAGE_KEY = "afr_users";

function readUsers() {
  if (typeof localStorage === "undefined") return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeUsers(users) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function getUsers() {
  return readUsers();
}

export function addUser({ firstName, lastName, phone, bankId }) {
  const users = readUsers();

  const newUser = {
    id: crypto.randomUUID?.() || String(Date.now()),
    firstName,
    lastName,
    phone,
    bankId,
    rating: 0,
  };

  users.push(newUser);
  writeUsers(users);

  return newUser;
}

export function findUserByBankId(bankId) {
  const users = readUsers();
  return users.find((user) => user.bankId === bankId) || null;
}
