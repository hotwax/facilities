import { MutationTree } from 'vuex'
import UtilState from './UtilState'
import * as types from './mutation-types'

const mutations: MutationTree<UtilState> = {
  [types.UTIL_PRODUCT_STORES_UPDATED](state, payload) {
    state.productStores = payload
  },
  [types.UTIL_FACILITY_TYPES_UPDATED](state, payload) {
    state.facilityTypes = payload
  },
  [types.UTIL_LOCATION_TYPES_UPDATED](state, payload) {
    state.locationTypes = payload
  },
  [types.UTIL_PARTY_ROLES_UPDATED](state, payload) {
    state.roles = payload
  }
}
export default mutations;