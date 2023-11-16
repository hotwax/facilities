import { GetterTree } from 'vuex'
import FacilityState from './FacilityState'
import RootState from '@/store/RootState'

const getters: GetterTree <FacilityState, RootState> = {
  getFacilities(state) {
    return JSON.parse(JSON.stringify(state.facilities.list))
  },
  getQuery(state) {
    return JSON.parse(JSON.stringify(state.query))
  },
  isScrollable(state) {
    return (
      state.facilities.list?.length > 0 && state.facilities.list?.length < state.facilities.total
    );
  },
  getCurrent(state) {
    return state.current ? JSON.parse(JSON.stringify(state.current)) : {}
  }
}
export default getters;