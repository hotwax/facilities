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

const fetchLocationTypes = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload,
    cache: true
  })
}

export const UtilService = {
  fetchFacilityTypes,
  fetchLocationTypes,
  fetchProductStores,
  generateLatLong
}

