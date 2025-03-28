import { GetterTree } from 'vuex'
import FacilityState from './FacilityState'
import RootState from '@/store/RootState'

const getters: GetterTree <FacilityState, RootState> = {
  getFacilities(state) {
    return JSON.parse(JSON.stringify(state.facilities.list))
  },
  getVirtualFacilities(state) {
    return JSON.parse(JSON.stringify(state.virtualFacilities.list))
  },
  getFacilityGroups(state) {
    return JSON.parse(JSON.stringify(state.facilityGroups.list))
  },
  getArchivedFacilities(state) {
    return JSON.parse(JSON.stringify(state.archivedFacilities.list))
  },
  getFacilityProductStores(state) {
    return state.current.productStores
  },
  getFacilityQuery(state) {
    return JSON.parse(JSON.stringify(state.facilityQuery))
  },
  getGroupQuery(state) {
    return JSON.parse(JSON.stringify(state.groupQuery))
  },
  isFacilitiesScrollable(state) {
    return (
      state.facilities.list?.length > 0 && state.facilities.list?.length < state.facilities.total
    );
  },
  isVirtualFacilitiesScrollable(state) {
    return (
      state.virtualFacilities.list?.length > 0 && state.virtualFacilities.list?.length < state.virtualFacilities.total
    );
  },
  isFacilityGroupsScrollable(state) {
    return (
      state.facilityGroups.list?.length > 0 && state.facilityGroups.list?.length < state.facilityGroups.total
    );
  },
  getCurrent(state) {
    return state.current ? JSON.parse(JSON.stringify(state.current)) : {}
  },
  getFacilityCalendar(state) {
    return state.current?.calendar ? JSON.parse(JSON.stringify(state.current.calendar)) : {}
  },
  getFacilityParties(state) {
    return state.current.parties
  },
  getPostalAddress(state) {
    return state.current?.postalAddress ? JSON.parse(JSON.stringify(state.current.postalAddress)) : {}
  },
  getTelecomAndEmailAddress(state) {
    return state.current?.contactDetails
  },
  isArchivedFacilitiesScrollable(state) {
    return (
      state.archivedFacilities.list?.length > 0 && state.archivedFacilities.list?.length < state.archivedFacilities.total
    );
  }
}
export default getters;