import { UtilService } from '@/services/UtilService'
import { ActionTree } from 'vuex'
import RootState from '@/store/RootState'
import UtilState from './UtilState'
import * as types from './mutation-types'
import { hasError } from '@/adapter'
import logger from '@/logger'
import { showToast } from '@/utils'
import { translate } from '@hotwax/dxp-components'

const actions: ActionTree<UtilState, RootState> = {
  async fetchProductStores({ commit }) {
    let productStores = []
    const params = {
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'ProductStore',
      fieldList: ['productStoreId', 'storeName']
    }

    try {
      const resp = await UtilService.fetchProductStores(params)
      if (!hasError(resp)) {
        productStores = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }
    commit(types.UTIL_PRODUCT_STORES_UPDATED, productStores)
  },

  async fetchFacilityTypes({ commit, state }, payload = {}) {
    const cachedFacilityTypes = JSON.parse(JSON.stringify(state.facilityTypes))

    // not fetching facility type information again if already present, as it will not be changed so frequently
    if(cachedFacilityTypes.length) {
      return;
    }

    let facilityTypes = []
    const params = {
      inputFields: {
        ...payload
      },
      viewSize: 100,
      noConditionFind: 'Y',
      entityName: 'FacilityType',
      fieldList: ['facilityTypeId', 'description']
    } as any

    try {
      const resp = await UtilService.fetchFacilityTypes(params)
      if (!hasError(resp)) {
        facilityTypes = resp.data.docs
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }

    commit(types.UTIL_FACILITY_TYPES_UPDATED, facilityTypes)
  },

  async fetchRoles({ commit, state }) {
    if (state.roles.length) {
      return
    }

    const roles = {} as any
    const params = {
      inputFields: {
        roleTypeGroupId: 'FACILITY_PARTY_ROLE'
      },
      viewSize: 100,
      entityName: 'RoleTypeGroupMemberAndRoleType',
      orderBy: 'sequenceNum',
      filterByDate: 'Y',
      fieldList: ['roleTypeId', 'description']
    }

    try {
      const resp = await UtilService.fetchRoles(params)
      if (!hasError(resp)) {
        resp.data.docs.map((doc:any) => {
          roles[doc.roleTypeId] = doc.description
        })

        // pushing none explicitly to show on UI
        roles[''] = 'none'
      } else {
        throw resp.data
      }
    } catch (error) {
      logger.error(error)
    }

    commit(types.UTIL_ROLES_UPDATED, roles)
  },

  clearUtilState({ commit }) {
    commit(types.UTIL_PRODUCT_STORES_UPDATED, [])
    commit(types.UTIL_FACILITY_TYPES_UPDATED, [])
  }
}

export default actions;