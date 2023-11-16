import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import FacilityState from './FacilityState'
import RootState from '@/store/RootState'

const facilityModule: Module<FacilityState, RootState> = {
  namespaced: true,
  state: {
    query: {
      queryString: '',
      productStoreId: '',
      facilityTypeId: ''
    },
    selectedFacility: {},
    facilities: {
      list: [],
      total: 0
    },
    current: {}
  },
  getters,
  actions,
  mutations,
}

export default facilityModule;