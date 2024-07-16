import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import FacilityState from './FacilityState'
import emitter from '@/event-bus'
import { FacilityService } from '@/services/FacilityService'
import { UserService } from '@/services/UserService'
import { hasError } from '@/adapter'
import * as types from './mutation-types'
import logger from '@/logger'

const actions: ActionTree<FacilityState, RootState> = {
  async fetchFacilitiesAdditionalInformation({ commit, state }, payload = { viewIndex: 0 }) {

    // getting all the facilties from state
    const cachedFacilities = JSON.parse(JSON.stringify(state.facilities.list)); // maintaining cachedFacilities as to prepare the facilities payload to fetch additional information
    let stateFacilities = JSON.parse(JSON.stringify(state.facilities.list)); // maintaining stateFacilities as to update the facility information once information in fetched
    const total = state.facilities.total

    const facilityIds: Array<string> = [];

    // splitting the facilities in batches to fetch the additional facilities information
    const facilities = cachedFacilities.splice(payload.viewIndex * (process.env.VUE_APP_VIEW_SIZE as any), process.env.VUE_APP_VIEW_SIZE)
    facilities.map((facility: any) => facilityIds.push(facility.facilityId))

    stateFacilities = stateFacilities.filter((facility: any) => !facilityIds.includes(facility.facilityId))

    const [facilitiesGroupInformation, facilitiesOrderCount] = await Promise.all([FacilityService.fetchFacilityGroupInformation(facilityIds), FacilityService.fetchFacilitiesOrderCount(facilityIds)])

    facilities.map((facility: any) => {
      const fulfillmentOrderLimit = facility.maximumOrderLimit
      if (fulfillmentOrderLimit === 0) {
        facility.orderLimitType = 'no-capacity'
      } else if (fulfillmentOrderLimit) {
        facility.orderLimitType = 'custom'
      } else {
        facility.orderLimitType = 'unlimited'
      }

      facility.orderCount = facilitiesOrderCount[facility.facilityId] ? facilitiesOrderCount[facility.facilityId] : 0;

      const facilityGroupInformation = facilitiesGroupInformation[facility.facilityId]

      if(facilityGroupInformation?.length) {
        facility.groupInformation = facilityGroupInformation
        facility.sellOnline = (facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'FAC_GRP'))
        facility.useOMSFulfillment = (facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'OMS_FULFILLMENT'))
        facility.generateShippingLabel = (facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'AUTO_SHIPPING_LABEL'))
        facility.allowPickup = (facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'PICKUP'))
      }
    })

    commit(types.FACILITY_LIST_UPDATED, { facilities: stateFacilities.concat(facilities), total })
  },

  async fetchFacilities({ commit, dispatch, state }, payload) {
    if (payload.viewIndex === 0) emitter.emit("presentLoader");
    const filters = {
      'parentFacilityTypeId': 'VIRTUAL_FACILITY',
      'parentFacilityTypeId_op': 'notEqual',
      'facilityTypeId': 'VIRTUAL_FACILITY',
      'facilityTypeId_op': 'notEqual',
    } as any

    if(state.facilityQuery.productStoreId) {
      filters['productStoreId'] = state.facilityQuery.productStoreId
      filters['productStoreId_op'] = 'equals'
    }

    if(state.facilityQuery.facilityTypeId) {
      filters['facilityTypeId'] = state.facilityQuery.facilityTypeId
      filters['facilityTypeId_op'] = 'equals'
    }

    if(state.facilityQuery.queryString) {
      filters['facilityId_value'] = state.facilityQuery.queryString
      filters['facilityId_op'] = 'contains'
      filters['facilityId_ic'] = 'Y'
      filters['facilityId_grp'] = '1'
      filters['facilityName_value'] = state.facilityQuery.queryString
      filters['facilityName_op'] = 'contains'
      filters['facilityName_ic'] = 'Y'
      filters['facilityName_grp'] = '1'
      filters['grp_op_1'] = 'OR'
    }

    if (state.facilityQuery.facilityGroupId) {
      filters['facilityGroupId'] = state.facilityQuery.facilityGroupId
      filters['facilityGroupId_op'] = 'equals',
      filters['filterByDate'] = 'Y'
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
      "fieldList": ['facilityId', 'facilityName', 'facilityTypeId', 'maximumOrderLimit', 'defaultDaysToShip', 'externalId', 'primaryFacilityGroupId', 'parentFacilityTypeId'],
      ...payload
    }

    const facilities = JSON.parse(JSON.stringify(state.facilities.list));
    let total = 0, facilityList = [];

    try {
      const resp = await FacilityService.fetchFacilities(params)

      if(!hasError(resp) && resp.data.count) {
        if(payload.viewIndex && payload.viewIndex > 0) {
          facilityList = facilities.concat(resp.data.docs)
        } else {
          facilityList = resp.data.docs
        }
        total = resp.data.count
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    emitter.emit("dismissLoader");
    commit(types.FACILITY_LIST_UPDATED , { facilities: facilityList, total });

    if(facilities.length) {
      await dispatch('fetchFacilitiesAdditionalInformation', payload)
    }
  },

  updateFacilities({ commit }, facilities) {
    commit(types.FACILITY_LIST_UPDATED, { facilities, total: facilities.length })
  },

  async fetchFacilityAdditionalInformation({ commit, state, rootGetters }) {
    const facility = JSON.parse(JSON.stringify(state.current))
    const inventoryGroups = rootGetters['util/getInventoryGroups'];
    
    const [facilityGroupInformation, facilityOrderCount] = await Promise.all([FacilityService.fetchFacilityGroupInformation([facility.facilityId]), FacilityService.fetchFacilitiesOrderCount([facility.facilityId])])

    const fulfillmentOrderLimit = facility.maximumOrderLimit
    if (fulfillmentOrderLimit === 0) {
      facility.orderLimitType = 'no-capacity'
    } else if (fulfillmentOrderLimit) {
      facility.orderLimitType = 'custom'
    } else {
      facility.orderLimitType = 'unlimited'
    }

    facility.orderCount = facilityOrderCount[facility.facilityId] ? facilityOrderCount[facility.facilityId] : 0;

    const facilityGroupInfo = facilityGroupInformation[facility.facilityId]
    if (facilityGroupInfo?.length) {
      facility.groupInformation = facilityGroupInfo
      facility.useOMSFulfillment = (facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'OMS_FULFILLMENT'))
      facility.generateShippingLabel = (facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'AUTO_SHIPPING_LABEL'))
      facility.allowPickup = (facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'PICKUP'))
    } else {
      facility.groupInformation = []
      facility.sellOnline = false
      facility.useOMSFulfillment = false
      facility.generateShippingLabel = false
      facility.allowPickup = false
    }

    //inventory groups
    inventoryGroups.forEach((group: any) => {
      group.isChecked = (facilityGroupInfo?.some((facilityGroup: any) => facilityGroup?.facilityGroupId === group.facilityGroupId))
    });
    facility.inventoryGroups = inventoryGroups;
    commit(types.FACILITY_CURRENT_UPDATED, facility)
  },

  async fetchCurrentFacility({ commit, dispatch, rootGetters, state }, payload) {
    // checking that if the list contains basic information for facility then not fetching the same information again
    const cachedFacilities = JSON.parse(JSON.stringify(state.facilities.list))
    const current = cachedFacilities.find((facility: any) => facility.facilityId === payload.facilityId)
    if(current?.facilityId && !payload.skipState && current["groupInformation"]) {
      // As inventory channels are fetched while fetching additional facility info
      // But here we already have additional facility info, so just getting and adding inventory groups to current.
      const inventoryGroups = rootGetters['util/getInventoryGroups'];
      // Creating a key called 'isChecked' for inventory groups already associated with current facility.
      inventoryGroups.forEach((group: any) => {
        group.isChecked = (current.groupInformation?.some((facilityGroup: any) => facilityGroup?.facilityGroupId === group.facilityGroupId))
      });
      current.inventoryGroups = inventoryGroups;
      commit(types.FACILITY_CURRENT_UPDATED, current);
      return;
    }

    const params = {
      inputFields: {
        facilityId: payload.facilityId
      },
      entityName: "FacilityAndProductStore",
      noConditionFind: "Y",
      distinct: "Y",
      fieldList: ['facilityId', 'facilityName', 'facilityTypeId', 'maximumOrderLimit', 'defaultDaysToShip', 'externalId', 'primaryFacilityGroupId', 'parentFacilityTypeId'],
      viewSize: 1
    }

    let facility = {} as any;

    try {
      const resp = await FacilityService.fetchFacilities(params)

      if(!hasError(resp) && resp.data.count > 0) {
        facility = resp.data.docs[0]
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    commit(types.FACILITY_CURRENT_UPDATED, { ...state.current, ...facility });
    await dispatch('fetchFacilityAdditionalInformation', payload);
  },

  updateCurrentFacility({ commit }, facility) {
    commit(types.FACILITY_CURRENT_UPDATED, facility);
  },

  async fetchFacilityContactDetails({ commit }, payload) {
    let postalAddress = {} as any
    const params = {
      inputFields: {
        contactMechPurposeTypeId: 'PRIMARY_LOCATION',
        contactMechTypeId: 'POSTAL_ADDRESS',
        facilityId: payload.facilityId
      },
      entityName: "FacilityContactDetailByPurpose",
      orderBy: 'fromDate DESC',
      filterByDate: 'Y',
      fieldList: ['address1', 'address2', 'city', 'contactMechId', 'countryGeoId', 'countryGeoName', 'latitude', 'longitude', 'postalCode', 'stateGeoId', 'stateGeoName', 'toName'],
      viewSize: 1
    }

    try {
      const resp = await FacilityService.fetchFacilityContactDetails(params)
      if(!hasError(resp)) {
        postalAddress = resp.data.docs[0]
        postalAddress = {
          ...postalAddress,
          stateProvinceGeoId: postalAddress.stateGeoId
        }
        delete postalAddress.stateGeoId
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error('Failed to fetch the postal address for the facility', err)
    }

    commit(types.FACILITY_POSTAL_ADDRESS_UPDATED , postalAddress);
  },
  async fetchFacilityTelecomNumber({ commit }, payload) {
    let telecomNumber;
    const params = {
      inputFields: {
        contactMechPurposeTypeId: 'PRIMARY_PHONE',
        contactMechTypeId: 'TELECOM_NUMBER',
        facilityId: payload.facilityId
      },
      entityName: "FacilityContactDetailByPurpose",
      orderBy: 'fromDate DESC',
      filterByDate: 'Y',
      fieldList: ['contactMechId', 'contactNumber', 'countryCode'],
      viewSize: 1
    }

    try {
      const resp = await FacilityService.fetchFacilityContactDetails(params)
      if(!hasError(resp)) {
        telecomNumber = resp.data.docs[0]
        commit(types.FACILITY_TELECOM_NUMBER_UPDATED , telecomNumber);
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error('Failed to fetch the contact number for the facility', err)
    }
  },

  updateFacilityQuery({ commit }, query) {
    commit(types.FACILITY_QUERY_UPDATED, query)
  },

  updateGroupQuery({ commit }, query) {
    commit(types.FACILITY_GROUP_QUERY_UPDATED, query)
  },

  clearFacilityState({ commit }) {
    commit(types.FACILITY_QUERY_UPDATED, {
      queryString: '',
      productStoreId: '',
      facilityTypeId: '',
      facilityGroupId: ''
    })
    commit(types.FACILITY_GROUP_QUERY_UPDATED, {
      queryString: '',
    })
    commit(types.FACILITY_LIST_UPDATED , { facilities: [], total: 0 });
    commit(types.FACILITY_CURRENT_UPDATED, {});
  },

  async fetchFacilityLocations({ commit }, payload) {
    let facilityLocations = []
    try {
      const params = {
        inputFields: {
          facilityId: payload.facilityId
        },
        entityName: "FacilityLocation",
        fieldList: ["facilityId", "locationSeqId", "locationTypeEnumId", "areaId", "aisleId", "sectionId", "levelId", "positionId"],
        viewSize: 100
      }

      const resp = await FacilityService.fetchFacilityLocations(params)

      if(!hasError(resp) && resp.data.count > 0) {
        facilityLocations = resp.data.docs
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error('Failed to find the facility locations', err)
    }
    commit(types.FACILITY_LOCATIONS_UPDATED, facilityLocations)
  },

  async fetchFacilityCalendar({commit}, payload) {
    let resp;
    let facilityCalendar = {}
    try {
      const params = {
        inputFields: {
          facilityId: payload.facilityId
        },
        entityName: "StoreOperatingHours",
        filterByDate: 'Y',
        viewSize: 1
      }

      resp = await FacilityService.fetchFacilityCalendar(params)

      if(!hasError(resp) && resp.data.count) {
        facilityCalendar = resp.data.docs[0]
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err)
    }

    commit(types.FACILITY_CALENDAR_UPDATED, facilityCalendar)
  },

  async getFacilityProductStores({ commit }, params) {
    let productStores = []
    const payload = {
      inputFields: {
        facilityId: params.facilityId
      },
      viewSize: 100,
      entityName: 'ProductStoreFacility',
      filterByDate: 'Y',
      fieldList: ['fromDate', 'productStoreId']
    }

    try {
      const resp = await FacilityService.getFacilityProductStores(payload)

      if(!hasError(resp) && resp.data.count) {
        productStores = resp.data.docs
        this.dispatch('util/fetchShopifyShopForProductStores', resp.data.docs.map((productStore: any) => productStore.productStoreId))
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    commit(types.FACILITY_PRODUCT_STORES_UPDATED , productStores);
  },

  async fetchFacilityMappings({ commit }, payload) {
    let mappings = []
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
      }

      const resp = await FacilityService.fetchFacilityMappings(params)

      if(!hasError(resp) && resp.data.count > 0) {
        mappings = resp.data.docs
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error('Failed to fetch facility mappings', err)
    }
    commit(types.FACILITY_MAPPINGS_UPDATED, mappings)
  },

  async getFacilityParties({ commit }, payload) {
    let parties = []
    const params = {
      inputFields: {
        facilityId: payload.facilityId,
        partyId_op: 'not-empty',
        roleTypeId: 'FAC_LOGIN',
        roleTypeId_op: 'notEqual'
      },
      entityName: "FacilityAndParty",
      filterByDate: 'Y',
      orderBy: 'partyId DESC',
      fieldList: ['facilityId', 'firstName', 'fromDate', 'lastName', 'groupName', 'partyId', 'roleTypeId'],
      viewSize: 100
    }

    try {
      const resp = await FacilityService.getFacilityParties(params)

      if(!hasError(resp) && resp.data.count) {
        parties = resp.data.docs

        parties.map((party: any) => {
          party.fullName = party.groupName ? party.groupName : `${party.firstName} ${party.lastName}`
        });
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error('Failed to fetch facility parties', err)
    }

    commit(types.FACILITY_PARTIES_UPDATED, parties)
  },

  async fetchShopifyFacilityMappings({ commit }, payload) {
    let shopifyFacilityMappings = []
    try {
      const params = {
        inputFields: {
          facilityId: payload.facilityId
        },
        entityName: "ShopifyShopLocationView",
        fieldList: ["shopifyShopId", "domain", "name", "myshopifyDomain", "shopId", "shopifyLocationId"],
        viewSize: 100
      }

      const resp = await FacilityService.fetchShopifyFacilityMappings(params)

      if(!hasError(resp) && resp.data.count > 0) {
        shopifyFacilityMappings = resp.data.docs
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error('Failed to fetch shopify facility mappings', err)
    }
    commit(types.FACILITY_SHOPIFY_MAPPINGS_UPDATED, shopifyFacilityMappings)
  },

  async fetchFacilityLogins({ commit }, payload) {
    
    let facilityLogins = [] as any;
    let dataList = [] as any;

    try {
      let resp = await FacilityService.getFacilityParties({
        inputFields: {
          "facilityId": payload.facilityId,
          "roleTypeId": "FAC_LOGIN",
        },
        fieldList: ['facilityId', 'partyId', 'roleTypeId', 'fromDate'],
        entityName: "FacilityParty",
        distinct: 'Y',
        noConditionFind: 'Y',
        filterByDate: 'Y',
        viewSize: 50
      })
      if (!hasError(resp) && resp.data.count > 0) {
        const facilityParties = resp.data.docs
        dataList = facilityParties;
        const partyIds = facilityParties.map((party: any) => party.partyId);
        dataList = [...dataList, ...await UserService.fetchLogoImageForParties(partyIds)]

        resp = await UserService.fetchUserLoginAndPartyDetails({
          inputFields: {
            "partyId": partyIds,
            "partyId_op": "in",
          },
          fieldList: ['partyId', 'groupName', "userLoginId"],
          entityName: "UserLoginAndPartyDetails",
          distinct: 'Y',
          noConditionFind: 'Y',
          viewSize: 50
        })
        if (!hasError(resp) && resp.data.count > 0) {
          dataList = [...dataList, ...resp.data.docs]
          resp = await UserService.fetchUserContactDetails({
            inputFields: {
              "partyId": partyIds,
              "partyId_op": "in",
              contactMechPurposeTypeId: 'PRIMARY_EMAIL',
            },
            viewSize: 100,
            filterByDate: 'Y',
            entityName: 'PartyContactDetailByPurpose',
            fieldList: ['partyId', 'infoString', 'contactMechId', 'contactMechPurposeTypeId']
          })
          if (!hasError(resp) && resp.data.count > 0) {
            dataList = [...dataList, ...resp.data.docs]
          }
          const facilityPartyData = dataList.reduce((partyData:any, doc:any) => {
            const partyId = doc.partyId;
            partyData[partyId] = { ...partyData[partyId], ...doc };
            return partyData;
          }, {});
    
          facilityLogins = Object.values(facilityPartyData);
        }
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error('Failed to fetch facility parties', err)
    }
    commit(types.FACILITY_LOGINS_UPDATED, facilityLogins)
  },

  async fetchVirtualFacilities({ commit, dispatch, state }, payload) {
    if (payload.viewIndex === 0) emitter.emit("presentLoader"); 

    let archivedFacilityIds = []
    if (state.archivedFacilities.length) {
      archivedFacilityIds = JSON.parse(JSON.stringify(state.archivedFacilities)).map((facility: any) => facility.facilityId)
    }
    
    let facilities = JSON.parse(JSON.stringify(state.virtualFacilities.list)), total = 0;

    try {
      const params = {
        inputFields: {
          parentFacilityTypeId_value: 'VIRTUAL_FACILITY',
          parentFacilityTypeId_op: 'equals',
          parentFacilityTypeId_grp: '1',
          facilityTypeId_value: 'VIRTUAL_FACILITY',
          facilityTypeId_op: 'equals',
          facilityTypeId_grp: '2',
          // conditionally filtering if archived facilities are present
          ...(archivedFacilityIds.length && { facilityId: archivedFacilityIds, facilityId_op: 'not-in' }),
        },
        orderBy: "facilityName ASC",
        entityName: "FacilityAndProductStore",
        distinct: 'Y',
        fieldList: ["facilityId", "facilityName", "description", "facilityTypeId", "parentFacilityTypeId"],
        ...payload
      }

      const resp = await FacilityService.fetchFacilities(params)

      if (!hasError(resp) && resp.data.count) {    
        if (payload.viewIndex && payload.viewIndex > 0){
          facilities = facilities.concat(resp.data.docs)
        } else {
          facilities = resp.data.docs
        }
        total = resp.data.count
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    emitter.emit("dismissLoader");
    commit(types.FACILITY_VIRTUAL_FACILITY_LIST_UPDATED, { facilities, total });
    if (facilities.length) {
      await dispatch('fetchVirtualFacilitiesAdditionalDetail', payload)
    }
  },
  
  async fetchVirtualFacilitiesAdditionalDetail({ commit, state }, payload) {
    // getting all the facilties from state
    const cachedFacilities = JSON.parse(JSON.stringify(state.virtualFacilities.list)); // maintaining cachedFacilities as to prepare the facilities payload to fetch additional information
    let stateFacilities = JSON.parse(JSON.stringify(state.virtualFacilities.list)); // maintaining stateFacilities as to update the facility information once information in fetched
    const total = state.virtualFacilities.total

    const facilityIds: Array<string> = [];

    // splitting the facilities in batches to fetch the additional facilities information
    const facilities = cachedFacilities.splice(payload.viewIndex * (process.env.VUE_APP_VIEW_SIZE as any), process.env.VUE_APP_VIEW_SIZE)
    facilities.map((facility: any) => facilityIds.push(facility.facilityId))

    stateFacilities = stateFacilities.filter((facility: any) => !facilityIds.includes(facility.facilityId))
    
    try {
      const [jobData, facilitiesOrderCount] = await Promise.all([FacilityService.fetchJobData(), FacilityService.fetchOrderCountsByFacility(facilityIds)])

      facilities.map((facility: any) => {
        if (facility.facilityId === '_NA_') {
          facility.brokeringJob = jobData.brokeringJob;
        } else if (facility.facilityTypeId === 'BACKORDER') {
          facility.autoReleaseJob = jobData.autoReleaseJob;
        } else if (facility.facilityTypeId === 'PRE_ORDER') {
          facility.autoReleaseJob = jobData.autoReleaseJob;
        }
        facility.orderCount = facilitiesOrderCount[facility.facilityId] || 0
      });
        
    } catch(error) {
      logger.error(error)
    }
    commit(types.FACILITY_VIRTUAL_FACILITY_LIST_UPDATED, { facilities: stateFacilities.concat(facilities), total });
  },

  async fetchVirtualFacility({ commit, dispatch, state }, payload) {
    // not presenting loader as to avoid flickering
    let facility = {}
    try {
      const resp = await FacilityService.fetchFacilities({
        inputFields: {
          facilityId: payload.facilityId,
        },
        entityName: "FacilityAndProductStore",
        fieldList: ["facilityId", "facilityName", "description", "facilityTypeId", "parentFacilityTypeId"],
        filterByDate: 'Y',
        viewSize: 1
      })

      if (!hasError(resp) && resp.data.count) {
        facility = resp.data.docs[0]
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    //Applying custom sorting to alwyas bring Brokering queue, Pre-order parking and backorder parking first.
    const facilities = [...state.virtualFacilities.list, facility]
    
    commit(types.FACILITY_VIRTUAL_FACILITY_LIST_UPDATED, { facilities, total: facilities.length });
    if (facilities.length) {
      await dispatch('fetchVirtualFacilitiesAdditionalDetail', payload)
    }
  },

  updateVirtualFacilities({ commit }, facilities) {
    commit(types.FACILITY_VIRTUAL_FACILITY_LIST_UPDATED, { facilities, total: facilities.length })
  },

  async fetchArchivedFacilities({dispatch }) {
    let facilities = []
    try {
      facilities = await FacilityService.fetchArchivedFacilities()
    } catch (error) {
      logger.error(error)
    }
    dispatch('updateArchivedFacilities', facilities)
  },

  updateArchivedFacilities({ commit }, facilities) {
    commit(types.FACILITY_ARCHIVED_UPDATED, facilities)
  },  

  async fetchFacilityGroups({ commit, state, dispatch }, payload) {
    if (payload.viewIndex === 0) emitter.emit("presentLoader");

    const filters = {} as any

    // TODO add other filtering in UI and here
    if (state.groupQuery.queryString) {
      filters['facilityGroupId_value'] = state.groupQuery.queryString
      filters['facilityGroupId_op'] = 'contains'
      filters['facilityGroupId_ic'] = 'Y'
      filters['facilityGroupId_grp'] = '1'
      filters['facilityGroupName_value'] = state.groupQuery.queryString
      filters['facilityGroupName_op'] = 'contains'
      filters['facilityGroupName_ic'] = 'Y'
      filters['facilityGroupName_grp'] = '2'
    }

    let groups = JSON.parse(JSON.stringify(state.facilityGroups.list)); 
    let total = 0;

    try {
      const params = {
        inputFields: {
          ...filters
        },
        entityName: "FacilityGroup",
        noConditionFind: 'Y',
        orderBy: "facilityGroupName ASC",
        fieldList: ["facilityGroupId", "facilityGroupTypeId", "facilityGroupName", "description"],
        ...payload
      }

      const resp = await FacilityService.fetchFacilityGroups(params)

      if (!hasError(resp) && resp.data.count > 0) {
          if (payload.viewIndex && payload.viewIndex > 0) {
            groups = groups.concat(resp.data.docs)
          } else { 
            groups = resp.data.docs
          }
        total = resp.data.count
      } else {
        throw resp.data
      }
    } catch (error) {
      if (payload.viewIndex === 0) { 
        groups = []; 
        total = 0; 
      }
    }

    emitter.emit("dismissLoader");
    commit(types.FACILITY_GROUP_LIST_UPDATED, { groups, total });
    if (groups.length) {
      await dispatch('fetchFacilityGroupsAdditionalDetails', payload)
    }
  },

  async fetchFacilityGroupsAdditionalDetails({ commit, state }, payload) {
    // getting all the groups from state
    const cachedGroups = JSON.parse(JSON.stringify(state.facilityGroups.list)); // maintaining facilityGroups as to prepare the facilities payload to fetch additional information
    let stateGroups = JSON.parse(JSON.stringify(state.facilityGroups.list)); // maintaining stateGroups as to update the facility information once information in fetched
    const total = state.facilityGroups.total

    const facilityGroupIds: Array<string> = [];

    // splitting the groups in batches to fetch the additional groups information
    const groups = cachedGroups.splice(payload.viewIndex * (process.env.VUE_APP_VIEW_SIZE as any), process.env.VUE_APP_VIEW_SIZE)
    groups.map((group: any) => facilityGroupIds.push(group.facilityGroupId))

    stateGroups = stateGroups.filter((group: any) => !facilityGroupIds.includes(group.facilityGroupId))

    try {
      // facilityGroupIds is list of ids which gets empty at the end of below api call
      // We again want's to use this facilityGroupIds in another api hence deep cloning it.
      const facilityCountByGroup = await FacilityService.fetchFacilityCountByGroup(JSON.parse(JSON.stringify(facilityGroupIds)))
      groups.map((group: any) => {
        group.facilityCount = facilityCountByGroup[group.facilityGroupId] || 0
      })

      const productStoreCountByGroup = await FacilityService.fetchProductStoreCountByGroup(facilityGroupIds)
      groups.map((group: any) => {
        group.productStoreCount = productStoreCountByGroup[group.facilityGroupId] || 0
      })
    } catch (error) {
      logger.error(error)
    }
    commit(types.FACILITY_GROUP_LIST_UPDATED, { groups: stateGroups.concat(groups), total })
  },

  updateFacilityGroups({ commit }, groups) {
    commit(types.FACILITY_GROUP_LIST_UPDATED, { groups, total: groups.length })
  },
}

export default actions;