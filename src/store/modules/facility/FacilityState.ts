export default interface FacilityState {
  query: {
    queryString: string,
    productStoreId: string,
    facilityTypeId: string
  };
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