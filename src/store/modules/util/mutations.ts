import { MutationTree } from 'vuex'
import UtilState from './UtilState'
import * as types from './mutation-types'

const mutations: MutationTree<UtilState> = {
  [types.UTIL_CALENDARS_UPDATED](state, payload) {
    state.calendars = payload
  },
  [types.UTIL_PRODUCT_STORES_UPDATED](state, payload) {
    state.productStores = payload
  },
  [types.UTIL_FACILITY_TYPES_UPDATED](state, payload) {
    state.facilityTypes = payload
  },
  [types.UTIL_FACILITY_GROUP_TYPES_UPDATED](state, payload) {
    state.facilityGroupTypes = payload
  },
  [types.UTIL_LOCATION_TYPES_UPDATED](state, payload) {
    state.locationTypes = payload
  },
  [types.UTIL_COUNTRIES_UPDATED](state, payload) {
    state.countries = payload
  },
  [types.UTIL_STATES_UPDATED](state, payload) {
    state.states[payload.countryGeoId] = payload.states
  },
  [types.UTIL_EXTERNAL_MAPPING_TYPES_UPDATED](state, payload) {
    state.externalMappingTypes = payload
  },
  [types.UTIL_PARTY_ROLES_UPDATED](state, payload) {
    state.partyRoles = payload
  },
  [types.UTIL_COUNTRIES_UPDATED](state, payload) {
    state.countries = payload
  },
  [types.UTIL_STATES_UPDATED](state, payload) {
    state.states[payload.countryGeoId] = payload.states
  },
  [types.UTIL_SHOPIFY_SHOP_UPDATED](state, payload) {
    payload.map((shopifyShop: any) => {
      state.shopifyShopForProductStore[shopifyShop.productStoreId] = shopifyShop.shopifyShopId
    })
  },
  [types.UTIL_INVENTORY_GROUP_UPDATED](state, payload) {
    state.inventoryGroups = payload
  },
  [types.UTIL_ORGANIZATION_PARTY_ID_UPDATED](state, payload) {
    state.organizationPartyID = payload
  }
}
export default mutations;