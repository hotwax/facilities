import { api, hasError } from '@/adapter';
import logger from '@/logger';
import { DateTime } from 'luxon';

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

const fetchFacilitiesOrderCount = async(facilityIds: Array<string>): Promise<any> => {
  let facilitiesOrderCount = {}, resp: any;
  try {
    const params = {
      entityName: "FacilityOrderCount",
      inputFields: {
        facilityId: facilityIds,
        facilityId_op: "in",
        entryDate: DateTime.now().toFormat('yyyy-MM-dd'),
      },
      viewSize: facilityIds.length,
      fieldList: ["entryDate", "facilityId", "lastOrderCount"],
    }

    resp = await api({
      url: "performFind",
      method: "post",
      data: params
    })

    if (!hasError(resp) && resp.data.count > 0) {
      facilitiesOrderCount = resp.data.docs.reduce((facilitiesCount: any, facilityCount: any) => {
        facilitiesCount[facilityCount.facilityId] = facilityCount.lastOrderCount
        return facilitiesCount
      }, {})
    } else {
      throw resp.data
    }
  } catch(err) {
    logger.error("Failed to fetch total orders count", err);
  }

  return facilitiesOrderCount;
}

const fetchFacilityOrderCounts = async(facilityId: string): Promise<any> => {
  let facilityOrderCounts = {}, resp: any;
  try {
    const params = {
      entityName: "FacilityOrderCount",
      inputFields: {
        facilityId: facilityId
      },
      viewSize: 10, // only fetching last 10 order consumed information for facility
      fieldList: ["entryDate", "facilityId", "lastOrderCount"],
      orderBy: "entryDate DESC"
    }

    resp = await api({
      url: "performFind",
      method: "post",
      data: params
    })

    if (!hasError(resp) && resp.data.count > 0) {
      facilityOrderCounts = resp.data.docs.map((facilityOrderCount: any) => {
        facilityOrderCount.entryDate = DateTime.fromMillis(facilityOrderCount.entryDate).toFormat('MMM dd yyyy')
        return facilityOrderCount
      })
    } else {
      throw resp.data
    }
  } catch(err) {
    logger.error("Failed to fetch order consumed history for this facility", err);
  }

  return facilityOrderCounts;
}

const fetchFacilityContactDetails = async(payload: any): Promise <any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  });
}

const updateFacility = async (payload: any): Promise<any> => {
  return api({
    url: "service/updateFacility",
    method: "post",
    data: payload
  })
}

const createFacilityPostalAddress = async (payload: any): Promise<any> => {
  return api({
    url: "service/createFacilityPostalAddress",
    method: "post",
    data: payload
  })
}

const updateFacilityPostalAddress = async (payload: any): Promise<any> => {
  return api({
    url: "service/updateFacilityPostalAddress",
    method: "post",
    data: payload
  })
}

export const FacilityService = {
  createFacilityPostalAddress,
  fetchFacilityContactDetails,
  fetchFacilityOnlineGroupInformation,
  fetchFacilityOrderCounts,
  fetchFacilitiesOrderCount,
  fetchFacilities,
  updateFacility,
  updateFacilityPostalAddress
}