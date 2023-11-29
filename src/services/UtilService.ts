import { api } from '@/adapter';

const fetchFacilityTypes = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const fetchProductStores = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const generateLatLong = async (payload: any): Promise<any> => {
  return api({
    url: "postcodeLookup",
    method: "POST",
    data: payload,
    cache: true
  })
}

const fetchPartyRoles = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload,
    cache: true
  })
}

const fetchLocationTypes = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const fetchCountries = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const fetchStates = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const fetchExternalMappingTypes = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

const fetchShopifyShops = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

export const UtilService = {
  fetchCountries,
  fetchExternalMappingTypes,
  fetchFacilityTypes,
  fetchLocationTypes,
  fetchProductStores,
  fetchStates,
  generateLatLong,
  fetchPartyRoles,
  fetchShopifyShops
}

