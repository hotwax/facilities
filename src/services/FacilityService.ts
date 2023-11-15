import { api, hasError } from '@/adapter';
import logger from '@/logger';

const fetchFacilities = async(query: any): Promise <any> => {
  return api({
    url: "performFind", 
    method: "post",
    data: query
  });
}

const fetchFacilityOnlineGroupInformation = async(facilityIds: Array<string>): Promise<any> => {
  let facilitiesWithSellOnlineEnabled = []
  
  const params = {
    inputFields: {
      facilityId: facilityIds,
      facilityId_op: "in",
      facilityGroupTypeId: 'SHOPIFY_GROUP_FAC',
      facilityGroupTypeId_op: 'equals'
    },
    fieldList: ['facilityId', 'facilityGroupTypeId'],
    entityName: "FacilityGroupAndMember",
    distinct: 'Y',
    filterByDate: 'Y',
    viewSize: facilityIds.length
  }

  try {
    const resp = await api({
      url: "performFind", 
      method: "post",
      data: params
    }) as any;

    if(!hasError(resp) && resp.data.count > 0) {
      facilitiesWithSellOnlineEnabled = resp.data.docs.map((facility: any) => facility.facilityId)
    } else {
      throw resp.data;
    }
  } catch(err) {
    logger.error(err)
  }

  return facilitiesWithSellOnlineEnabled;
}

const updateFacility = async (payload: any): Promise<any> => {
  return api({
    url: "service/updateFacility",
    method: "post",
    data: payload
  })
}

export const FacilityService = {
  fetchFacilityOnlineGroupInformation,
  fetchFacilities,
  updateFacility
}