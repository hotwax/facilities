import { defineStore } from "pinia";
import { commonUtil, api, logger } from "@common";

export const useUtilStore = defineStore("util", {
  state: () => ({
    calendars: [],
    partyRoles: [] as any,
    productStores: [],
    facilityTypes: {} as any,
    facilityGroupTypes: [],
    locationTypes: {} as any,
    externalMappingTypes: {} as any,
    countries: [],
    states: {} as any,
    shopifyShopForProductStore: {} as any,
    inventoryGroups: [],
    organizationPartyId: ""
  }),
  getters: {
    getCalendars: (state) => state.calendars,
    getPartyRoles: (state) => state.partyRoles,
    getProductStores: (state) => state.productStores,
    getProductStore: (state) => (productStoreId: any) => { return state.productStores.find((productStore: any) => productStore.productStoreId === productStoreId) },
    getFacilityTypes: (state) => state.facilityTypes,
    getFacilityGroupTypes: (state) => state.facilityGroupTypes,
    getLocationTypes: (state) => state.locationTypes,
    getExternalMappingTypes: (state) => state.externalMappingTypes,
    getCountries: (state) => state.countries,
    getStates: (state) => state.states,
    getShopifyShopIdForProductStore: (state) => (productStoreId: any) => state.shopifyShopForProductStore[productStoreId] ? state.shopifyShopForProductStore[productStoreId] : '',
    getInventoryGroups: (state) => state.inventoryGroups,
    getOrganizationPartyId: (state) => state.organizationPartyId,
  },
  actions: {
    async fetchProductStores() {
      let productStores = [];

      try {
        const resp = await api({
          url: "admin/productStores",
          method: "get",
          params: { pageNoLimit: true }
        });
        if (resp.data?.length > 0) {
          productStores = resp.data;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.productStores = productStores;
    },
    async fetchFacilityTypes(payload = {}) {
      if (Object.keys(this.facilityTypes).length) {
        return;
      }

      let facilityTypes = {};
      const params = {
        customParametersMap: {
          ...payload,
          pageNoLimit: true,
          fieldsToSelect: "facilityTypeId,description,parentTypeId"
        },
        dataDocumentId: 'FACILITY_TYPE'
      } as any;

      try {
        const resp = await api({
          url: "oms/dataDocumentView",
          method: "POST",
          data: params,
          cache: true,
        });
        if (resp.data && resp.data.entityValueList?.length > 0) {
          facilityTypes = resp.data.entityValueList.reduce((facilityType: any, type: any) => {
            facilityType[type.facilityTypeId] = { description: type.description, parentTypeId: type.parentTypeId };
            return facilityType;
          }, {});
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.facilityTypes = facilityTypes;
    },
    async fetchFacilityGroupTypes() {
      let facilityGroupTypes = [];
      try {
        const resp = await api({
          url: "oms/facilityGroups/types",
          method: "get",
          params: { pageNoLimit: true },
        });
        if (resp.data && resp.data.length > 0) {
          facilityGroupTypes = resp.data;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.facilityGroupTypes = facilityGroupTypes;
    },
    async fetchLocationTypes() {
      if (Object.keys(this.locationTypes).length) {
        return;
      }

      let locationTypes = {};
      const params = {
        enumTypeId: "FACLOC_TYPE",
        pageNoLimit: true,
      } as any;

      try {
        const resp = await api({
          url: "admin/enums",
          method: "get",
          params
        });
        if (resp.data && resp.data.length) {
          locationTypes = resp.data.reduce((locationType: any, type: any) => {
            locationType[type.enumId] = type.description;
            return locationType;
          }, {});
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.locationTypes = locationTypes;
    },
    async fetchPartyRoles() {
      if (Object.keys(this.partyRoles).length) {
        return;
      }

      const partyRoles = {} as any;
      const params = {
        dataDocumentId: 'ROLE_TYPE_GROUP_MEMBBR_AND_ROLE_TYPE',
        customParamtersMap: { roleTypeGroupId: "FACILITY_PARTY_ROLE", pageNoLimit: true, orderByField: "sequenceNum" },
        filterByDate: true,
        fieldsToSelect: "roleTypeId,description"
      };

      try {
        const resp = await api({
          url: 'oms/dataDocumentView',
          method: 'POST',
          data: params
        });
        if (resp.data && resp.data.entityValueList?.length > 0) {
          resp.data.entityValueList.map((role: any) => {
            partyRoles[role.roleTypeId] = role.description;
          });
          partyRoles[""] = "none";
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.partyRoles = partyRoles;
    },
    async fetchExternalMappingTypes(payload: any = {}) {
      if (Object.keys(this.externalMappingTypes).length && !payload?.skipState) {
        return;
      }

      let externalMappingTypes = {};
      const params = {
        enumTypeId: "FACILITY_IDENTITY",
        enumId: "SHOPIFY_FAC_ID",
        enumId_not: "Y",
        pageNoLimit: true
      } as any;

      try {
        const resp = await api({
          url: "admin/enums",
          method: "get",
          params,
        });
        if (resp.data && resp.data.length) {
          externalMappingTypes = resp.data.reduce((externalMappingType: any, type: any) => {
            externalMappingType[type.enumId] = type.description;
            return externalMappingType;
          }, {});
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.externalMappingTypes = externalMappingTypes;
    },
    async fetchCalendars() {
      let calendars = [] as any;
      let calendarWeekTimings = [] as any;
      try {
        let resp = await api({
          url: "performFind",
          method: "post",
          data: {
            entityName: "TechDataCalendar",
            fieldList: ["calendarId", "calendarWeekId", "description"],
            viewSize: 100,
            noConditionFind: "Y"
          },
          baseURL: commonUtil.getOmsURL()
        });

        if (!commonUtil.hasError(resp) && resp.data.count) {
          calendars = resp.data.docs;

          resp = await api({
            url: "performFind",
            method: "post",
            data: {
              entityName: "TechDataCalendarWeek",
              fieldList: ["calendarWeekId", "mondayStartTime", "mondayCapacity", "tuesdayStartTime", "tuesdayCapacity", "wednesdayStartTime", "wednesdayCapacity", "thursdayStartTime", "thursdayCapacity", "fridayStartTime", "fridayCapacity", "saturdayStartTime", "saturdayCapacity", "sundayStartTime", "sundayCapacity"],
              viewSize: 100,
              noConditionFind: "Y"
            },
            baseURL: commonUtil.getOmsURL()
          });

          if (!commonUtil.hasError(resp) && resp.data.count) {
            calendarWeekTimings = resp.data.docs;
            calendars = calendars.map((calendar: any) => ({
              ...calendar,
              ...calendarWeekTimings.find((calendarWeekTime: any) => calendarWeekTime.calendarWeekId === calendar.calendarWeekId)
            }));
          } else {
            throw resp.data;
          }
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error("Failed to fetch facility calendars", err);
      }
      this.calendars = calendars;
    },
    async fetchCountries(payload: any = {}) {
      let countries = [] as any;
      const params = {
        toGeoId: "DBIC",
        pageNoLimit: true
      } as any;

      try {
        const resp = await api({
          url: "admin/geos/assocs/assocFrom",
          method: "get",
          params,
          cache: true
        });
        if (resp.data && resp.data.length > 0) {
          countries = resp.data;
          this.fetchStates({ geoId: payload.countryGeoId ? payload.countryGeoId : "USA" });
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error(err);
      }
      this.countries = countries;
    },
    async fetchStates(payload: any) {
      if (payload.geoId in this.states) {
        return;
      }
      let states = [] as any;
      const params = {
        geoId: payload.geoId,
        geoAssocTypeEnumId: "GAT_REGIONS",
        pageNoLimit: true
      } as any;

      try {
        const resp = await api({
          url: "admin/geos/assocs/assocTo",
          method: "get",
          params,
          cache: true
        });
        if (resp.data && resp.data.length > 0) {
          states = resp.data;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error(err);
      }
      this.states[payload.geoId] = states;
    },
    async fetchShopifyShopForProductStores(productStoreIds: any) {
      let shopifyShops = [] as any;
      const params = {
        inputFields: {
          productStoreId: productStoreIds,
          productStoreId_op: "in"
        },
        entityName: "ShopifyShop",
        fieldList: ["productStoreId", "shopifyShopId"],
        noConditionFind: "Y",
        viewSize: productStoreIds.length,
      };

      try {
        const resp = await api({
          url: "performFind",
          method: "POST",
          data: params,
          baseURL: commonUtil.getOmsURL()
        });
        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
          shopifyShops = resp.data.docs;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.shopifyShopForProductStore = shopifyShops.reduce((acc: any, shop: any) => {
        acc[shop.productStoreId] = shop.shopifyShopId;
        return acc;
      }, {});
      return shopifyShops[0]?.shopifyShopId;
    },
    async fetchInventoryGroups() {
      let inventoryGroups = [];
      const params = {
        facilityGroupTypeId: "CHANNEL_FAC_GROUP",
        orderByField: "facilityGroupName ASC",
        pageNoLimit: true
      };

      try {
        const resp = await api({
          url: "admin/facilityGroups",
          method: "get",
          params,
        });
        if (resp.data?.length > 0) {
          inventoryGroups = resp.data;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.inventoryGroups = inventoryGroups;
    },
    async fetchOrganizationPartyId() {
      let partyId = "";
      const params = {
        entityName: "PartyRole",
        inputFields: { roleTypeId: "INTERNAL_ORGANIZATIO" },
        noConditionFind: "Y",
        fieldList: ["partyId"],
        viewSize: 1
      };

      try {
        const resp = await api({
          url: "performFind",
          method: "POST",
          data: params,
          baseURL: commonUtil.getOmsURL()
        });
        if (!commonUtil.hasError(resp)) {
          partyId = resp.data.docs[0]?.partyId;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.organizationPartyId = partyId;
    },
    async generateLatLong(payload: any) {
      try {
        const resp = await api({
          url: "postcodeLookup",
          method: "POST",
          data: payload,
          cache: true,
          baseURL: commonUtil.getOmsURL()
        });
        if (!commonUtil.hasError(resp)) {
          return Promise.resolve(resp.data);
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
        return Promise.reject(error);
      }
    },
    async fetchShopifyShops(payload: any) {
      try {
        const resp = await api({
          url: "performFind",
          method: "POST",
          data: payload,
          cache: true,
          baseURL: commonUtil.getOmsURL()
        });
        if (!commonUtil.hasError(resp)) {
          return Promise.resolve(resp.data.docs);
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
        return Promise.reject(error);
      }
    },
    clearUtilState() {
      this.productStores = [];
      this.facilityTypes = {};
      this.countries = [];
      this.states = {};
      this.locationTypes = {};
      this.externalMappingTypes = {};
      this.shopifyShopForProductStore = {};
      this.inventoryGroups = [];
      this.organizationPartyId = "";
    }
  },
  persist: true
});
