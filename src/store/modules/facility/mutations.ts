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
  }
}
export default mutations;