import actions from './actions'
import getters from './getters'
import mutations from './mutations'
import { Module } from 'vuex'
import FacilityState from './FacilityState'
import RootState from '@/store/RootState'

const userModule: Module<FacilityState, RootState> = {
    namespaced: true,
    state: {
      query: {}
    },
    getters,
    actions,
    mutations,
}

export default userModule;