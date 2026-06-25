import { defineStore } from "pinia";
import emitter from "@/event-bus";
import { api, client, commonUtil } from "@common";
import logger from "@/logger";
import { useUtilStore } from "./util";
import { useUserStore } from "./user";
import { DateTime } from 'luxon';
import { prepareOrderQuery } from '@/utils/solrHelper';

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
    async createFacility(payload: any) {
      return api({
        url: "admin/facilities",
        method: "post",
        data: payload
      })
    },
    async createFacilityLocation(payload: any) {
      return api({
        url: `oms/facilities/${payload.facilityId}/locations`,
        method: "post",
        data: payload
      });
    },
    async createFacilityPostalAddress(payload: any) {
      return api({
        url: `oms/facilityContactMechs/facilityAddress`,
        method: "post",
        data: {
          ...payload,
          facilityId: payload.facilityId,
          contactMechPurposeTypeId: 'PRIMARY_LOCATION'
        }
      })
    },
    async fetchFacilityGroups(params: any) {
      return api({
        url: 'admin/facilityGroups',
        method: 'get',
        params: params
      });
    },
    async fetchFacilityGroup(facilityGroupId: string) {
      return api({ url: `oms/facilityGroups/${facilityGroupId}`, method: "get" });
    },

    async createFacilityEmailAddress(payload: any) {
      return api({
        url: `oms/facilityContactMechs/facilityEmail`,
        method: "post",
        data: payload
      })
    },
    async createFacilityTelecomNumber(payload: any) {
      return api({
        url: `oms/facilityContactMechs/facilityPhone`,
        method: "post",
        data: payload
      })
    },
    async addFacilityToGroup(payload: any) {
      return api({
        url: `oms/facilities/${payload.facilityId}/groups`,
        method: "post",
        data: payload
      })
    },
    async fetchFacilityGroupInformation(facilityIds: string[]) {
      let facilitiesGroupInformation = {} as any;
      try {
        const resp = await api({
          url: "oms/dataDocumentView",
          method: "post",
          data: {
            dataDocumentId: "FacilityGroupAndMember",
            customParametersMap: { facilityId: facilityIds, facilityId_op: "in", pageNoLimit: true },
            fieldsToSelect: 'facilityGroupId,facilityId,facilityGroupTypeId,fromDate,description,facilityGroupName',
            distinct: true,
            filterByDate: true,
          }
        });
        if (resp.data?.entityValueList?.length > 0) {
          facilitiesGroupInformation = resp.data.entityValueList.reduce((acc: any, item: any) => {
            if (acc[item.facilityId]) acc[item.facilityId].push(item);
            else acc[item.facilityId] = [item];
            return acc;
          }, {});
        }
      } catch (err) {
        logger.error(err);
      }
      return facilitiesGroupInformation;
    },
    async fetchFacilitiesAdditionalInformation(payload = { viewIndex: 0 }) {
      const cachedFacilities = this.facilities.list ? JSON.parse(JSON.stringify(this.facilities.list)) : [];
      let stateFacilities = this.facilities.list ? JSON.parse(JSON.stringify(this.facilities.list)) : [];
      const total = this.facilities.total;

      const facilityIds: Array<string> = [];
      const facilities = cachedFacilities.splice(payload.viewIndex * (import.meta.env.VITE_APP_VIEW_SIZE as any), import.meta.env.VITE_APP_VIEW_SIZE);
      facilities.map((facility: any) => facilityIds.push(facility.facilityId));

      stateFacilities = stateFacilities.filter((facility: any) => !facilityIds.includes(facility.facilityId));

      let facilitiesGroupInformation = {} as any;
      let facilitiesOrderCount = {} as any;

      try {
        // Inlining fetchFacilityGroupInformation logic
        let groupResp: any, groupViewIndex = 0;
        do {
          groupResp = await api({
            url: "oms/dataDocumentView",
            method: "post",
            data: {
              dataDocumentId: "FacilityGroupAndMember",
              customParametersMap: {
                facilityId: facilityIds,
                facilityId_op: "in",
                pageSize: 250,
                pageIndex: groupViewIndex
              },
              fieldsToSelect: 'facilityGroupId,facilityId,facilityGroupTypeId,fromDate,description,facilityGroupName',
              distinct: true,
              filterByDate: true,
            }
          });

          if (groupResp.data && groupResp.data.entityValueList.length > 0) {
            const newInformation = groupResp.data.entityValueList.reduce((acc: any, item: any) => {
              if (acc[item.facilityId]) {
                acc[item.facilityId].push(item);
              } else {
                acc[item.facilityId] = [item];
              }
              return acc;
            }, {});
            facilitiesGroupInformation = { ...facilitiesGroupInformation, ...newInformation };
          }
          groupViewIndex++;
        } while (groupResp.data.entityValueList?.length >= 250);

        // Inlining fetchFacilitiesOrderCount logic
        const orderCountResp: any = await api({
          url: "admin/facilities/orderCount",
          method: "get",
          params: {
            facilityId: facilityIds,
            facilityId_op: "in",
            entryDate: DateTime.now().toFormat('yyyy-MM-dd'),
            pageSize: facilityIds.length
          }
        });

        if (orderCountResp.data && orderCountResp.data.length > 0) {
          facilitiesOrderCount = orderCountResp.data.reduce((acc: any, item: any) => {
            acc[item.facilityId] = item.lastOrderCount;
            return acc;
          }, {});
        }
      } catch (err) {
        logger.error(err);
      }

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
      if (payload.pageIndex === 0) emitter.emit("presentLoader");
      const filters = {
        "parentFacilityTypeId": "VIRTUAL_FACILITY",
        "parentFacilityTypeId_not": "Y",
        "facilityTypeId": "VIRTUAL_FACILITY",
        "facilityTypeId_not": "Y",
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
        filters["keyword"] = this.facilityQuery.queryString;
      }

      if (this.facilityQuery.facilityGroupId) {
        filters["facilityGroupId"] = this.facilityQuery.facilityGroupId;
        filters["facilityGroupId_op"] = "equals";
      }

      const params = {
        ...filters,
        fieldsToSelect: "facilityId,facilityName,facilityTypeId,maximumOrderLimit,defaultDaysToShip,externalId,primaryFacilityGroupId,parentFacilityTypeId,closedDate,facilityTimeZone",
        ...payload
      };

      let facilities = this.facilities.list ? JSON.parse(JSON.stringify(this.facilities.list)) : [];
      let total = 0;

      try {
        const resp = await api({
          url: "oms/facilities/facilityView",
          method: "get",
          params
        });
        if (!commonUtil.hasError(resp) && resp.data.count > 0) {
          if (payload.pageIndex && payload.pageIndex > 0) {
            facilities = facilities.concat(resp.data.facilities);
          } else {
            facilities = resp.data.facilities;
          }
          total = resp.data.count;
        } else {
          throw resp.data;
        }
      } catch (error) {
        if (payload.pageIndex === 0) {
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

      let facilitiesGroupInformation = {} as any;
      let facilitiesOrderCount = {} as any;

      try {
        // Inlining fetchFacilityGroupInformation logic
        const groupResp: any = await api({
          url: "oms/dataDocumentView",
          method: "post",
          data: {
            dataDocumentId: "FacilityGroupAndMember",
            customParametersMap: {
              facilityId: facility.facilityId,
              pageNoLimit: true
            },
            fieldsToSelect: 'facilityGroupId,facilityId,facilityGroupTypeId,fromDate,description,facilityGroupName',
            distinct: true,
            filterByDate: true,
          }
        });

        if (groupResp.data?.entityValueList?.length > 0) {
          facilitiesGroupInformation = groupResp.data.entityValueList.reduce((acc: any, item: any) => {
            if (acc[item.facilityId]) {
              acc[item.facilityId].push(item);
            } else {
              acc[item.facilityId] = [item];
            }
            return acc;
          }, {});
        }

        // Inlining fetchFacilitiesOrderCount logic
        const orderCountResp: any = await api({
          url: "admin/facilities/orderCount",
          method: "get",
          data: {
            facilityId: facility.facilityId,
            entryDate: DateTime.now().toFormat('yyyy-MM-dd'),
            pageSize: 1
          }
        });

        if (orderCountResp.data && orderCountResp.data.length > 0) {
          facilitiesOrderCount = orderCountResp.data.reduce((acc: any, item: any) => {
            acc[item.facilityId] = item.lastOrderCount;
            return acc;
          }, {});
        }
      } catch (err) {
        logger.error(err);
      }

      const fulfillmentOrderLimit = facility.maximumOrderLimit;
      if (fulfillmentOrderLimit === 0) {
        facility.orderLimitType = "no-capacity";
      } else if (fulfillmentOrderLimit) {
        facility.orderLimitType = "custom";
      } else {
        facility.orderLimitType = "unlimited";
      }

      facility.orderCount = facilitiesOrderCount[facility.facilityId] ? facilitiesOrderCount[facility.facilityId] : 0;
      const facilityGroupInfo = facilitiesGroupInformation[facility.facilityId];
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
      console.log("facility", facility);
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
        facilityId: payload.facilityId,
        fieldsToSelect: "facilityId,facilityName,facilityTypeId,maximumOrderLimit,defaultDaysToShip,externalId,primaryFacilityGroupId,parentFacilityTypeId,closedDate,facilityTimeZone",
        pageSize: 1
      };

      let facility = {} as any;
      try {
        const resp = await api({
          url: "oms/facilities/facilitiesAndProductStore",
          method: "get",
          params
        });
        if (resp.data?.facilities && resp.data.facilities.length > 0) {
          facility = resp.data.facilities[0];
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }
      console.log("=-=-=-=-=-=-=-=cfacility", facility);
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
        contactMechPurposeTypeId: "PRIMARY_PHONE,PRIMARY_EMAIL,PRIMARY_LOCATION,GOOGLE_MAP_URL",
        contactMechPurposeTypeId_op: "in",
        contactMechTypeId: "TELECOM_NUMBER,EMAIL_ADDRESS,POSTAL_ADDRESS,MAP_URL",
        contactMechTypeId_op: "in",
        facilityId: facility.facilityId,
        orderByField: "fromDate DESC",
        fieldsToSelect: "address1,address2,city,contactMechId,contactMechTypeId,infoString,contactNumber,countryCode,countryGeoId,countryGeoName,directions,infoString,latitude,longitude,postalCode,stateGeoId,stateGeoName,toName",
        pageSize: 4
      };

      try {
        const resp = await api({
          url: `oms/facilities/${facility.facilityId}/contacts`,
          method: "get",
          params: payload
        });
        if (resp.data && resp.data.facilityContactDetails?.length) {
          const docs = resp.data.facilityContactDetails;
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
          facilityId: payload.facilityId,
          pageNoLimit: true
        };
        const resp = await api({
          url: `oms/facilities/${payload.facilityId}/locations`,
          method: "get",
          params
        });
        if (resp.data && resp.data.length > 0) {
          facilityLocations = resp.data;
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
        const resp = await api({
          url: `oms/facilities/${payload.facilityId}/calendars/operatingHours`,
          method: "get",
        });
        if (!commonUtil.hasError(resp) && resp.data.storeOperatingHours?.length) {
          facilityCalendar = resp.data.storeOperatingHours[0];
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error(err);
      }
      this.current.calendar = facilityCalendar;
    },
    async fetchFacilityProductStores(params: any) {
      let productStores = [];
      const payload = {
        dataDocumentId: 'PRODUCT_STORE_FACILITY',
        customParametersMap: { facilityId: params.facilityId, pageNoLimit: true },
        filterByDate: true,
        fieldsToSelect: "fromDate,facilityId,productStoreId"
      };

      try {
        const resp = await api({
          url: "oms/dataDocumentView",
          method: "POST",
          data: payload
        });
        if (resp.data && resp.data.entityValueList?.length > 0) {
          productStores = resp.data.entityValueList;
          const utilStore = useUtilStore();
          await utilStore.fetchShopifyShopForProductStores(resp.data.entityValueList.map((productStore: any) => productStore.productStoreId));
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
          dataDocumentId: "FACILITY_IDENTIFICATION",
          customParametersMap: {
            facilityId: payload.facilityId,
            facilityIdenTypeId: payload.facilityIdenTypeIds,
            facilityIdenTypeId_op: "in",
            pageNolimit: true
          },
          fieldsToSelect: "facilityIdenTypeId,idValue,fromDate",
          filterByDate: true
        };
        const resp = await api({
          url: "oms/dataDocumentView",
          method: "post",
          data: params
        });
        if (resp.data && resp.data.entityValueList?.length > 0) {
          mappings = resp.data.entityValueList;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error("Failed to fetch facility mappings", err);
      }
      this.current.mappings = mappings;
    },
    async getPartyRoleAndPartyDetails(payload: {
      roleTypeId: string,
      roleTypeId_op?: string,
      roleTypeId_not?: string,
      keyword?: string,
      partyId?: string,
      partyId_op?: string,
      partyId_not?: string,
      fieldsToSelect?: string,
      pageSize?: number,
      pageIndex?: number,
      orderByField?: string
    }) {
      const { roleTypeId, ...params } = payload;
      return api({
        url: `oms/roles/${roleTypeId}/partyRoleAndPartyDetails`,
        method: "get",
        params
      });
    },
    async fetchFacilityParties(payload: any) {
      let parties = [];
      const params = {
        customParametersMap: {
          facilityId: payload.facilityId,
          partyId_op: "empty",
          partyId_not: "Y",
          roleTypeId: "FAC_LOGIN",
          roleTypeId_not: "Y",
          orderByField: "partyId DESC",
          pageNoLimit: true
        },
        dataDocumentId: "FACILITY_AND_PARTY",
        filterByDate: true,
        fieldsToSelect: "facilityId,firstName,fromDate,lastName,groupName,partyId,roleTypeId",
      };

      try {
        const resp = await api({
          url: "oms/dataDocumentView",
          method: "post",
          data: params
        });
        if (resp.data && resp.data.entityValueList?.length) {
          parties = resp.data.entityValueList;
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
          facilityId: payload.facilityId,
          pageNoLimit: true
        };
        const resp = await api({
          url: "oms/ShopFacilityMappings",
          method: "get",
          params
        });
        if (resp.data?.length > 0) {
          shopifyFacilityMappings = resp.data;
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
      try {
        const resp = await api({
          url: `oms/facilities/${payload.facilityId}/logins`,
          method: "get",
        });
        if (!commonUtil.hasError(resp) && resp.data.facilityLogins?.length) {
          facilityLogins = resp.data.facilityLogins;
        } else {
          throw resp.data;
        }
      } catch (err) {
        logger.error("Failed to fetch facility parties", err);
      }
      this.current.facilityLogins = facilityLogins;
    },
    async fetchVirtualFacilities(payload: any) {
      if (payload.viewIndex === 0) emitter.emit("presentLoader");
      let archivedFacilityIds = [] as any;
      if (this.archivedFacilities.length) {
        archivedFacilityIds = JSON.parse(JSON.stringify(this.archivedFacilities)).map((facility: any) => facility.facilityId);
      }

      let facilities = JSON.parse(JSON.stringify(this.virtualFacilities.list)), total = 0;
      try {
        const resp = await api({
          url: "oms/facilities/facilitiesAndProductStore",
          method: "get",
          params: {
            facilityType: "VIRTUAL_FACILITY",
            fieldsToSelect: "facilityId,facilityName,description,facilityTypeId,parentFacilityTypeId,fromDate",
            orderByField: "facilityName ASC",
            pageIndex: payload.viewIndex ?? 0,
            pageSize: payload.viewSize ?? import.meta.env.VITE_APP_VIEW_SIZE
          }
        });
        if (resp.data?.facilities && resp.data.facilities.length > 0) {
          if (payload.viewIndex && payload.viewIndex > 0) {
            facilities = facilities.concat(resp.data.facilities);
          } else {
            facilities = resp.data.facilities;
          }
          total = resp.data.count;
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error);
      }

      emitter.emit("dismissLoader");
      const matchedFacilities = facilities.filter((facility: any) => archivedFacilityIds.includes(facility.facilityId));
      const updatedFacilities = facilities.filter((facility: any) => !archivedFacilityIds.includes(facility.facilityId));
      if (matchedFacilities.length) this.updateArchivedFacilities(matchedFacilities);

      this.virtualFacilities = { list: updatedFacilities, total };
      if (updatedFacilities.length) {
        await this.fetchVirtualFacilitiesAdditionalDetail(payload);
      }
    },
    // TODO: Need to revisit this, this is OFBiz based entity api, migrate later.
    async fetchVirtualFacilitiesAdditionalDetail(payload: any) {
      const cachedFacilities = JSON.parse(JSON.stringify(this.virtualFacilities.list));
      let stateFacilities = JSON.parse(JSON.stringify(this.virtualFacilities.list));
      const total = this.virtualFacilities.total;

      const facilityIds: Array<string> = [];
      const facilities = cachedFacilities.splice(payload.viewIndex * (import.meta.env.VITE_APP_VIEW_SIZE as any), import.meta.env.VITE_APP_VIEW_SIZE);
      facilities.map((facility: any) => facilityIds.push(facility.facilityId));

      stateFacilities = stateFacilities.filter((facility: any) => !facilityIds.includes(facility.facilityId));

      let jobData = {} as any;
      let facilitiesOrderCount = {} as any;

      try {
        // Inlining fetchJobData
        const jobResp: any = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "performFind",
          method: "post",
          data: {
            inputFields: {
              "statusId": "SERVICE_PENDING",
              "systemJobEnumId": ["JOB_RLS_ORD_DTE", "JOB_BKR_ORD"],
              "systemJobEnumId_op": "in",
            },
            orderBy: "runTime ASC",
            entityName: "JobSandbox",
            fieldList: ["jobId", "statusId", "serviceName", "systemJobEnumId", "runTime"],
            viewSize: 10
          }
        });
        if (!commonUtil.hasError(jobResp) && jobResp.data.count > 0) {
          const jobs = jobResp.data.docs;
          const brokeringJob = jobs.find((job: any) => job.systemJobEnumId === 'JOB_BKR_ORD');
          const autoReleaseJob = jobs.find((job: any) => job.systemJobEnumId === 'JOB_RLS_ORD_DTE');
          jobData = { brokeringJob, autoReleaseJob };
        }

        // Inlining fetchOrderCountsByFacility
        const query = prepareOrderQuery({
          viewSize: "0",
          sort: 'orderDate asc',
          defType: "edismax",
          docType: "ORDER",
          filters: {
            '-shipmentMethodTypeId': { value: 'STOREPICKUP' },
            orderStatusId: { value: '(ORDER_APPROVED OR ORDER_CREATED)' },
            orderTypeId: { value: 'SALES_ORDER' },
            facilityId: { value: facilityIds }
          },
          facet: {
            "facilityFacet": {
              "field": "facilityId",
              "mincount": 1,
              "limit": -1,
              "sort": "index",
              "type": "terms",
              "facet": {
                "groups": "unique(orderId)",
              }
            }
          }
        });
        const orderResp: any = await api({
          baseURL: commonUtil.getOmsURL(),
          url: "solr-query",
          method: "post",
          data: query
        });
        if (!commonUtil.hasError(orderResp)) {
          const facilityFacets = orderResp.data.facets.facilityFacet.buckets;
          facilitiesOrderCount = facilityFacets.reduce((countObject: any, facet: any) => {
            countObject[facet.val] = facet.groups;
            return countObject;
          }, {});
        }
      } catch (error) {
        logger.error(error);
      }

      facilities.map((facility: any) => {
        if (facility.facilityId === "_NA_") {
          facility.brokeringJob = jobData.brokeringJob;
        } else if (facility.facilityTypeId === "BACKORDER" || facility.facilityTypeId === "PRE_ORDER") {
          facility.autoReleaseJob = jobData.autoReleaseJob;
        }
        facility.orderCount = facilitiesOrderCount[facility.facilityId] || 0;
      });
      this.virtualFacilities = { list: stateFacilities.concat(facilities), total };
    },
    async fetchVirtualFacility(payload: any) {
      let facility = {};
      try {
        const resp = await api({
          url: "oms/facilities/facilitiesAndProductStore",
          method: "get",
          params: { facilityId: payload.facilityId, pageSize: 1 }
        });
        if (!commonUtil.hasError(resp) && resp.data.facilities?.length) {
          facility = resp.data.facilities[0];
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
      let facilities = [] as any;
      try {
        const resp = await api({
          url: "oms/dataDocumentView",
          method: "post",
          data: {
            dataDocumentId: "FacilityGroupAndMember",
            customParametersMap: {
              facilityGroupId: "ARCHIVE",
              pageNoLimit: true
            },
            filterByDate: true,
            fieldsToSelect: "facilityName,facilityGroupId,facilityId,facilityGroupTypeId,fromDate",
          }
        });
        if (!commonUtil.hasError(resp) && resp.data?.entityValueList?.length) {
          facilities = resp.data.entityValueList;
        }
      } catch (error) {
        logger.error('Failed to fetch archived facilities.', error);
      }
      this.updateArchivedFacilities(facilities);
    },
    updateArchivedFacilities(facilities: any) {
      this.archivedFacilities = facilities;
    },
    async fetchFacilityGroupsByQuery(payload: any) {
      if (payload.viewIndex === 0) emitter.emit("presentLoader");

      let groups = JSON.parse(JSON.stringify(this.facilityGroups.list)), total = 0;
      try {
        const resp = await api({
          url: "oms/facilityGroups/search",
          method: "get",
          params: {
            keyword: this.groupQuery.queryString || undefined,
            pageIndex: payload.viewIndex ?? 0,
            pageSize: payload.viewSize ?? import.meta.env.VITE_APP_VIEW_SIZE
          }
        });
        if (!commonUtil.hasError(resp) && resp.data.count) {
          if (payload.viewIndex && payload.viewIndex > 0) {
            groups = groups.concat(resp.data.facilityGroups);
          } else {
            groups = resp.data.facilityGroups;
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

      let facilityCountByGroup = {} as any;
      let productStoreCountByGroup = {} as any;

      try {
        // Inlining fetchFacilityCountByGroup
        if (facilityGroupIds.length) {
          let facilityMemberResponses = [] as any;
          let groupViewIndex = 0;
          let groupResp = {} as any;
          do {
            groupResp = await api({
              url: "oms/dataDocumentView",
              method: "post",
              data: {
                dataDocumentId: "FacilityGroupAndMember",
                customParametersMap: {
                  facilityGroupId: facilityGroupIds,
                  facilityGroupId_op: "in",
                  pageSize: 250,
                  pageIndex: groupViewIndex
                },
                fieldsToSelect: "facilityGroupId,facilityId",
                filterByDate: true,
              }
            });

            if (!commonUtil.hasError(groupResp) && groupResp.data?.entityValueList?.length > 0) {
              facilityMemberResponses = [...facilityMemberResponses, ...groupResp.data.entityValueList];
              groupViewIndex++;
            }
          } while (groupResp.data?.entityValueList?.length >= 250);

          facilityCountByGroup = facilityMemberResponses.reduce((acc: any, item: any) => {
            acc[item.facilityGroupId] = (acc[item.facilityGroupId] || 0) + 1;
            return acc;
          }, {});
        }

        // Inlining fetchProductStoreCountByGroup
        if (facilityGroupIds.length) {
          const idsCopy = [...facilityGroupIds];
          const requests: any[] = [];
          while (idsCopy.length) {
            const batch = idsCopy.splice(0, 10);
            requests.push({
              customParametersMap: {
                facilityGroupId: batch,
                facilityGroupId_op: "in",
                pageSize: 250
              },
              filterByDate: true,
              fieldsToSelect: "facilityGroupId,productStoreId",
            });
          }

          const psResponses = await Promise.allSettled(requests.map((p) => api({
            url: "oms/dataDocumentView",
            method: "post",
            data: {
              dataDocumentId: "PRODUCT_STORE_FACILITY_GROUP",
              ...p
            }
          })));

          const allPsData = psResponses.flatMap((r: any) =>
            r.status === "fulfilled" && !commonUtil.hasError(r.value) ? r.value.data?.entityValueList || [] : []
          );

          productStoreCountByGroup = allPsData.reduce((acc: any, item: any) => {
            acc[item.facilityGroupId] = (acc[item.facilityGroupId] || 0) + 1;
            return acc;
          }, {});
        }

        groups.map((group: any) => {
          group.facilityCount = facilityCountByGroup[group.facilityGroupId] || 0;
          group.productStoreCount = productStoreCountByGroup[group.facilityGroupId] || 0;
        });
      } catch (error) {
        logger.error(error);
      }
      this.facilityGroups = { list: stateGroups.concat(groups), total };
    },
    updateFacilityGroups(groups: any) {
      this.facilityGroups = { list: groups, total: groups.length };
    },
    async updateFacility(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}`, method: "put", data: payload });
    },
    async updateFacilityLocation(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/locations`, method: "post", data: payload });
    },
    async deleteFacilityLocation(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/locations/${payload.locationSeqId}`, method: "delete" });
    },
    async updateFacilityPostalAddress(payload: any) {
      return api({ url: "oms/facilityContactMechs/facilityAddress", method: "put", data: payload });
    },
    async updateFacilityTelecomNumber(payload: any) {
      return api({ url: "oms/facilityContactMechs/facilityPhone", method: "put", data: payload });
    },
    async updateFacilityEmailAddress(payload: any) {
      return api({ url: "oms/facilityContactMechs/facilityEmail", method: "put", data: payload });
    },
    async createFacilityIdentification(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/identifications`, method: "post", data: payload });
    },
    async addPartyToFacility(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/parties`, method: "post", data: payload });
    },
    async createEnumeration(payload: any) {
      return api({ url: "admin/enums", method: "post", data: payload });
    },
    async createShopifyShopLocation(payload: any) {
      return api({ url: `oms/shopifyShops/${payload.shopId}/locations`, method: "post", data: payload });
    },
    async updateShopifyShopLocation(payload: any) {
      return api({ url: `oms/shopifyShops/${payload.shopId}/locations`, method: "post", data: payload });
    },
    async removeFacilityCalendar(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/calendars`, method: "post", data: { ...payload, thruDate: DateTime.now().toMillis() } });
    },
    async fetchFacilityPartyRoles(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/parties`, method: "get", params: { partyId: payload.partyId, filterByDate: true } });
    },
    async fetchFacilityOrderCounts(facilityId: string) {
      return api({ url: "oms/facilities/facilityOrderCounts", method: "get", params: { facilityId, orderByField: "entryDate DESC", pageSize: 10 } });
    },
    async updateFacilityToGroup(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/groups/${payload.facilityGroupId}`, method: "put", data: payload });
    },
    async createProductStoreFacility(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/productStores`, method: "post", data: payload });
    },
    async updateProductStoreFacility(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/productStores/${payload.productStoreId}`, method: "put", data: payload });
    },
    async removePartyFromFacility(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/parties`, method: "delete", data: payload });
    },
    async createFacilityCalendar(payload: any) {
      const { description, ...weekTimings } = payload;
      return api({
        url: "oms/calendars/techData/week",
        method: "post",
        data: {
          ...weekTimings,
          "org.apache.ofbiz.manufacturing.techdata.TechDataCalendar": { description }
        }
      });
    },
    async associateCalendarToFacility(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/calendars`, method: "post", data: payload });
    },
    async updateFacilityIdentification(payload: any) {
      return api({ url: `oms/facilities/${payload.facilityId}/identifications`, method: "post", data: payload });
    },
    async createFacilityContactMech(payload: any) {
      return api({ url: "oms/facilityContactMechs/facilityMapUrl", method: "post", data: payload });
    },
    async updateFacilityContactMech(payload: any) {
      return api({ url: "oms/facilityContactMechs/facilityMapUrl", method: "put", data: payload });
    },
    async deleteFacilityContactMech(payload: any) {
      return api({ url: "oms/facilityContactMechs/facilityMapUrl", method: "delete", data: payload });
    },
    async deleteShopifyShopLocation(payload: any) {
      return api({ url: `oms/shopifyShops/locations/${payload.shopId}/${payload.facilityId}`, method: "delete" });
    },
    async createFacilityGroup(payload: any) {
      return api({ url: "oms/facilityGroups", method: "post", data: payload });
    },
    async updateFacilityGroup(payload: any) {
      return api({ url: `oms/facilityGroups/${payload.facilityGroupId}`, method: "put", data: payload });
    },
    async fetchGroupProductStores(payload: any) {
      return api({
        url: "oms/dataDocumentView",
        method: "post",
        data: {
          dataDocumentId: "PRODUCT_STORE_FACILITY_GROUP",
          customParametersMap: payload
        }
      });
    },
    async createProductStoreFacilityGroup(payload: any) {
      return api({ url: `oms/productStores/${payload.productStoreId}/facilityGroups`, method: "post", data: payload });
    },
    async updateProductStoreFacilityGroup(payload: any) {
      return api({ url: `oms/productStores/${payload.productStoreId}/facilityGroups`, method: "post", data: payload });
    },
    async fetchProductStoreCountByGroup(facilityGroupIds: string[]) {
      if (!facilityGroupIds.length) return {};
      const idsCopy = [...facilityGroupIds];
      const requests: Promise<any>[] = [];
      while (idsCopy.length) {
        const batch = idsCopy.splice(0, 10);
        requests.push(api({
          url: "oms/dataDocumentView",
          method: "post",
          data: {
            dataDocumentId: "PRODUCT_STORE_FACILITY_GROUP",
            customParametersMap: {
              facilityGroupId: batch,
              facilityGroupId_op: "in",
              pageSize: 250
            },
            filterByDate: true,
            fieldsToSelect: "facilityGroupId,productStoreId",
          }
        }));
      }
      const responses = await Promise.allSettled(requests);
      const allData = responses.flatMap((r: any) =>
        r.status === "fulfilled" && !commonUtil.hasError(r.value) ? r.value.data?.entityValueList || [] : []
      );
      return allData.reduce((acc: any, item: any) => {
        acc[item.facilityGroupId] = (acc[item.facilityGroupId] || 0) + 1;
        return acc;
      }, {});
    },
    async fetchAllFacilities() {
      return api({ url: "oms/facilities", method: "get", params: { pageNoLimit: true } });
    },
    async fetchAssociatedFacilitiesToGroup(payload: any) {
      return api({
        url: "oms/dataDocumentView",
        method: "post",
        data: {
          dataDocumentId: "FacilityGroupAndMember",
          customParametersMap: payload
        }
      });
    },
    async addFacilitiesToGroup(payload: any) {
      return api({ url: `oms/facilityGroups/${payload.facilityGroupId}/members`, method: "post", data: payload });
    },
    async updateFacilitiesToGroup(payload: any) {
      return api({ url: `oms/facilityGroups/${payload.facilityGroupId}/members`, method: "put", data: payload });
    }
  },
  persist: true
});
