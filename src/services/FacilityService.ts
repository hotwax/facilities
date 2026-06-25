import { commonUtil } from '@common';
import { UserService } from './UserService';
import { useUtilStore } from '@/store/util';
import { useFacilityStore } from '@/store/facility';

const createFacilityLogin = async (payload: any): Promise <any> => {
  const organizationPartyId = useUtilStore().getOrganizationPartyId;

  try {
    //Create role type if not exists. This is required for associating facility login user to facility.
    if (!await UserService.isRoleTypeExists("FAC_LOGIN")) {
      const resp = await UserService.createRoleType({
        "roleTypeId": "FAC_LOGIN",
        "description": "Facility Login",
      })
      if (commonUtil.hasError(resp)) {
        throw resp.data;
      }
    }

    const params = {
      "groupName": payload.facilityName,
      "partyTypeId": "PARTY_GROUP",
      "partyIdFrom": organizationPartyId,
      "roleTypeIdFrom": "INTERNAL_ORGANIZATIO", // not a typo
      "roleTypeIdTo": "APPLICATION_USER",
      "partyRelationshipTypeId": "EMPLOYMENT"
    }

    let resp = await UserService.createRelationship(params);
    if (commonUtil.hasError(resp)) {
      throw resp.data;
    }
    const partyId = resp.data.partyId;

    resp = await UserService.createNewUserLogin({
      "partyId": partyId,
      "userLoginId": payload.username,
      "currentPassword": payload.password,
      "currentPasswordVerify": payload.password,
      "requirePasswordChange": "N",
      "enabled": "Y",
      "userPrefTypeId": "ORGANIZATION_PARTY",
      "userPrefValue": organizationPartyId
    });
    if (commonUtil.hasError(resp)) {
      throw resp.data;
    }

    const promises = [];
    promises.push(UserService.addUserToSecurityGroup({
      "partyIdTo": partyId,
      "securityGroupId": "STORE_MANAGER",
    }));
    if (payload.emailAddress) {
      promises.push(UserService.createUpdatePartyEmailAddress({
        "partyId": partyId,
        "emailAddress": payload.emailAddress,
        "contactMechPurposeTypeId": "PRIMARY_EMAIL",
      }));
    }
    promises.push(useFacilityStore().addPartyToFacility({
      "partyId": partyId,
      "facilityId": payload.facilityId,
      "roleTypeId": "WAREHOUSE_MANAGER"
    }));
    promises.push(useFacilityStore().addPartyToFacility({
      "partyId": partyId,
      "facilityId": payload.facilityId,
      "roleTypeId": "FAC_LOGIN"
    }));
    await Promise.all(promises).then(responses => {
      responses.forEach(response => {
        if (commonUtil.hasError(response)) {
          throw response.data;
        }
      });
    })
  } catch (error: any) {
    return Promise.reject(error)
  }
}

export const FacilityService = {
  createFacilityLogin,
}