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
  [types.FACILITY_GEO_POINT_UPDATED](state, payload) {
    state.current.geoPoint = payload
  },
  [types.FACILITY_POSTAL_ADDRESS_UPDATED](state, payload) {
    state.current.postalAddress = payload
  }
}
export default mutations;