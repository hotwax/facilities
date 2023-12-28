export default interface FacilityState {
  facilityQuery: {
    queryString: string,
    productStoreId: string,
    facilityTypeId: string,
    facilityGroupId: string
  },
  groupQuery: {
    queryString: string
  },
  facilities: {
    list: Array<object>,
    total: number
  };
  virtualFacilities: {
    list: Array<object>,
    total: number
  };
  facilityGroups: {
    list: Array<object>,
    total: number
  };
  archivedFacilities: Array<object>;
  current: any;
}