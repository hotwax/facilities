import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import FacilityState from './FacilityState'
import emitter from '@/event-bus'
import { FacilityService } from '@/services/FacilityService'
import { hasError } from '@/adapter'
import * as types from './mutation-types'
import logger from '@/logger'

const actions: ActionTree<FacilityState, RootState> = {
  async fetchFacilities({ commit, state }, payload) {
    if (payload.viewIndex === 0) emitter.emit("presentLoader");
    const filters = {
      'parentFacilityTypeId': 'VIRTUAL_FACILITY',
      'parentFacilityTypeId_op': 'notEqual'
    } as any

    if(state.query.productStoreId) {
      filters['productStoreId'] = state.query.productStoreId
      filters['productStoreId_op'] = 'equals'
    }

    if(state.query.facilityTypeId) {
        filters['facilityTypeId'] = state.query.facilityTypeId
        filters['facilityTypeId_op'] = 'equals'
    }

    if(state.query.queryString) {
      filters['facilityId_value'] = state.query.queryString
      filters['facilityId_op'] = 'contains'
      filters['facilityId_ic'] = 'Y'
      filters['facilityId_grp'] = '1'
      filters['facilityName_value'] = state.query.queryString
      filters['facilityName_op'] = 'contains'
      filters['facilityName_ic'] = 'Y'
      filters['facilityName_grp'] = '2'
    }

    const params = {
      "inputFields": {
        ...filters
      },
      "entityName": "FacilityAndProductStore",
      "noConditionFind": "Y",
      "distinct": "Y",
      "fieldList": ['facilityId', 'facilityName', 'facilityTypeId', 'maximumOrderLimit', 'defaultDaysToShip'],
      ...payload
    }

    let facilities = [], total = 0;

    try {
      const resp = await FacilityService.fetchFacilities(params)

      if(!hasError(resp) && resp.data.count) {
        facilities = resp.data.docs
        total = resp.data.count

        // make api calls in parallel
        const facilitiesGroupInformation = await FacilityService.fetchFacilityGroupInformation(facilities.map((facility: any) => facility.facilityId))
        const facilitiesOrderCount = await FacilityService.fetchFacilitiesOrderCount(facilities.map((facility: any) => facility.facilityId))

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

          if(facilityGroupInformation.length) {
            facility.groupInformation = facilityGroupInformation
            facility.sellOnline = (facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'FAC_GRP'))
            facility.useOMSFulfillment = (facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'OMS_FULFILLMENT'))
            facility.generateShippingLabel = (facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'AUTO_SHIPPING_LABEL'))
            facility.allowPickup = (facilityGroupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'PICKUP'))
          }
        })

        if(payload.viewIndex && payload.viewIndex > 0) facilities = JSON.parse(JSON.stringify(state.facilities.list)).concat(facilities)
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    emitter.emit("dismissLoader");
    commit(types.FACILITY_LIST_UPDATED , { facilities, total });
  },

  async fetchCreatedFacility({ commit, state }, payload) {
    const currentCreatedFacility = JSON.parse(JSON.stringify(state.createdFacility))
    if (currentCreatedFacility.facilityId === payload.facilityId) {
      return
    }

    emitter.emit("presentLoader");
    const params = {
      inputFields: {
        facilityId: payload.facilityId
      },
      entityName: "FacilityAndProductStore",
      noConditionFind: "Y",
      distinct: "Y",
      fieldList: ['facilityId', 'facilityName', 'facilityTypeId'],
      viewSize: 1
    }

    let facility = {} as any;

    try {
      const resp = await FacilityService.fetchFacilities(params)

      if(!hasError(resp)) {
        facility = resp.data.docs[0]
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    emitter.emit("dismissLoader");
    commit(types.FACILITY_CREATED_UPDATED, facility);
  },

  updateCreatedFacility({ commit }, facility) {
    commit(types.FACILITY_CREATED_UPDATED, facility);
  },

  async fetchCurrentFacility({ commit, state }, payload) {
    // checking that if the list contains basic information for facility then not fetching the same information again
    const cachedFacilities = JSON.parse(JSON.stringify(state.facilities.list))
    const current = cachedFacilities.find((facility: any) => facility.facilityId === payload.facilityId)
    if(current?.facilityId) {
      commit(types.FACILITY_CURRENT_UPDATED, current);
      return;
    }

    emitter.emit("presentLoader");

    const params = {
      inputFields: {
        facilityId: payload.facilityId
      },
      entityName: "FacilityAndProductStore",
      noConditionFind: "Y",
      distinct: "Y",
      fieldList: ['facilityId', 'facilityName', 'facilityTypeId', 'maximumOrderLimit', 'defaultDaysToShip'],
      viewSize: 1
    }

    let facility = {} as any;

    try {
      const resp = await FacilityService.fetchFacilities(params)

      if(!hasError(resp) && resp.data.count > 0) {
        facility = resp.data.docs[0]

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

        if(facilityGroupInfo.length) {
          facility.groupInformation = facilityGroupInfo
          facility.sellOnline = (facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'FAC_GRP'))
          facility.useOMSFulfillment = (facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'OMS_FULFILLMENT'))
          facility.generateShippingLabel = (facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'AUTO_SHIPPING_LABEL'))
          facility.allowPickup = (facilityGroupInfo.some((facilityGroup: any) => facilityGroup.facilityGroupId === 'PICKUP'))
        }
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    emitter.emit("dismissLoader");
    commit(types.FACILITY_CURRENT_UPDATED, facility);
  },

  async fetchFacilityContactDetails({ commit }, payload) {
    let postalAddress = {}
    const params = {
      inputFields: {
        contactMechPurposeTypeId: 'PRIMARY_LOCATION',
        contactMechTypeId: 'POSTAL_ADDRESS',
        facilityId: payload.facilityId
      },
      entityName: "FacilityContactDetailByPurpose",
      orderBy: 'fromDate DESC',
      filterByDate: 'Y',
      fieldList: ['address1', 'address2', 'city', 'contactMechId', 'countryGeoId', 'latitude', 'longitude', 'postalCode', 'stateGeoId'],
      viewSize: 1
    }

    try {
      const resp = await FacilityService.fetchFacilityContactDetails(params)
      if (!hasError(resp)) {
        const contactInfo = resp.data.docs[0]

        postalAddress = {
          address1: contactInfo.address1,
          address2: contactInfo.address2,
          city: contactInfo.city,
          contactMechId: contactInfo.contactMechId,
          countryGeoId: contactInfo.countryGeoId,
          countryGeoName: contactInfo.countryGeoName,
          latitude: contactInfo.latitude,
          longitude: contactInfo.longitude,
          postalCode: contactInfo.postalCode,
          stateGeoId: contactInfo.stateGeoId,
          stateGeoName: contactInfo.stateGeoName
        }
      } else {
        throw resp.data
      }
    } catch (err) {
      logger.error('Failed to fetch the postal address for the facility', err)
    }

    commit(types.FACILITY_POSTAL_ADDRESS_UPDATED, postalAddress);
  },

  updateQuery({ commit }, query) {
    commit(types.FACILITY_QUERY_UPDATED, query)
  },

  clearFacilityState({ commit }) {
    commit(types.FACILITY_QUERY_UPDATED, {
      queryString: '',
      productStoreId: '',
      facilityTypeId: ''
    })
    commit(types.FACILITY_LIST_UPDATED , { facilities: [], total: 0 });
    commit(types.FACILITY_CURRENT_UPDATED, {});
  },

  async fetchFacilityLocations({ commit }, payload) {
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
        commit(types.FACILITY_CURRENT_LOCATION_UPDATED, resp.data.docs)
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error('Failed to find the facility locations', err)
    }
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
      } else {
        throw resp.data
      }
    } catch(error) {
      logger.error(error)
    }

    commit(types.FACILITY_PRODUCT_STORES_UPDATED , productStores);
  }
}

export default actions;