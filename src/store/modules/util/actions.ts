import { UtilService } from '@/services/UtilService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import * as types from './mutation-types'
import { hasError } from '@/adapter'
import logger from '@/logger'

const actions: ActionTree<UtilState, RootState> = {
  async fetchProductStores({ commit }) {
    let productStores = []
    const params = {
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'ProductStore',
      fieldList: ['productStoreId', 'storeName']
    }

    try {
      const resp = await UtilService.fetchProductStores(params)
      if (!hasError(resp)) {
        productStores = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }
    commit(types.UTIL_PRODUCT_STORES_UPDATED, productStores)
  },

  async fetchFacilityTypes({ commit, state }, payload = {}) {
    const cachedFacilityTypes = JSON.parse(JSON.stringify(state.facilityTypes))

    // not fetching facility type information again if already present, as it will not be changed so frequently
    if (Object.keys(cachedFacilityTypes).length) {
      return;
    }

    let facilityTypes = {}
    const params = {
      inputFields: {
        ...payload
      },
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'FacilityType',
      fieldList: ['facilityTypeId', 'description', 'parentTypeId']
    } as any

    try {
      const resp = await UtilService.fetchFacilityTypes(params)
      if (!hasError(resp)) {
        facilityTypes = resp.data.docs.reduce((facilityType: any, type: any) => {
          facilityType[type.facilityTypeId] = { description: type.description, parentTypeId: type.parentTypeId }

          return facilityType
        }, {})
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }

    commit(types.UTIL_FACILITY_TYPES_UPDATED, facilityTypes)
  },

  async fetchFacilityGroupTypes({ commit }) {
    let facilityGroupTypes = []
    const params = {
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'FacilityGroupType',
      fieldList: ['facilityGroupTypeId', 'description']
    } as any

    try {
      const resp = await UtilService.fetchFacilityGroupTypes(params)
      if (!hasError(resp)) {
        facilityGroupTypes = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }

    commit(types.UTIL_FACILITY_GROUP_TYPES_UPDATED, facilityGroupTypes)
  },

  async fetchLocationTypes({ commit, state }) {
    const cachedLocationTypes = JSON.parse(JSON.stringify(state.locationTypes))

    // not fetching location type information again if already present, as it will not be changed so frequently
    if(cachedLocationTypes.length) {
      return;
    }

    let locationTypes = []
    const params = {
      inputFields: {
        enumTypeId: 'FACLOC_TYPE'
      },
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'Enumeration',
      fieldList: ['enumId', 'description']
    } as any

    try {
      const resp = await UtilService.fetchLocationTypes(params)
      if (!hasError(resp)) {
        locationTypes = resp.data.docs.reduce((locationType: any, type: any) => {
          locationType[type.enumId] = type.description

          return locationType
        }, {})
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }

    commit(types.UTIL_LOCATION_TYPES_UPDATED, locationTypes)
  },
  async fetchPartyRoles({ commit, state }) {
    if (state.partyRoles.length) {
      return
    }

    const partyRoles = {} as any
    const params = {
      inputFields: {
        roleTypeGroupId: 'FACILITY_PARTY_ROLE'
      },
      viewSize: 100,
      entityName: 'RoleTypeGroupMemberAndRoleType',
      orderBy: 'sequenceNum',
      filterByDate: 'Y',
      fieldList: ['roleTypeId', 'description']
    }

    try {
      const resp = await UtilService.fetchPartyRoles(params)
      if (!hasError(resp)) {
        resp.data.docs.map((role: any) => {
          partyRoles[role.roleTypeId] = role.description
        })

        // pushing none explicitly to show on UI
        partyRoles[''] = 'none'
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }
    commit(types.UTIL_PARTY_ROLES_UPDATED, partyRoles)
  },

  async fetchExternalMappingTypes({ commit, state }, payload) {
    const cachedExternalMappingTypes = JSON.parse(JSON.stringify(state.externalMappingTypes))

    // not fetching external mapping type information again if already present, as it will not be changed so frequently
    if(cachedExternalMappingTypes.length && !payload?.skipState) {
      return;
    }

    let externalMappingTypes = []
    const params = {
      inputFields: {
        enumTypeId: 'FACILITY_IDENTITY',
        enumId: 'SHOPIFY_FAC_ID',
        enumId_op: 'notEqual' // excluding shopify enum as we have included shopify as an hardcoded option
      },
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'Enumeration',
      fieldList: ['enumId', 'description']
    } as any

    try {
      const resp = await UtilService.fetchExternalMappingTypes(params)
      if (!hasError(resp)) {
        externalMappingTypes = resp.data.docs.reduce((externalMappingType: any, type: any) => {
          externalMappingType[type.enumId] = type.description

          return externalMappingType
        }, {})
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }

    commit(types.UTIL_EXTERNAL_MAPPING_TYPES_UPDATED, externalMappingTypes)
  },
  
  async fetchCalendars({ commit }) {
    let calendars = [] as any
    let calendarWeekTimings = [] as any
    let resp;
    
    try {
      resp = await UtilService.fetchCalendars({
        entityName: "TechDataCalendar",
        fieldList: ['calendarId', 'calendarWeekId', 'description'],
        viewSize: 100,
        noConditionFind: 'Y'
      })
      
      if(!hasError(resp) && resp.data.count) {
        calendars = resp.data.docs

        resp = await UtilService.fetchCalendarWeekTimings({
          entityName: "TechDataCalendarWeek",
          fieldList: ['calendarWeekId', 'mondayStartTime', 'mondayCapacity', 'tuesdayStartTime', 'tuesdayCapacity', 'wednesdayStartTime', 'wednesdayCapacity', 'thursdayStartTime', 'thursdayCapacity', 'fridayStartTime', 'fridayCapacity', 'saturdayStartTime', 'saturdayCapacity', 'sundayStartTime', 'sundayCapacity'],
          viewSize: 100,
          noConditionFind: 'Y'
        })
        
        if(!hasError(resp) && resp.data.count) {
          calendarWeekTimings = resp.data.docs

          calendars = calendars.map((calendar: any) => ({
            ...calendar, 
            ...calendarWeekTimings.find((calendarWeekTime: any) => calendarWeekTime.calendarWeekId === calendar.calendarWeekId)
           }));
        } else {
          throw resp.data
        }
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error('Failed to fetch facility calendars', err)
    }

    commit(types.UTIL_CALENDARS_UPDATED, calendars)
  },

  async fetchCountries({ commit, dispatch }, payload) {
    let countries = [] as any

    const params = {
      inputFields: {
        geoIdTo: "DBIC"
      },
      entityName: 'GeoAssocAndGeoFrom',
      fieldList: ['geoName', 'geoId', 'geoCode'],
      noConditionFind: 'Y',
      viewSize: 250
    } as any

    try {
      const resp = await UtilService.fetchCountries(params)

      if(!hasError(resp)) {
        countries = resp.data.docs
        dispatch('fetchStates', { geoId:  payload.countryGeoId ? payload.countryGeoId : 'USA'})
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err)
    }

    commit(types.UTIL_COUNTRIES_UPDATED, countries)
  },

  async fetchStates({ commit, state }, payload) {
    if(payload.geoId in state.states){
      commit(types.UTIL_STATES_UPDATED, { countryGeoId: payload.geoId, states: state.states[payload.geoId] })
      return;
    }
    let states = [] as any

    const params = {
      inputFields: {
        geoIdFrom: payload.geoId,
        geoAssocTypeId: 'REGIONS'
      },
      entityName: 'GeoAssocAndGeoTo',
      fieldList: ['geoName', 'geoId', 'wellKnownText'],
      noConditionFind: 'Y',
      viewSize: 250
    } as any

    try {
      const resp = await UtilService.fetchStates(params)

      if(!hasError(resp)) {
        states = resp.data.docs

      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err)
    }

    commit(types.UTIL_STATES_UPDATED, { countryGeoId: payload.geoId, states })
  },

  async fetchShopifyShopForProductStores({ commit }, productStoreIds) {
    let shopifyShops = [] as any

    const params = {
      inputFields: {
        productStoreId: productStoreIds,
        productStoreId_op: 'in'
      },
      entityName: 'ShopifyShop',
      fieldList: ['productStoreId', 'shopifyShopId'],
      noConditionFind: 'Y',
      viewSize: productStoreIds.length,
    }

    try {
      const resp = await UtilService.fetchShopifyShop(params)
      if (!hasError(resp) && resp.data.count > 0) {
        shopifyShops = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }
    commit(types.UTIL_SHOPIFY_SHOP_UPDATED, shopifyShops)
    return shopifyShops[0]?.shopifyShopId
  },

  async fetchInventoryGroups({ commit }) {
    let inventoryGroups = []
    const params = {
      entityName: "FacilityGroup",
      inputFields: {
        facilityGroupTypeId: 'CHANNEL_FAC_GROUP'
      },
      noConditionFind: 'Y',
      orderBy: "facilityGroupName ASC",
      fieldList: ["facilityGroupId", "facilityGroupTypeId", "facilityGroupName", "description"],
      viewSize: 50
    }

    try {
      const resp = await UtilService.fetchInventoryGroups(params)
      if (!hasError(resp)) {
        inventoryGroups = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }
    commit(types.UTIL_INVENTORY_GROUP_UPDATED, inventoryGroups)
  },

  async fetchOrganizationPartyId({ commit }) {
    let partyId = ""

    const params = {
      entityName: "PartyRole",
      inputFields: {
        roleTypeId: 'INTERNAL_ORGANIZATIO'
      },
      noConditionFind: 'Y',
      fieldList: ["partyId"],
      viewSize: 1
    }

    try {
      const resp = await UtilService.fetchOrganizationPartyId(params)
      if (!hasError(resp)) {
        partyId = resp.data.docs[0]?.partyId
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }
    commit(types.UTIL_ORGANIZATION_PARTY_ID_UPDATED, partyId)
  },

  clearUtilState({ commit }) {
    commit(types.UTIL_PRODUCT_STORES_UPDATED, [])
    commit(types.UTIL_FACILITY_TYPES_UPDATED, [])
    commit(types.UTIL_COUNTRIES_UPDATED, [])
    commit(types.UTIL_STATES_UPDATED, {})
    commit(types.UTIL_LOCATION_TYPES_UPDATED, {})
    commit(types.UTIL_EXTERNAL_MAPPING_TYPES_UPDATED, {})
    commit(types.UTIL_SHOPIFY_SHOP_UPDATED, [])
    commit(types.UTIL_INVENTORY_GROUP_UPDATED, [])
    commit(types.UTIL_ORGANIZATION_PARTY_ID_UPDATED, "")
  },
}

export default actions;