import { api, hasError } from '@/adapter';
import logger from '@/logger';
import { DateTime } from 'luxon';
import { prepareOrderQuery } from '@/utils/solrHelper';

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

const createVirtualFacility = async (payload: any): Promise<any> => {
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

const fetchJobData = async(): Promise <any> => {
  const payload = {
    inputFields: {
      "statusId": "SERVICE_PENDING",
      "systemJobEnumId": ["JOB_RLS_ORD_DTE", "JOB_BKR_ORD"],
      "systemJobEnumId_op": "in",
    },
    orderBy: "runTime ASC",
    entityName: "JobSandbox",
    fieldList: ["jobId", "statusId", "serviceName", "systemJobEnumId", "runTime"],
    viewSize: 10
  }

  try {
    const resp = await api({
      url: "performFind", 
      method: "post",
      data: payload
    }) as any;

    if (!hasError(resp) && resp.data.count > 0) {
      const jobs = resp.data.docs;
      const brokeringJob = jobs.find((job: any) => job.systemJobEnumId === 'JOB_BKR_ORD');
      const autoReleaseJob = jobs.find((job: any) => job.systemJobEnumId === 'JOB_RLS_ORD_DTE');
      return { brokeringJob, autoReleaseJob };
    } else {
      throw resp.data;
    }
  } catch(err) {
    logger.error(err);
  }
}
const fetchOrderCountsByFacility = async (facilityIds: Array<string>): Promise<any> => {
  try {
    const query = prepareOrderQuery({
      viewSize: "0",  // passing viewSize as 0, as we don't want to fetch any data
      sort: 'orderDate asc',
      defType: "edismax",
      docType: "ORDER",
      filters: {
        '-shipmentMethodTypeId': { value: 'STOREPICKUP' },
        orderStatusId: { value: '(ORDER_APPROVED OR ORDER_CREATED)' },
        orderTypeId: { value: 'SALES_ORDER' },
        facilityId: { value: facilityIds }
      },
      facet: {
        "facilityFacet": {
          "field": "facilityId",
          "mincount": 1,
          "limit": -1,
          "sort": "index",
          "type": "terms",
          "facet": {
            "groups": "unique(orderId)",
          }
        }
      }
    })
    const resp = await api({
      url: "solr-query",
      method: "post",
      data: query
    }) as any;
    if (!hasError(resp)) {
      const facilityFacets = resp.data.facets.facilityFacet.buckets;
      const facilityOrderCounts = facilityFacets.reduce((countObject: any, facet: any) => {
        countObject[facet.val] = facet.groups;
        return countObject;
      }, {});
      return facilityOrderCounts;
    } else {
      throw resp.data;
    }
  } catch(error) {
    logger.error(error);
  }
}

const fetchFacilityGroups = async (payload: any): Promise<any> => {
  return api({
    url: "performFind",
    method: "post",
    data: payload
  })
}

const fetchArchivedFacilities = async (): Promise<any> => {
  let facilities = []

  try {
    const resp = await api({
      url: "performFind",
      method: "post",
      data: {
        inputFields: {
          facilityGroupId: 'ARCHIVE',
        },
        fieldList: ['facilityName', 'facilityGroupId', 'facilityId', 'facilityGroupTypeId', "fromDate"],
        entityName: "FacilityAndGroupMember",
        distinct: 'Y',
        noConditionFind: 'Y',
        filterByDate: 'Y',
        viewSize: 50
      }
    }) as any

    if (!hasError(resp) && resp.data.count > 0) {
      facilities = resp.data.docs
    } else {
      throw resp.data
    }
  } catch (error) {
    logger.error('Failed to fetch archived parkings.', error)
  }

  return facilities
}

const fetchFacilityCountByGroup = async (facilityGroupIds: any): Promise<any> => {
  if (!facilityGroupIds.length) return []
  const requests = []

  const facilityGroupIdList = facilityGroupIds
  while (facilityGroupIdList.length) {
    const batch = facilityGroupIdList.splice(0, 10)
    const params = {
      inputFields: {
        facilityGroupId: batch
      },
      viewSize: 250, // maximum view size
      entityName: 'FacilityGroupAndMember',
      noConditionFind: "Y",
      filterByDate: 'Y',
      fieldList: ['facilityGroupId', 'facilityId']
    }
    requests.push(params)
  }

  const facilityCountResponse = await Promise.allSettled(requests.map((params) => api({
    url: 'performFind',
    method: 'POST',
    data: params
  })))

  const hasFailedResponse = facilityCountResponse.some((response: any) => hasError(response.value) && !response?.data?.count)
  if (hasFailedResponse) {
    logger.error('Failed to fetch facility count for some groups')
  }

  // taking out the response from Promise.allSettled's 'value' field first 
  const allResponseData = facilityCountResponse.map((response: any) => response.value)
    .reduce((responseData: any, response: any) => {
      if (!hasError(response)) {
        responseData.push(...response.data.docs)
      }
      return responseData
    }, [])

  return allResponseData.reduce((facilityCountByGroup: any, responseData: any) => {
    if (facilityCountByGroup[responseData.facilityGroupId]) {
      facilityCountByGroup[responseData.facilityGroupId] += 1
    } else {
      facilityCountByGroup[responseData.facilityGroupId] = 1
    }
    return facilityCountByGroup
  }, {})
}

const updateFacilityGroup = async (payload: any): Promise<any> => {
  return api({
    url: "service/updateFacilityGroup",
    method: "post",
    data: payload
  })
}

const deleteFacilityGroup = async (payload: any): Promise<any> => {
  return api({
    url: "service/deleteFacilityGroup",
    method: "post",
    data: payload
  })
}

export const FacilityService = {
  addFacilityToGroup,
  addPartyToFacility,
  associateCalendarToFacility,
  createFacilityGroup,
  createFacility,
  createFacilityLocation,
  createVirtualFacility,
  createEnumeration,
  createFacilityCalendar,
  createFacilityIdentification,
  createFacilityPostalAddress,
  createProductStoreFacility,
  createShopifyShopLocation,
  deleteFacilityGroup,
  deleteFacilityLocation,
  deleteShopifyShopLocation,
  fetchArchivedFacilities,
  fetchFacilityGroup,
  fetchFacilityGroups,
  fetchFacilityLocations,
  fetchFacilityContactDetails,
  fetchFacilityCountByGroup,
  fetchFacilities,
  fetchFacilitiesOrderCount,
  fetchFacilityCalendar,
  fetchFacilityGroupInformation,
  fetchFacilityMappings,
  fetchFacilityOrderCounts,
  fetchJobData,
  fetchOrderCountsByFacility,
  getFacilityProductStores,
  fetchShopifyFacilityMappings,
  getFacilityParties,
  getPartyRoleAndPartyDetails,
  removeFacilityCalendar,
  removePartyFromFacility,
  updateFacility,
  updateFacilityGroup,
  updateFacilityIdentification,
  updateFacilityLocation,
  updateFacilityPostalAddress,
  updateFacilityToGroup,
  updateProductStoreFacility,
  updateShopifyShopLocation
}