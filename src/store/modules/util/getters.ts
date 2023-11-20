import { GetterTree } from 'vuex'
import UtilState from './UtilState'
import RootState from '@/store/RootState'

const getters: GetterTree<UtilState, RootState> = {
  getProductStores(state) {
    return state.productStores;
  },
  getRoles(state) {
    return state.roles;
  },
  getFacilityTypes(state) {
    return state.facilityTypes
  }
}
export default getters;