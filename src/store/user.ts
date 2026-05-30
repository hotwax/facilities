import { defineStore } from "pinia";
import { DateTime, Settings } from "luxon";
import { api, client, translate, commonUtil, useAuth, cookieHelper } from "@common";
import logger from "@/logger";
import router from "@/router";
import { useUtilStore } from "./util";
import { useFacilityStore } from "./facility";

interface UserState {
  permissions: string[];
  current: any;
  oms: string;
  locale: string;
  localeOptions: any;
  currentTimeZoneId: string;
  timeZones: any[];
  facilities: any[];
  currentFacility: any;
  pwaState: {
    updateExists: boolean;
    registration: any;
  };
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    permissions: [],
    current: {},
    oms: "",
    locale: "en-US",
    localeOptions: import.meta.env.VITE_APP_LOCALES ? JSON.parse(import.meta.env.VITE_APP_LOCALES) : { "en-US": "English" },
    currentTimeZoneId: "",
    timeZones: [],
    facilities: [],
    currentFacility: {} as any,
    pwaState: {
      updateExists: false,
      registration: null as any,
    }
  }),
  getters: {
    getUserPermissions: (state) => state.permissions,
    getUserProfile: (state) => state.current,
    getPwaState: (state) => state.pwaState,
    getLocale: (state) => state.locale,
    getLocaleOptions: (state) => state.localeOptions,
    getTimeZones: (state) => state.timeZones,
    getCurrentTimeZone: (state) => state.currentTimeZoneId,
    getFacilities: (state) => state.facilities,
    getCurrentFacility: (state) => state.currentFacility,
    hasPermission: (state: UserState) => (permissionId: string): boolean => {
      const permissions = state.permissions;

      if (!permissionId) {
        return true;
      }

      // Handle OR/AND logic in permission string
      if (permissionId.includes(' OR ')) {
        const parts = permissionId.split(' OR ');
        return parts.some(part => useUserStore().hasPermission(part.trim()));
      }

      if (permissionId.includes(' AND ')) {
        const parts = permissionId.split(' AND ');
        return parts.every(part => useUserStore().hasPermission(part.trim()));
      }

      return permissions.includes(permissionId);
    }
  },
  actions: {
    async login(payload: any) {
      return await useAuth().login(payload.username, payload.password);
    },
    async logout(payload?: any) {
      return await useAuth().logout(payload);
    },
    setOms (oms:string) {
      this.oms = oms;
    },
    async fetchPermissions() {
      try {
        const baseURL = commonUtil.getOmsURL();
        const viewSize = 200;
        const params = {
          "viewIndex": 0,
          viewSize
        }
        let resp: any = await client({
          url: "getPermissions",
          method: "post",
          baseURL,
          data: params,
          headers: {
            Authorization: 'Bearer ' + commonUtil.getToken(),
            'Content-Type': 'application/json'
          }
        })
        if (resp.status === 200 && resp.data.docs?.length && !commonUtil.hasError(resp)) {
          let serverPermissions = resp.data.docs.map((permission: any) => permission.permissionId);
          const total = resp.data.count;
          const remainingPermissions = total - serverPermissions.length;
          if (remainingPermissions > 0) {
            const apiCallsNeeded = Math.floor(remainingPermissions / viewSize) + (remainingPermissions % viewSize != 0 ? 1 : 0);
            const responses = await Promise.all([...Array(apiCallsNeeded).keys()].map(async (index: any) => {
              return await client({
                url: "getPermissions",
                method: "post",
                baseURL,
                data: {
                  "viewIndex": index + 1,
                  viewSize
                },
                headers: {
                  Authorization: 'Bearer ' + commonUtil.getToken(),
                  'Content-Type': 'application/json'
                }
              })
            }))

            serverPermissions = responses.reduce((acc: any, response: any) => {
              if (response.status === 200 && !commonUtil.hasError(response) && response.data?.docs) {
                acc.push(...response.data.docs.map((permission: any) => permission.permissionId));
              }
              return acc;
            }, serverPermissions)
          }
          this.permissions = serverPermissions;
        }
      } catch (err) {
        console.error("Error fetching permissions", err);
        this.permissions = [];
      }
    },
    async postLogin() {
      try {
        await this.fetchPermissions();

        const permissionId = import.meta.env.VITE_APP_PERMISSION_ID;
        if (permissionId && !this.hasPermission(permissionId)) {
          const permissionError = "You do not have permission to access the app.";
          commonUtil.showToast(translate(permissionError));
          logger.error("error", permissionError);
          return Promise.reject(new Error(permissionError));
        }

      try {
        const userProfile = await api({
          url: "admin/user/profile",
          method: "get",
        }) as any;
        this.current = userProfile.data
        useAuth().updateUserId(this.current.userId)
        this.setOms(cookieHelper().get("oms") || '');
        if (this.current.timeZone) {
          Settings.defaultZone = this.current.timeZone;
        }
      } catch (error: any) {
        commonUtil.showToast(translate("Failed to fetch user profile information"));
        console.error("error", error);
        useAuth().clearAuth();
        return Promise.reject(new Error(error));
      }
        
        const utilStore = useUtilStore();
        await utilStore.fetchOrganizationPartyId();

        const productStoreId = router.currentRoute.value?.query?.productStoreId;
        if (productStoreId) {
          router.push(`/tabs/find-facilities?productStoreId=${productStoreId}`);
        }
      } catch (err: any) {
        commonUtil.showToast(translate("Something went wrong while login. Please contact administrator."));
        logger.error("error: ", err.toString());
        return Promise.reject(err instanceof Object ? err : new Error(err));
      }
    },
    async postLogout() {
      const utilStore = useUtilStore();
      const facilityStore = useFacilityStore();

      this.$reset();

      utilStore.clearUtilState();
      facilityStore.clearFacilityState();
    },
    async setLocale(locale: string) {
      let newLocale, matchingLocale
      newLocale = this.locale
      try {
        if (locale) {
          matchingLocale = Object.keys(this.localeOptions).find((option: string) => option === locale)
          matchingLocale = matchingLocale || Object.keys(this.localeOptions).find((option: string) => option.slice(0, 2) === locale.slice(0, 2))
          newLocale = matchingLocale || this.locale
          
          const resp: any = await api({
            url: "admin/user/profile",
            method: "post",
            data: { userId: this.current.userId, locale: newLocale },
          })

          if (commonUtil.hasError(resp)) {
            throw resp.data
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.locale = newLocale
      }
    },
    async setUserTimeZone(tzId: string) {
      if (this.currentTimeZoneId === tzId) {
        return;
      }

      try {
        const resp: any = await api({
          url: "admin/user/profile",
          method: "post",
          data: { userId: this.current.userId, timeZone: tzId },
        });

        if (commonUtil.hasError(resp)) {
          throw resp.data
        }
        this.currentTimeZoneId = tzId
        this.current.userTimeZone = tzId;
        Settings.defaultZone = tzId;

        commonUtil.showToast(translate("Time zone updated successfully"));
        return Promise.resolve(tzId)
      } catch (err) {
        console.error('Error', err)
        return Promise.reject('')
      }
    },
    async getAvailableTimeZones() {
      if (this.timeZones.length) {
        return;
      }

      try {
        const resp: any = await api({
          url: "admin/user/getAvailableTimeZones",
          method: "get",
          cache: true,
        });

        if (commonUtil.hasError(resp)) {
          throw resp.data
        }

        this.timeZones = resp.data.timeZones.filter((timeZone: any) => DateTime.local().setZone(timeZone.id).isValid);
      } catch (err) {
        console.error('Error', err)
      }
    },
    updateTimeZone(tzId: string) {
      this.currentTimeZoneId = tzId
    },
    updatePwaState(payload: any) {
      this.pwaState = payload;
    },
    async isUserLoginIdExists(username: string) {
      try {
        const resp = await api({
          url: 'performFind',
          method: 'POST',
          data: {
            entityName: "UserLogin",
            inputFields: {
              userLoginId: username
            },
            viewSize: 1,
            fieldList: ['userLoginId', 'partyId'],
            distinct: 'Y',
            noConditionFind: 'Y'
          },
          baseURL: commonUtil.getOmsURL()
        }) as any;

        return !commonUtil.hasError(resp) && resp.data.docs.length > 0;
      } catch(err) {
        return false;
      }
    },
    async sendResetPasswordEmail(payload: any) {
      return await api({
        url: "sendResetPasswordMail",
        method: "post",
        data: payload,
        baseURL: commonUtil.getOmsURL()
      });
    },
    async updateUserLoginStatus(payload: any) {
      return await api({
        url: "service/updateUserLoginStatus",
        method: "post",
        data: payload,
        baseURL: commonUtil.getOmsURL()
      });
    }
  },
  persist: true,
});
