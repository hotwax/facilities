export default interface FacilityState {
  query: {
    queryString: string,
    productStoreId: string,
    facilityTypeId: string
  };
  selectedFacility: object;
  facilities: {
    list: Array<object>,
    total: number
  };
  current: any;
}