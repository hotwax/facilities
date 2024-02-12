import { MutationTree } from 'vuex'
import FacilityState from './FacilityState'
import * as types from './mutation-types'

const mutations: MutationTree <FacilityState> = {
  [types.FACILITY_LIST_UPDATED](state, payload) {
    state.facilities.list = payload.facilities
    state.facilities.total = payload.total
  },
  [types.FACILITY_QUERY_UPDATED](state, payload) {
    state.facilityQuery = payload
  },
  [types.FACILITY_GROUP_QUERY_UPDATED](state, payload) {
    state.groupQuery = payload
  },
  [types.FACILITY_CALENDAR_UPDATED](state, payload) {
    state.current.calendar = payload
  },
  [types.FACILITY_CURRENT_UPDATED](state, payload) {
    state.current = payload
  },
  [types.FACILITY_TELECOM_NUMBER_UPDATED](state, payload) {
    state.current.telecomNumber = payload
  },
  [types.FACILITY_POSTAL_ADDRESS_UPDATED](state, payload) {
    state.current.postalAddress = payload
  },
  [types.FACILITY_PRODUCT_STORES_UPDATED](state, payload) {
    state.current.productStores = payload
  },
  [types.FACILITY_LOCATIONS_UPDATED](state, payload) {
    state.current.locations = payload
  },
  [types.FACILITY_MAPPINGS_UPDATED](state, payload) {
    state.current.facilityMappings = payload
  },
  [types.FACILITY_POSTAL_ADDRESS_UPDATED](state, payload) {
    state.current.postalAddress = payload
  },
  [types.FACILITY_SHOPIFY_MAPPINGS_UPDATED](state, payload) {
    state.current.shopifyFacilityMappings = payload
  },
  [types.FACILITY_PARTIES_UPDATED](state, payload) {
    state.current.parties = payload
  },
  [types.FACILITY_LOGINS_UPDATED](state, payload) {
    state.current.facilityLogins = payload
  },
  [types.FACILITY_VIRTUAL_FACILITY_LIST_UPDATED](state, payload) {
    state.virtualFacilities.list = payload.facilities
    state.virtualFacilities.total = payload.total
  },
  [types.FACILITY_GROUP_LIST_UPDATED](state, payload) {
    state.facilityGroups.list = payload.groups
    state.facilityGroups.total = payload.total
  },
  [types.FACILITY_ARCHIVED_UPDATED](state, payload) {
    state.archivedFacilities = payload
  }
}
export default mutations;