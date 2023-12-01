import { api, hasError } from '@/adapter';
import logger from '@/logger';
import { DateTime } from 'luxon';

const createFacilityPostalAddress = async (payload: any): Promise<any> => {
  return api({
    url: "service/createFacilityPostalAddress",
    method: "post",
    data: payload
  })
}

const fetchFacilities = async(query: any): Promise <any> => {
  return api({
    url: "performFind", 
    method: "post",
    data: query
  });
}

const fetchFacilityGroupInformation = async(facilityIds: Array<string>): Promise<any> => {
  let facilitiesGroupInformation = []
  
  const params = {
    inputFields: {
      facilityId: facilityIds,
      facilityId_op: "in"
    },
    fieldList: ['facilityGroupId', 'facilityId', 'facilityGroupTypeId', "fromDate"],
    entityName: "FacilityGroupAndMember",
    distinct: 'Y',
    filterByDate: 'Y',
    viewSize: facilityIds.length * 10 // multiplying the id by 10, as one facility at max will be in 10 groups
  }

  try {
    const resp = await api({
      url: "performFind", 
      method: "post",
      data: params
    }) as any;

    if(!hasError(resp) && resp.data.count > 0) {
      facilitiesGroupInformation = resp.data.docs.reduce((facilityGroups: any, facilityGroup: any) => {

        if(facilityGroups[facilityGroup.facilityId]) {
          facilityGroups[facilityGroup.facilityId].push({
            ...facilityGroup
          })
        } else {
          facilityGroups[facilityGroup.facilityId] = [{
            ...facilityGroup
          }]
        }

        return facilityGroups
      }, {})
    } else {
      throw resp.data;
    }
  } catch(err) {
    logger.error(err)
  }

  return facilitiesGroupInformation;
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

const getFacilityParties = async(payload: any): Promise <any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  });
}

const getPartyRoleAndPartyDetails = async(payload: any): Promise <any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  });
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

const fetchFacilityGroup = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  });
}

const fetchFacilityContactDetails = async(payload: any): Promise <any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  });
}

const getFacilityProductStores = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload
  })
}



const addPartyToFacility = async (payload: any): Promise <any> => {
  return api({
    url: "service/addPartyToFacility",
    method: "post",
    data: payload
  });
}



const removePartyFromFacility = async (payload: any): Promise <any> => {
  return api({
    url: "service/removePartyFromFacility",
    method: "post",
    data: payload
  });
}


const updateProductStoreFacility = async (payload: any): Promise <any> => {
  return api({
    url: "service/updateProductStoreFacility",
    method: "post",
    data: payload
  });
}

const fetchFacilityLocations = async(payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "POST",
    data: payload
  })
}


const addFacilityToGroup = async (payload: any): Promise<any> => {
  return api({
    url: "service/addFacilityToGroup",
    method: "post",
    data: payload
  })
}

const associateCalendarToFacility = async (payload: any): Promise<any> => {
  return api({
    url: "service/createFacilityCalendar",
    method: "post",
    data: payload
  })
}

const createFacilityGroup = async(payload: any): Promise<any> => {
  return api({
    url: "service/createFacilityGroup",
    method: "post",
    data: payload
  })
}

const createFacilityLocation = async(payload: any): Promise<any> => {
  return api({
    url: "service/createFacilityLocation",
    method: "post",
    data: payload
  })
}

const createProductStoreFacility = async (payload: any): Promise <any> => {
  return api({
    url: "service/createProductStoreFacility",
    method: "post",
    data: payload
  });
}

const fetchFacilityPrimaryMember = async (payload: any): Promise <any> => {
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

const updateFacilityLocation = async(payload: any): Promise<any> => {
  return api({
    url: "service/updateFacilityLocation",
    method: "post",
    data: payload
  })
}

const deleteFacilityLocation = async(payload: any): Promise<any> => {
  return api({
    url: "service/deleteFacilityLocation",
    method: "post",
    data: payload
  })
}

const updateFacilityToGroup = async (payload: any): Promise<any> => {
  return api({
    url: "service/updateFacilityToGroup",
    method: "post",
    data: payload
  })
}

const createFacility = async (payload: any): Promise<any> => {
  return api({
    url: "service/createFacility",
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


const fetchFacilityMappings = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  })
}

const fetchShopifyFacilityMappings = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  })
}

const createFacilityIdentification = async (payload: any): Promise<any> => {
  return api({
    url: "service/createFacilityIdentification",
    method: "post",
    data: payload
  })
}

const updateFacilityIdentification = async (payload: any): Promise<any> => {
  return api({
    url: "service/updateFacilityIdentification",
    method: "post",
    data: payload
  })
}

const createShopifyShopLocation = async (payload: any): Promise<any> => {
  return api({
    url: "service/createShopifyShopLocation",
    method: "post",
    data: payload
  })
}

const updateShopifyShopLocation = async (payload: any): Promise<any> => {
  return api({
    url: "service/updateShopifyShopLocation",
    method: "post",
    data: payload
  })
}

const deleteShopifyShopLocation = async (payload: any): Promise<any> => {
  return api({
    url: "service/deleteShopifyShopLocation",
    method: "post",
    data: payload
  })
}

const createEnumeration = async (payload: any): Promise<any> => {
  return api({
    url: "service/createEnumeration",
    method: "post",
    data: payload
  })
}

const fetchFacilityCalendar = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  })
}

const createFacilityCalendar = async (payload: any): Promise<any> => {
  return api({
    url: "service/calendarDataSetup",
    method: "post",
    data: payload
  })
}

const removeFacilityCalendar = async (payload: any): Promise<any> => {
  return api({
    url: "service/expireFacilityCalendar",
    method: "post",
    data: payload
  })
}

const fetchJobs = async(payload: any): Promise <any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  });
}
const fetchOrderCountsByFacility = async (query: any): Promise<any> => {
  return api({
    url: "solr-query",
    method: "post",
    data: query
  });
}

export const FacilityService = {
  addFacilityToGroup,
  createFacilityGroup,
  createFacility,
  createFacilityLocation,
  addPartyToFacility,
  associateCalendarToFacility,
  createEnumeration,
  createFacilityCalendar,
  createFacilityIdentification,
  createFacilityPostalAddress,
  createProductStoreFacility,
  deleteFacilityLocation,
  fetchFacilityGroup,
  fetchFacilityLocations,
  fetchFacilityContactDetails,
  createShopifyShopLocation,
  deleteShopifyShopLocation,
  fetchFacilities,
  fetchFacilitiesOrderCount,
  fetchFacilityCalendar,
  fetchFacilityGroupInformation,
  fetchFacilityMappings,
  fetchFacilityOrderCounts,
  fetchFacilityPrimaryMember,
  fetchJobs,
  fetchOrderCountsByFacility,
  getFacilityProductStores,
  fetchShopifyFacilityMappings,
  getFacilityParties,
  getPartyRoleAndPartyDetails,
  removeFacilityCalendar,
  removePartyFromFacility,
  updateFacility,
  updateFacilityIdentification,
  updateFacilityLocation,
  updateFacilityPostalAddress,
  updateFacilityToGroup,
  updateProductStoreFacility,
  updateShopifyShopLocation
}