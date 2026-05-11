import { defineStore } from "pinia";
import { UserService } from "@/services/UserService";
import { showToast } from "@/utils";
import { Settings } from "luxon";
import { logout, updateInstanceUrl, updateToken, resetConfig } from "@/adapter";
import logger from "@/logger";
import { getServerPermissionsFromRules, prepareAppPermissions, resetPermissions, setPermissions } from "@/authorization";
import { translate, useAuthStore, useUserStore as useDxpUserStore } from "@hotwax/dxp-components";
import emitter from "@/event-bus";
import router from "@/router";
import { useUtilStore } from "./util";
import { useFacilityStore } from "./facility";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: "",
    permissions: [],
    current: {} as any,
    instanceUrl: "",
    pwaState: {
      updateExists: false,
      registration: null as any,
    }
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getUserPermissions: (state) => state.permissions,
    getUserProfile: (state) => state.current,
    getInstanceUrl: (state) => state.instanceUrl,
    getPwaState: (state) => state.pwaState,
  },
  actions: {
    async login(payload: any) {
      try {
        const { token, oms } = payload;
        this.setUserInstanceUrl(oms);

        const permissionId = import.meta.env.VITE_APP_PERMISSION_ID;
        const serverPermissionsFromRules = getServerPermissionsFromRules();
        if (permissionId) serverPermissionsFromRules.push(permissionId);

        const serverPermissions = await UserService.getUserPermissions({
          permissionIds: [...new Set(serverPermissionsFromRules)]
        }, token);
        const appPermissions = prepareAppPermissions(serverPermissions);

        if (permissionId) {
          const hasPermission = appPermissions.some((appPermission: any) => appPermission.action === permissionId);
          if (!hasPermission) {
            const permissionError = "You do not have permission to access the app.";
            showToast(translate(permissionError));
            logger.error("error", permissionError);
            return Promise.reject(new Error(permissionError));
          }
        }

        const userProfile = await UserService.getUserProfile(token);

        setPermissions(appPermissions);
        if (userProfile.userTimeZone) {
          Settings.defaultZone = userProfile.userTimeZone;
        }

        this.current = userProfile;
        this.permissions = appPermissions;
        this.token = token;
        updateToken(token);
        
        const utilStore = useUtilStore();
        await utilStore.fetchOrganizationPartyId();

        const productStoreId = router.currentRoute.value?.query?.productStoreId;
        if (productStoreId) {
          return `/tabs/find-facilities?productStoreId=${productStoreId}`;
        }
      } catch (err: any) {
        showToast(translate("Something went wrong while login. Please contact administrator."));
        logger.error("error: ", err.toString());
        return Promise.reject(err instanceof Object ? err : new Error(err));
      }
    },
    async logout(payload?: any) {
      let redirectionUrl = "";
      emitter.emit("presentLoader", { message: "Logging out" });

      if (!payload?.isUserUnauthorised) {
        let resp;
        try {
          resp = await logout();
          resp = JSON.parse(resp.startsWith("//") ? resp.replace("//", "") : resp);
        } catch (err) {
          logger.error("Error parsing data", err);
        }

        if (resp?.logoutAuthType === "SAML2SSO") {
          redirectionUrl = resp.logoutUrl;
        }
      }

      const authStore = useAuthStore();
      const dxpUserStore = useDxpUserStore();
      const utilStore = useUtilStore();
      const facilityStore = useFacilityStore();

      this.$reset();
      resetConfig();
      resetPermissions();

      utilStore.clearUtilState();
      facilityStore.clearFacilityState();

      authStore.$reset();
      dxpUserStore.$reset();

      if (redirectionUrl) {
        window.location.href = redirectionUrl;
      }

      emitter.emit("dismissLoader");
      return redirectionUrl;
    },
    async setUserTimeZone(timeZoneId: string) {
      this.current.userTimeZone = timeZoneId;
      Settings.defaultZone = timeZoneId;
    },
    setUserInstanceUrl(payload: any) {
      this.instanceUrl = payload;
      updateInstanceUrl(payload);
    },
    updatePwaState(payload: any) {
      this.pwaState = payload;
    }
  },
  persist: true,
});
