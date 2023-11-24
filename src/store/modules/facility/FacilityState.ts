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
  current: any;
  createdFacility: any;
}