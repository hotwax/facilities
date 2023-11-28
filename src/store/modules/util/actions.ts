import { UtilService } from '@/services/UtilService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import * as types from './mutation-types'
import { hasError } from '@/adapter'
import logger from '@/logger'
import { showToast } from '@/utils'
import { translate } from '@hotwax/dxp-components'

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
    if(cachedFacilityTypes.length) {
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
      fieldList: ['facilityTypeId', 'description']
    } as any

    try {
      const resp = await UtilService.fetchFacilityTypes(params)
      if (!hasError(resp)) {
        facilityTypes = resp.data.docs.reduce((facilityType: any, type: any) => {
          facilityType[type.facilityTypeId] = type.description

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
  
  async fetchUtilCalendars({ commit, dispatch }, payload) {
    let calendars = []
    const params = {
      inputFields: {
        facilityId: payload.facilityId
      },
      entityName: "TechDataCalendar",
      viewSize: 100,
      noConditionFind: 'Y'
    }
    
    try {
      const resp = await UtilService.fetchCalendars(params)
      
      if(!hasError(resp) && resp.data.count) {
        calendars = resp.data.docs
      } else {
        throw resp.data
      }
    } catch(err) {
      showToast(translate("Something went wrong"))
      logger.error('Failed to fetch facility calendars', err)
    }
    
    commit(types.UTIL_CALENDARS_UPDATED, calendars)
  },
  
  async fetchCalendarWeek({ commit }, payload) {
    let calendars = []
    
    const params = {
      inputFields: {
        calendarWeekId: payload.calendarWeekId
      },
      entityName: "TechDataCalendarWeek",
      viewSize: 100,
      noConditionFind: 'Y'
    }

    try {
      const resp = await UtilService.fetchCalendarWeek(params)
      
      if(!hasError(resp) && resp.data.count) {
        calendars = resp.data.docs
      } else {
        throw resp.data
      }
    } catch(err) {
      showToast(translate("Something went wrong"))
      logger.error('Failed to fetch facility calendars', err)
    }
  },

  clearUtilState({ commit }) {
    commit(types.UTIL_PRODUCT_STORES_UPDATED, [])
    commit(types.UTIL_FACILITY_TYPES_UPDATED, {})
    commit(types.UTIL_LOCATION_TYPES_UPDATED, {})
    commit(types.UTIL_EXTERNAL_MAPPING_TYPES_UPDATED, {})
  }
}

export default actions;