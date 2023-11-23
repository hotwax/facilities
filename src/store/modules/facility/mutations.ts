import { MutationTree } from 'vuex'
import FacilityState from './FacilityState'
import * as types from './mutation-types'

const mutations: MutationTree <FacilityState> = {
  [types.FACILITY_LIST_UPDATED](state, payload) {
    state.facilities.list = payload.facilities
    state.facilities.total = payload.total
  },
  [types.FACILITY_QUERY_UPDATED](state, payload) {
    state.query = payload
  },
  [types.FACILITY_CURRENT_UPDATED](state, payload) {
    state.current = payload
  },
  [types.FACILITY_LOCATIONS_UPDATED](state, payload) {
    state.current.locations = payload
  },
  [types.FACILITY_MAPPINGS_UPDATED](state, payload) {
    state.current.facilityMappings = payload
  },
  [types.FACILITY_SHOPIFY_MAPPINGS_UPDATED](state, payload) {
    state.current.shopifyFacilityMappings = payload
  },
  [types.FACILITY_PARTIES_UPDATED](state, payload) {
    state.current.parties = payload
  },
  [types.FACILITY_PRODUCT_STORES_UPDATED](state, payload) {
    state.current.productStores = payload
  },
}
export default mutations;