// Fake Auth Service

export function loginFake() {
  localStorage.setItem("isLoggedIn", "true");
}

export function logoutFake() {
  localStorage.removeItem("isLoggedIn");
}

export function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}
