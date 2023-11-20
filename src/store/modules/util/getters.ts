import { GetterTree } from 'vuex'
import UtilState from './UtilState'
import RootState from '@/store/RootState'

const getters: GetterTree<UtilState, RootState> = {
  getProductStores(state) {
    return state.productStores;
  },
  getFacilityTypes(state) {
    return state.facilityTypes
  },
  getLocationTypes(state) {
    return state.locationTypes
  }
}
export default getters;