import { defineStore } from "pinia";
import { UtilService } from "@/services/UtilService";
import { commonUtil } from "@common";
import logger from "@/logger";

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
    getFacilityTypes: (state) => state.facilityTypes,
    getFacilityGroupTypes: (state) => state.facilityGroupTypes,
    getLocationTypes: (state) => state.locationTypes,
    getExternalMappingTypes: (state) => state.externalMappingTypes,
    getCountries: (state) => state.countries,
    getStates: (state) => state.states,
    getShopifyShopForProductStore: (state) => state.shopifyShopForProductStore,
    getInventoryGroups: (state) => state.inventoryGroups,
    getOrganizationPartyId: (state) => state.organizationPartyId,
  },
  actions: {
    async fetchProductStores() {
      let productStores = [];
      const params = {
        viewSize: 100,
        noConditionFind: "Y",
        entityName: "ProductStore",
        fieldList: ["productStoreId", "storeName"]
      };

      try {
        const resp = await UtilService.fetchProductStores(params);
        if (!commonUtil.hasError(resp)) {
          productStores = resp.data.docs;
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
        inputFields: { ...payload },
        viewSize: 100,
        noConditionFind: "Y",
        entityName: "FacilityType",
        fieldList: ["facilityTypeId", "description", "parentTypeId"]
      } as any;

      try {
        const resp = await UtilService.fetchFacilityTypes(params);
        if (!commonUtil.hasError(resp)) {
          facilityTypes = resp.data.docs.reduce((facilityType: any, type: any) => {
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
      const params = {
        viewSize: 100,
        noConditionFind: "Y",
        entityName: "FacilityGroupType",
        fieldList: ["facilityGroupTypeId", "description"]
      } as any;

      try {
        const resp = await UtilService.fetchFacilityGroupTypes(params);
        if (!commonUtil.hasError(resp)) {
          facilityGroupTypes = resp.data.docs;
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
        inputFields: { enumTypeId: "FACLOC_TYPE" },
        viewSize: 100,
        noConditionFind: "Y",
        entityName: "Enumeration",
        fieldList: ["enumId", "description"]
      } as any;

      try {
        const resp = await UtilService.fetchLocationTypes(params);
        if (!commonUtil.hasError(resp)) {
          locationTypes = resp.data.docs.reduce((locationType: any, type: any) => {
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
        inputFields: { roleTypeGroupId: "FACILITY_PARTY_ROLE" },
        viewSize: 100,
        entityName: "RoleTypeGroupMemberAndRoleType",
        orderBy: "sequenceNum",
        filterByDate: "Y",
        fieldList: ["roleTypeId", "description"]
      };

      try {
        const resp = await UtilService.fetchPartyRoles(params);
        if (!commonUtil.hasError(resp)) {
          resp.data.docs.map((role: any) => {
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
        inputFields: {
          enumTypeId: "FACILITY_IDENTITY",
          enumId: "SHOPIFY_FAC_ID",
          enumId_op: "notEqual"
        },
        viewSize: 100,
        noConditionFind: "Y",
        entityName: "Enumeration",
        fieldList: ["enumId", "description"]
      } as any;

      try {
        const resp = await UtilService.fetchExternalMappingTypes(params);
        if (!commonUtil.hasError(resp)) {
          externalMappingTypes = resp.data.docs.reduce((externalMappingType: any, type: any) => {
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
        let resp = await UtilService.fetchCalendars({
          entityName: "TechDataCalendar",
          fieldList: ["calendarId", "calendarWeekId", "description"],
          viewSize: 100,
          noConditionFind: "Y"
        });

        if (!commonUtil.hasError(resp) && resp.data.count) {
          calendars = resp.data.docs;

          resp = await UtilService.fetchCalendarWeekTimings({
            entityName: "TechDataCalendarWeek",
            fieldList: ["calendarWeekId", "mondayStartTime", "mondayCapacity", "tuesdayStartTime", "tuesdayCapacity", "wednesdayStartTime", "wednesdayCapacity", "thursdayStartTime", "thursdayCapacity", "fridayStartTime", "fridayCapacity", "saturdayStartTime", "saturdayCapacity", "sundayStartTime", "sundayCapacity"],
            viewSize: 100,
            noConditionFind: "Y"
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
        inputFields: { geoIdTo: "DBIC" },
        entityName: "GeoAssocAndGeoFrom",
        fieldList: ["geoName", "geoId", "geoCode"],
        noConditionFind: "Y",
        viewSize: 250
      } as any;

      try {
        const resp = await UtilService.fetchCountries(params);
        if (!commonUtil.hasError(resp)) {
          countries = resp.data.docs;
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
        inputFields: {
          geoIdFrom: payload.geoId,
          geoAssocTypeId: "REGIONS"
        },
        entityName: "GeoAssocAndGeoTo",
        fieldList: ["geoName", "geoId", "wellKnownText"],
        noConditionFind: "Y",
        viewSize: 250
      } as any;

      try {
        const resp = await UtilService.fetchStates(params);
        if (!commonUtil.hasError(resp)) {
          states = resp.data.docs;
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
        const resp = await UtilService.fetchShopifyShop(params);
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
        entityName: "FacilityGroup",
        inputFields: { facilityGroupTypeId: "CHANNEL_FAC_GROUP" },
        noConditionFind: "Y",
        orderBy: "facilityGroupName ASC",
        fieldList: ["facilityGroupId", "facilityGroupTypeId", "facilityGroupName", "description"],
        viewSize: 50
      };

      try {
        const resp = await UtilService.fetchInventoryGroups(params);
        if (!commonUtil.hasError(resp)) {
          inventoryGroups = resp.data.docs;
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
        const resp = await UtilService.fetchOrganizationPartyId(params);
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
  persist: {
    storage: localStorage,
    pick: ["organizationPartyId"]
  }
});
