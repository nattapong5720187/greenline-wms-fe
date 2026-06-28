import { apiGetMe, apiLogin, apiLogout } from "@/api/auth";
import Cookies from "js-cookie";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

const COOKIE_OPTS = { secure: true, sameSite: "Lax" };

// Role codes จาก backend
const ROLE_SUPER_ADMIN = "SUPER_ADMIN";
const ROLE_WAREHOUSE_STAFF = "WAREHOUSE_STAFF";
const ROLE_DOC_CONTROL = "DOC_CONTROL";

function hasRoleCode(user, code) {
  return user?.roles?.some((r) => r.code === code) ?? false;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref(JSON.parse(Cookies.get("gl_user") || "null"));
  const token = ref(Cookies.get("access_token") || null);

  const isAuthenticated = computed(() => !!user.value && !!token.value);
  const isSuperAdmin = computed(() => hasRoleCode(user.value, ROLE_SUPER_ADMIN));
  const isWarehouseStaff = computed(() => hasRoleCode(user.value, ROLE_WAREHOUSE_STAFF));

  async function login(username, password) {
    const { data } = await apiLogin(username, password);

    token.value = data.accessToken;
    user.value = data.user;

    Cookies.set("access_token", data.accessToken, COOKIE_OPTS);
    Cookies.set("refresh_token", data.refreshToken, COOKIE_OPTS);
    Cookies.set("gl_user", JSON.stringify(data.user), COOKIE_OPTS);

    return data.user;
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // ไม่ block logout แม้ API ล้มเหลว
    } finally {
      user.value = null;
      token.value = null;
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      Cookies.remove("gl_user");
    }
  }

  async function fetchMe() {
    const { data } = await apiGetMe();
    user.value = data;
    Cookies.set("gl_user", JSON.stringify(data), COOKIE_OPTS);
    return data;
  }

  function can(permission) {
    if (hasRoleCode(user.value, ROLE_SUPER_ADMIN)) return true;

    const rolePerms = {
      [ROLE_WAREHOUSE_STAFF]: [
        "documents.read",
        "documents.create",
        "stock.read",
        "stock.issue",
        "stock.receipt",
        "stock.return",
      ],
      [ROLE_DOC_CONTROL]: ["documents.read", "documents.create", "master.read"],
    };

    return user.value?.roles?.some((r) =>
      rolePerms[r.code]?.includes(permission),
    ) ?? false;
  }

  return { user, token, isAuthenticated, isSuperAdmin, isWarehouseStaff, login, logout, fetchMe, can };
});
