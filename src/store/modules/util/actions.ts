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

  clearUtilState({ commit }) {
    commit(types.UTIL_PRODUCT_STORES_UPDATED, [])
    commit(types.UTIL_FACILITY_TYPES_UPDATED, [])
    commit(types.UTIL_COUNTRIES_UPDATED, [])
    commit(types.UTIL_STATES_UPDATED, {})
    commit(types.UTIL_LOCATION_TYPES_UPDATED, {})
    commit(types.UTIL_EXTERNAL_MAPPING_TYPES_UPDATED, {})
  },

  async fetchCountries({ commit, dispatch, state }, payload) {
    let countries = []

    const params = {
      inputFields: {
        geoIdTo: "DBIC"
      },
      entityName: 'GeoAssocAndGeoFrom',
      fieldList: ['geoName', 'geoId'],
      noConditionFind: 'Y',
    } as any

    try {
      const resp = await UtilService.fetchCountries(params)

      if (!hasError(resp)) {
        countries = resp.data.docs
        await dispatch('fetchStates', { geoId: payload.countryGeoId ? payload.countryGeoId : 'USA' })
      } else {
        throw resp.data
      }
    } catch (err) {
      logger.error(err)
    }

    commit(types.UTIL_COUNTRIES_UPDATED, countries)
  },

  async fetchStates({ commit, state }, payload) {
    if (payload.geoId in state.states) {
      return
    }
    let states = []

    const params = {
      inputFields: {
        geoIdFrom: payload.geoId
      },
      entityName: 'GeoAssocAndGeoTo',
      fieldList: ['geoName', 'geoId'],
      noConditionFind: 'Y',
      viewSize: 100
    } as any

    try {
      const resp = await UtilService.fetchStates(params)
      if (!hasError(resp)) {
        states = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (err) {
      logger.error(err)
    }
    commit(types.UTIL_STATES_UPDATED, { countryGeoId: payload.geoId, states })
  },
}

export default actions;