import { GetterTree } from 'vuex'
import UtilState from './UtilState'
import RootState from '@/store/RootState'

const getters: GetterTree<UtilState, RootState> = {
  getCalendars(state) {
    return state.calendars;
  },
  getProductStores(state) {
    return state.productStores;
  },
  getPartyRoles(state) {
    return state.partyRoles;
  },
  getFacilityTypes(state) {
    return state.facilityTypes
  },
  getFacilityGroupTypes(state) {
    return state.facilityGroupTypes
  },
  getLocationTypes(state) {
    return state.locationTypes
  },
  getExternalMappingTypes(state) {
    return state.externalMappingTypes
  },
  getProductStore: (state) => (productStoreId: string) => {
    return state.productStores.find((store: any) => store.productStoreId === productStoreId)
  },
  getCountries(state) {
    return state.countries
  },
  getStates(state) {
    return state.states
  },
  getShopifyShopIdForProductStore: (state) => (productStoreId: string) => {
    return state.shopifyShopForProductStore[productStoreId] ? state.shopifyShopForProductStore[productStoreId] : ''
  }
}
export default getters;