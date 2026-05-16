import { api, commonUtil } from '@common';

const fetchFacilityTypes = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchProductStores = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true,
    baseURL: commonUtil.getOmsURL()
  })
}

const generateLatLong = async (payload: any): Promise<any> => {
  return api({
    url: "postcodeLookup",
    method: "POST",
    data: payload,
    cache: true,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchPartyRoles = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload,
    cache: true,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchLocationTypes = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchCountries = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchStates = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchExternalMappingTypes = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchCalendars = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchCalendarWeekTimings = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchShopifyShops = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchFacilityGroupTypes = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload,
    baseURL: commonUtil.getOmsURL()
  });
}

const fetchShopifyShop = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchInventoryGroups = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    baseURL: commonUtil.getOmsURL()
  })
}

const fetchOrganizationPartyId = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    baseURL: commonUtil.getOmsURL()
  })
}

export const UtilService = {
  fetchCalendars,
  fetchCalendarWeekTimings,
  fetchCountries,
  fetchExternalMappingTypes,
  fetchFacilityGroupTypes,
  fetchFacilityTypes,
  fetchInventoryGroups,
  fetchLocationTypes,
  fetchOrganizationPartyId,
  fetchProductStores,
  fetchShopifyShop,
  fetchStates,
  generateLatLong,
  fetchPartyRoles,
  fetchShopifyShops
}

