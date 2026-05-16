import { defineStore } from "pinia";
import emitter from "@/event-bus";
import { FacilityService } from "@/services/FacilityService";
import { UserService } from "@/services/UserService";
import { commonUtil } from "@common";
import logger from "@/logger";
import { useUtilStore } from "./util";

export const useFacilityStore = defineStore("facility", {
  state: () => ({
    facilityQuery: {
      queryString: "",
      productStoreId: "",
      facilityTypeId: "",
      facilityGroupId: ""
    },
    groupQuery: {
      queryString: ""
    },
    facilities: {
      list: [] as any[],
      total: 0
    },
    virtualFacilities: {
      list: [] as any[],
      total: 0
    },
    facilityGroups: {
      list: [] as any[],
      total: 0
    },
    archivedFacilities: [] as any[],
    current: {} as any
  }),
  getters: {
    getFacilities: (state) => (state.facilities.list ? JSON.parse(JSON.stringify(state.facilities.list)) : []),
    getVirtualFacilities: (state) => (state.virtualFacilities.list ? JSON.parse(JSON.stringify(state.virtualFacilities.list)) : []),
    getFacilityGroups: (state) => (state.facilityGroups.list ? JSON.parse(JSON.stringify(state.facilityGroups.list)) : []),
    getArchivedFacilities: (state) => JSON.parse(JSON.stringify(state.archivedFacilities)),
    getFacilityProductStores: (state) => state.current.productStores,
    getFacilityQuery: (state) => JSON.parse(JSON.stringify(state.facilityQuery)),
    getGroupQuery: (state) => JSON.parse(JSON.stringify(state.groupQuery)),
    isFacilitiesScrollable: (state) => state.facilities.list?.length > 0 && state.facilities.list?.length < state.facilities.total,
    isVirtualFacilitiesScrollable: (state) => state.virtualFacilities.list?.length > 0 && state.virtualFacilities.list?.length < state.virtualFacilities.total,
    isFacilityGroupsScrollable: (state) => state.facilityGroups.list?.length > 0 && state.facilityGroups.list?.length < state.facilityGroups.total,
    getCurrent: (state) => (state.current ? JSON.parse(JSON.stringify(state.current)) : {}),
    getFacilityCalendar: (state) => (state.current?.calendar ? JSON.parse(JSON.stringify(state.current.calendar)) : {}),
    getFacilityParties: (state) => state.current.parties,
    getPostalAddress: (state) => (state.current?.postalAddress ? JSON.parse(JSON.stringify(state.current.postalAddress)) : {}),
    getTelecomAndEmailAddress: (state) => state.current?.contactDetails,
  },
  actions: {
    async fetchFacilitiesAdditionalInformation(payload = { viewIndex: 0 }) {
      const cachedFacilities = this.facilities.list ? JSON.parse(JSON.stringify(this.facilities.list)) : [];
      let stateFacilities = this.facilities.list ? JSON.parse(JSON.stringify(this.facilities.list)) : [];
      const total = this.facilities.total;

      const facilityIds: Array<string> = [];
      const facilities = cachedFacilities.splice(payload.viewIndex * (import.meta.env.VITE_APP_VIEW_SIZE as any), import.meta.env.VITE_APP_VIEW_SIZE);
      facilities.map((facility: any) => facilityIds.push(facility.facilityId));

      stateFacilities = stateFacilities.filter((facility: any) => !facilityIds.includes(facility.facilityId));

      const [facilitiesGroupInformation, facilitiesOrderCount] = await Promise.all([
        FacilityService.fetchFacilityGroupInformation(facilityIds),
        FacilityService.fetchFacilitiesOrderCount(facilityIds)
      ]);

      facilities.map((facility: any) => {
        const fulfillmentOrderLimit = facility.maximumOrderLimit;
        if (fulfillmentOrderLimit === 0) {
          facility.orderLimitType = "no-capacity";
        } else if (fulfillmentOrderLimit) {
          facility.orderLimitType = "custom";
        } else {
          facility.orderLimitType = "unlimited";
        }

        facility.orderCount = facilitiesOrderCount[facility.facilityId] ? facilitiesOrderCount[facility.facilityId] : 0;
        const facilityGroupInformation = facilitiesGroupInformation[facility.facilityId];

        if (facilityGroupInformation?.length) {
          facility.groupInformation = facilityGroupInformation;
          facility.sellOnline = facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupTypeId === "CHANNEL_FAC_GROUP");
          facility.useOMSFulfillment = facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === "OMS_FULFILLMENT");
          facility.generateShippingLabel = facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === "AUTO_SHIPPING_LABEL");
          facility.allowPickup = facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === "PICKUP");
        }
      });

      this.facilities = { list: stateFacilities.concat(facilities), total };
    },
    async fetchFacilities(payload: any) {
      if (payload.viewIndex === 0) emitter.emit("presentLoader");
      const filters = {
        "parentFacilityTypeId": "VIRTUAL_FACILITY",
        "parentFacilityTypeId_op": "notEqual",
        "facilityTypeId": "VIRTUAL_FACILITY",
        "facilityTypeId_op": "notEqual",
      } as any;

      if (this.facilityQuery.productStoreId) {
        filters["productStoreId"] = this.facilityQuery.productStoreId;
        filters["productStoreId_op"] = "equals";
      }

      if (this.facilityQuery.facilityTypeId) {
        filters["facilityTypeId"] = this.facilityQuery.facilityTypeId;
        filters["facilityTypeId_op"] = "equals";
      }

      if (this.facilityQuery.queryString) {
        filters["facilityId_value"] = this.facilityQuery.queryString;
        filters["facilityId_op"] = "contains";
        filters["facilityId_ic"] = "Y";
        filters["facilityId_grp"] = "1";
        filters["facilityName_value"] = this.facilityQuery.queryString;
        filters["facilityName_op"] = "contains";
        filters["facilityName_ic"] = "Y";
        filters["facilityName_grp"] = "1";
        filters["grp_op_1"] = "OR";
      }

      if (this.facilityQuery.facilityGroupId) {
        filters["facilityGroupId"] = this.facilityQuery.facilityGroupId;
        filters["facilityGroupId_op"] = "equals";
        filters["filterByDate"] = "Y";
      }

      const params = {
        "inputFields": {
          "grp_op": "AND",
          ...filters
        },
        "entityName": "FacilityView",
        "noConditionFind": "Y",
        "distinct": "Y",
        "fromDateName": "facilityGroupFromDate",
        "thruDateName": "facilityGroupThruDate",
        "fieldList": ["facilityId", "facilityName", "facilityTypeId", "maximumOrderLimit", "defaultDaysToShip", "externalId", "primaryFacilityGroupId", "parentFacilityTypeId", "closedDate", "facilityTimeZone"],
        ...payload
      };

      let facilities = this.facilities.list ? JSON.parse(JSON.stringify(this.facilities.list)) : [];
      let total = 0;

      try {
        const resp = await FacilityService.fetchFacilities(params);
        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
          if (payload.viewIndex && payload.viewIndex > 0) {
            facilities = facilities.concat(resp.data.docs);
          } else {
            facilities = resp.data.docs;
          }
          total = resp.data.count;
        } else {
          throw resp.data;
        }
      } catch (error) {
        if (payload.viewIndex === 0) {
          facilities = [];
          total = 0;
        }
      }

      this.facilities = { list: facilities, total };
      emitter.emit("dismissLoader");

      if (facilities.length) {
        await this.fetchFacilitiesAdditionalInformation(payload);
      }
    },
    updateFacilities(facilities: any) {
      this.facilities = { list: facilities, total: facilities.length };
    },
    async fetchFacilityAdditionalInformation() {
      const facility = JSON.parse(JSON.stringify(this.current));
      const utilStore = useUtilStore();
      const inventoryGroups = utilStore.getInventoryGroups;

      const [facilityGroupInformation, facilityOrderCount] = await Promise.all([
        FacilityService.fetchFacilityGroupInformation([facility.facilityId]),
        FacilityService.fetchFacilitiesOrderCount([facility.facilityId])
      ]);

      const fulfillmentOrderLimit = facility.maximumOrderLimit;
      if (fulfillmentOrderLimit === 0) {
        facility.orderLimitType = "no-capacity";
      } else if (fulfillmentOrderLimit) {
        facility.orderLimitType = "custom";
      } else {
        facility.orderLimitType = "unlimited";
      }

      facility.orderCount = facilityOrderCount[facility.facilityId] ? facilityOrderCount[facility.facilityId] : 0;
      const facilityGroupInfo = facilityGroupInformation[facility.facilityId];
      if (facilityGroupInfo?.length) {
        facility.groupInformation = facilityGroupInfo;
        facility.useOMSFulfillment = facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === "OMS_FULFILLMENT");
        facility.generateShippingLabel = facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === "AUTO_SHIPPING_LABEL");
        facility.allowPickup = facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === "PICKUP");
      } else {
        facility.groupInformation = [];
        facility.sellOnline = false;
        facility.useOMSFulfillment = false;
        facility.generateShippingLabel = false;
        facility.allowPickup = false;
      }

      inventoryGroups.forEach((group: any) => {
        group.isChecked = (facilityGroupInfo?.some((facilityGroup: any) => facilityGroup?.facilityGroupId === group.facilityGroupId));
      });
      facility.inventoryGroups = inventoryGroups;
      this.current = facility;
    },
    async fetchCurrentFacility(payload: any) {
      const cachedFacilities = this.facilities.list ? JSON.parse(JSON.stringify(this.facilities.list)) : [];
      const current = cachedFacilities.find((facility: any) => facility.facilityId === payload.facilityId);
      if (current?.facilityId && !payload.skipState && current["groupInformation"]) {
        const utilStore = useUtilStore();
        const inventoryGroups = utilStore.getInventoryGroups;
        inventoryGroups.forEach((group: any) => {
          group.isChecked = (current.groupInformation?.some((facilityGroup: any) => facilityGroup?.facilityGroupId === group.facilityGroupId));
        });
        current.inventoryGroups = inventoryGroups;
        this.current = current;
        return;
      }

      const params = {
        inputFields: { facilityId: payload.facilityId },
        entityName: "FacilityAndProductStore",
        noConditionFind: "Y",
        distinct: "Y",
        fieldList: ["facilityId", "facilityName", "facilityTypeId", "maximumOrderLimit", "defaultDaysToShip", "externalId", "primaryFacilityGroupId", "parentFacilityTypeId", "closedDate", "facilityTimeZone"],
        viewSize: 1
      };

      let facility = {} as any;
      try {
        const resp = await FacilityService.fetchFacilities(params);
        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
          facility = resp.data.docs[0];
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }

      this.current = { ...this.current, ...facility };
      await this.fetchFacilityAdditionalInformation();
    },
    updateCurrentFacility(facility: any) {
      this.current = facility;
    },
    async fetchFacilityContactDetailsAndTelecom(facility: any) {
      let postalAddress = {} as any;
      const contactDetails = {} as any;

      const payload = {
        inputFields: {
          contactMechPurposeTypeId: ["PRIMARY_PHONE", "PRIMARY_EMAIL", "PRIMARY_LOCATION", "GOOGLE_MAP_URL"],
          contactMechPurposeTypeId_op: "in",
          contactMechTypeId: ["TELECOM_NUMBER", "EMAIL_ADDRESS", "POSTAL_ADDRESS", "MAP_URL"],
          contactMechTypeId_op: "in",
          facilityId: facility.facilityId
        },
        entityName: "FacilityContactDetailByPurpose",
        orderBy: "fromDate DESC",
        filterByDate: "Y",
        fieldList: ["address1", "address2", "city", "contactMechId", "contactMechTypeId", "contactNumber", "countryCode", "countryGeoId", "countryGeoName", "directions", "infoString", "latitude", "longitude", "postalCode", "stateGeoId", "stateGeoName", "toName"],
        viewSize: 4
      };

      try {
        const resp = await FacilityService.fetchFacilityContactDetails(payload);
        if (!commonUtil.hasError(resp)) {
          const docs = resp.data.docs;
          docs.map((item: any) => {
            if (item.contactMechTypeId === "POSTAL_ADDRESS") {
              postalAddress = { ...item, stateProvinceGeoId: item.stateGeoId };
            } else if (item.contactMechTypeId === "TELECOM_NUMBER") {
              contactDetails.telecomNumber = { contactMechId: item.contactMechId, contactNumber: item.contactNumber, countryCode: item.countryCode };
            } else if (item.contactMechTypeId === "EMAIL_ADDRESS") {
              contactDetails.emailAddress = { contactMechId: item.contactMechId, infoString: item.infoString };
            } else if (item.contactMechTypeId === "MAP_URL") {
              contactDetails.googleMapUrl = { contactMechId: item.contactMechId, infoString: item.infoString };
            }
          });
          this.current.postalAddress = postalAddress;
          this.current.contactDetails = contactDetails;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error("Failed to fetch facility contact details and telecom information", err);
      }
    },
    updateFacilityQuery(query: any) {
      this.facilityQuery = query;
    },
    updateGroupQuery(query: any) {
      this.groupQuery = query;
    },
    clearFacilityState() {
      this.facilityQuery = { queryString: "", productStoreId: "", facilityTypeId: "", facilityGroupId: "" };
      this.groupQuery = { queryString: "" };
      this.facilities = { list: [], total: 0 };
      this.current = {};
    },
    async fetchFacilityLocations(payload: any) {
      let facilityLocations = [];
      try {
        const params = {
          inputFields: { facilityId: payload.facilityId },
          entityName: "FacilityLocation",
          fieldList: ["facilityId", "locationSeqId", "locationTypeEnumId", "areaId", "aisleId", "sectionId", "levelId", "positionId"],
          viewSize: 100
        };
        const resp = await FacilityService.fetchFacilityLocations(params);
        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
          facilityLocations = resp.data.docs;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error("Failed to find the facility locations", err);
      }
      this.current.locations = facilityLocations;
    },
    async fetchFacilityCalendar(payload: any) {
      let facilityCalendar = {};
      try {
        const params = {
          inputFields: { facilityId: payload.facilityId },
          entityName: "StoreOperatingHours",
          filterByDate: "Y",
          viewSize: 1
        };
        const resp = await FacilityService.fetchFacilityCalendar(params);
        if (!commonUtil.hasError(resp) && resp.data.count) {
          facilityCalendar = resp.data.docs[0];
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error(err);
      }
      this.current.calendar = facilityCalendar;
    },
    async getFacilityProductStores(params: any) {
      let productStores = [];
      const payload = {
        inputFields: { facilityId: params.facilityId },
        viewSize: 100,
        entityName: "ProductStoreFacility",
        filterByDate: "Y",
        fieldList: ["fromDate", "productStoreId"]
      };

      try {
        const resp = await FacilityService.getFacilityProductStores(payload);
        if (!commonUtil.hasError(resp) && resp.data.count) {
          productStores = resp.data.docs;
          const utilStore = useUtilStore();
          await utilStore.fetchShopifyShopForProductStores(resp.data.docs.map((productStore: any) => productStore.productStoreId));
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      this.current.productStores = productStores;
    },
    async fetchFacilityMappings(payload: any) {
      let mappings = [];
      try {
        const params = {
          inputFields: {
            facilityId: payload.facilityId,
            facilityIdenTypeId: payload.facilityIdenTypeIds,
            facilityIdenTypeId_op: "in"
          },
          entityName: "FacilityIdentification",
          filterByDate: "Y",
          fieldList: ["facilityIdenTypeId", "idValue", "fromDate"],
          viewSize: 100
        };
        const resp = await FacilityService.fetchFacilityMappings(params);
        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
          mappings = resp.data.docs;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error("Failed to fetch facility mappings", err);
      }
      this.current.mappings = mappings;
    },
    async getFacilityParties(payload: any) {
      let parties = [];
      const params = {
        inputFields: {
          facilityId: payload.facilityId,
          partyId_op: "not-empty",
          roleTypeId: "FAC_LOGIN",
          roleTypeId_op: "notEqual"
        },
        entityName: "FacilityAndParty",
        filterByDate: "Y",
        orderBy: "partyId DESC",
        fieldList: ["facilityId", "firstName", "fromDate", "lastName", "groupName", "partyId", "roleTypeId"],
        viewSize: 100
      };

      try {
        const resp = await FacilityService.getFacilityParties(params);
        if (!commonUtil.hasError(resp) && resp.data.count) {
          parties = resp.data.docs;
          parties.map((party: any) => {
            party.fullName = party.groupName || [party.firstName, party.lastName].filter(Boolean).join(" ") || party.partyId;
          });
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error("Failed to fetch facility parties", err);
      }
      this.current.parties = parties;
    },
    async fetchShopifyFacilityMappings(payload: any) {
      let shopifyFacilityMappings = [];
      try {
        const params = {
          inputFields: { facilityId: payload.facilityId },
          entityName: "ShopifyShopLocationView",
          fieldList: ["shopifyShopId", "domain", "name", "myshopifyDomain", "shopId", "shopifyLocationId"],
          viewSize: 100
        };
        const resp = await FacilityService.fetchShopifyFacilityMappings(params);
        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
          shopifyFacilityMappings = resp.data.docs;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error("Failed to fetch shopify facility mappings", err);
      }
      this.current.shopifyFacilityMappings = shopifyFacilityMappings;
    },
    async fetchFacilityLogins(payload: any) {
      let facilityLogins = [] as any;
      let dataList = [] as any;

      try {
        let resp = await FacilityService.getFacilityParties({
          inputFields: { "facilityId": payload.facilityId, "roleTypeId": "FAC_LOGIN" },
          fieldList: ["facilityId", "partyId", "roleTypeId", "fromDate"],
          entityName: "FacilityParty",
          distinct: "Y",
          noConditionFind: "Y",
          filterByDate: "Y",
          viewSize: 50
        });
        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
          const facilityParties = resp.data.docs;
          dataList = facilityParties;
          const partyIds = facilityParties.map((party: any) => party.partyId);
          dataList = [...dataList, ...await UserService.fetchLogoImageForParties(partyIds)];

          resp = await UserService.fetchUserLoginAndPartyDetails({
            inputFields: { "partyId": partyIds, "partyId_op": "in" },
            fieldList: ["partyId", "groupName", "userLoginId"],
            entityName: "UserLoginAndPartyDetails",
            distinct: "Y",
            noConditionFind: "Y",
            viewSize: 50
          });
          if (!commonUtil.hasError(resp) && resp.data.count > 0) {
            dataList = [...dataList, ...resp.data.docs];
            resp = await UserService.fetchUserContactDetails({
              inputFields: { "partyId": partyIds, "partyId_op": "in", contactMechPurposeTypeId: "PRIMARY_EMAIL" },
              viewSize: 100,
              filterByDate: "Y",
              entityName: "PartyContactDetailByPurpose",
              fieldList: ["partyId", "infoString", "contactMechId", "contactMechPurposeTypeId"]
            });
            if (!commonUtil.hasError(resp) && resp.data.count > 0) {
              dataList = [...dataList, ...resp.data.docs];
            }
            const facilityPartyData = dataList.reduce((partyData: any, doc: any) => {
              const partyId = doc.partyId;
              partyData[partyId] = { ...partyData[partyId], ...doc };
              return partyData;
            }, {});
            facilityLogins = Object.values(facilityPartyData);
          }
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error("Failed to fetch facility parties", err);
      }
      this.current.logins = facilityLogins;
    },
    async fetchVirtualFacilities(payload: any) {
      if (payload.viewIndex === 0) emitter.emit("presentLoader");
      let archivedFacilityIds = [];
      if (this.archivedFacilities.length) {
        archivedFacilityIds = JSON.parse(JSON.stringify(this.archivedFacilities)).map((facility: any) => facility.facilityId);
      }

      let facilities = JSON.parse(JSON.stringify(this.virtualFacilities.list)), total = 0;
      try {
        const params = {
          inputFields: {
            parentFacilityTypeId_value: "VIRTUAL_FACILITY",
            parentFacilityTypeId_op: "equals",
            parentFacilityTypeId_grp: "1",
            facilityTypeId_value: "VIRTUAL_FACILITY",
            facilityTypeId_op: "equals",
            facilityTypeId_grp: "2"
          },
          orderBy: "facilityName ASC",
          entityName: "FacilityAndProductStore",
          distinct: "Y",
          fieldList: ["facilityId", "facilityName", "description", "facilityTypeId", "parentFacilityTypeId"],
          ...payload
        };
        const resp = await FacilityService.fetchFacilities(params);
        if (!commonUtil.hasError(resp) && resp.data.count) {
          if (payload.viewIndex && payload.viewIndex > 0) {
            facilities = facilities.concat(resp.data.docs);
          } else {
            facilities = resp.data.docs;
          }
          total = resp.data.count;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }

      emitter.emit("dismissLoader");
      const filteredFacilities = await this.filterParkingFacilities({ facilities, archivedFacilityIds });
      this.virtualFacilities = { list: filteredFacilities, total };
      if (filteredFacilities.length) {
        await this.fetchVirtualFacilitiesAdditionalDetail(payload);
      }
    },
    async filterParkingFacilities({ facilities, archivedFacilityIds }: any) {
      const matchedFacilities = facilities.filter((facility: any) => archivedFacilityIds.includes(facility.facilityId));
      const updatedFacilities = facilities.filter((facility: any) => !archivedFacilityIds.includes(facility.facilityId));
      if (matchedFacilities.length) this.updateArchivedFacilities(matchedFacilities);
      return updatedFacilities;
    },
    async fetchVirtualFacilitiesAdditionalDetail(payload: any) {
      const cachedFacilities = JSON.parse(JSON.stringify(this.virtualFacilities.list));
      let stateFacilities = JSON.parse(JSON.stringify(this.virtualFacilities.list));
      const total = this.virtualFacilities.total;

      const facilityIds: Array<string> = [];
      const facilities = cachedFacilities.splice(payload.viewIndex * (import.meta.env.VITE_APP_VIEW_SIZE as any), import.meta.env.VITE_APP_VIEW_SIZE);
      facilities.map((facility: any) => facilityIds.push(facility.facilityId));

      stateFacilities = stateFacilities.filter((facility: any) => !facilityIds.includes(facility.facilityId));

      try {
        const [jobData, facilitiesOrderCount] = await Promise.all([FacilityService.fetchJobData(), FacilityService.fetchOrderCountsByFacility(facilityIds)]);
        facilities.map((facility: any) => {
          if (facility.facilityId === "_NA_") {
            facility.brokeringJob = jobData.brokeringJob;
          } else if (facility.facilityTypeId === "BACKORDER" || facility.facilityTypeId === "PRE_ORDER") {
            facility.autoReleaseJob = jobData.autoReleaseJob;
          }
          facility.orderCount = facilitiesOrderCount[facility.facilityId] || 0;
        });
      } catch (error) {
        logger.error(error);
      }
      this.virtualFacilities = { list: stateFacilities.concat(facilities), total };
    },
    async fetchVirtualFacility(payload: any) {
      let facility = {};
      try {
        const resp = await FacilityService.fetchFacilities({
          inputFields: { facilityId: payload.facilityId },
          entityName: "FacilityAndProductStore",
          fieldList: ["facilityId", "facilityName", "description", "facilityTypeId", "parentFacilityTypeId"],
          filterByDate: "Y",
          viewSize: 1
        });
        if (!commonUtil.hasError(resp) && resp.data.count) {
          facility = resp.data.docs[0];
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      const facilities = [...this.virtualFacilities.list, facility];
      this.virtualFacilities = { list: facilities, total: facilities.length };
      if (facilities.length) {
        await this.fetchVirtualFacilitiesAdditionalDetail(payload);
      }
    },
    updateVirtualFacilities(facilities: any) {
      this.virtualFacilities = { list: facilities, total: facilities.length };
    },
    async fetchArchivedFacilities() {
      let facilities = [];
      try {
        facilities = await FacilityService.fetchArchivedFacilities();
      } catch (error) {
        logger.error(error);
      }
      this.updateArchivedFacilities(facilities);
    },
    updateArchivedFacilities(facilities: any) {
      this.archivedFacilities = facilities;
    },
    async fetchFacilityGroups(payload: any) {
      if (payload.viewIndex === 0) emitter.emit("presentLoader");
      const filters = {} as any;
      if (this.groupQuery.queryString) {
        filters["facilityGroupId_value"] = this.groupQuery.queryString;
        filters["facilityGroupId_op"] = "contains";
        filters["facilityGroupId_ic"] = "Y";
        filters["facilityGroupId_grp"] = "1";
        filters["facilityGroupName_value"] = this.groupQuery.queryString;
        filters["facilityGroupName_op"] = "contains";
        filters["facilityGroupName_ic"] = "Y";
        filters["facilityGroupName_grp"] = "2";
      }

      let groups = JSON.parse(JSON.stringify(this.facilityGroups.list)), total = 0;
      try {
        const params = {
          inputFields: { ...filters },
          entityName: "FacilityGroup",
          noConditionFind: "Y",
          orderBy: "facilityGroupName ASC",
          fieldList: ["facilityGroupId", "facilityGroupTypeId", "facilityGroupName", "description"],
          ...payload
        };
        const resp = await FacilityService.fetchFacilityGroups(params);
        if (!commonUtil.hasError(resp) && resp.data.count) {
          if (payload.viewIndex && payload.viewIndex > 0) {
            groups = groups.concat(resp.data.docs);
          } else {
            groups = resp.data.docs;
          }
          total = resp.data.count;
        } else {
          if (payload.viewIndex === 0) groups = [];
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      emitter.emit("dismissLoader");
      this.facilityGroups = { list: groups, total };
      if (groups.length) {
        await this.fetchFacilityGroupsAdditionalDetails(payload);
      }
    },
    async fetchFacilityGroupsAdditionalDetails(payload: any) {
      const cachedGroups = JSON.parse(JSON.stringify(this.facilityGroups.list));
      let stateGroups = JSON.parse(JSON.stringify(this.facilityGroups.list));
      const total = this.facilityGroups.total;

      const facilityGroupIds: Array<string> = [];
      const groups = cachedGroups.splice(payload.viewIndex * (import.meta.env.VITE_APP_VIEW_SIZE as any), import.meta.env.VITE_APP_VIEW_SIZE);
      groups.map((group: any) => facilityGroupIds.push(group.facilityGroupId));

      stateGroups = stateGroups.filter((group: any) => !facilityGroupIds.includes(group.facilityGroupId));

      try {
        const facilityCountByGroup = await FacilityService.fetchFacilityCountByGroup(JSON.parse(JSON.stringify(facilityGroupIds)));
        groups.map((group: any) => {
          group.facilityCount = facilityCountByGroup[group.facilityGroupId] || 0;
        });
        const productStoreCountByGroup = await FacilityService.fetchProductStoreCountByGroup(facilityGroupIds);
        groups.map((group: any) => {
          group.productStoreCount = productStoreCountByGroup[group.facilityGroupId] || 0;
        });
      } catch (error) {
        logger.error(error);
      }
      this.facilityGroups = { list: stateGroups.concat(groups), total };
    },
    updateFacilityGroups(groups: any) {
      this.facilityGroups = { list: groups, total: groups.length };
    }
  }
});
