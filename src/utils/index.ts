import { translate } from '@hotwax/dxp-components';
import { Plugins } from '@capacitor/core';
import { toastController } from '@ionic/vue';
import { FacilityService } from "@/services/FacilityService";
import { DateTime } from 'luxon';
import { hasError } from "@/adapter";
import store from '@/store'
import logger from "@/logger";

// TODO Use separate files for specific utilities

const showToast = async (message: string, options?: any) => {  
  const config = {
    message,
    ...options
  } as any;

  if (!options?.position) {
    config.position = 'bottom';
  }
  if (options?.canDismiss) {
    config.buttons = [
      {
        text: translate('Dismiss'),
        role: 'cancel',
      },
    ]
  }
  if (!options?.manualDismiss) {
    config.duration = 3000;
  }

  const toast = await toastController.create(config)
  // present toast if manual dismiss is not needed
  return !options?.manualDismiss ? toast.present() : toast
}

const copyToClipboard = async (value: string, text?: string) => {
  const { Clipboard } = Plugins;

  await Clipboard.write({
    string: value,
  }).then(() => {
    text ? showToast(translate(text)) : showToast(translate("Copied", { value }));
  });
}

const isValidPassword = (password : string) => {
  // Regular expression pattern for a valid password
  const passwordPattern = /^.*(?=.{5,})(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).*$/;
  return passwordPattern.test(password);
}

const isValidEmail = (email : string) => {
  // Regular expression pattern for a valid email address
  const emailPattern = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  return emailPattern.test(email);
}

// will sort the list but keeps the customValues at the beginning
const customSort = (list: any, customValues: Array<string>, sortParameter: string) => {
  return list.sort((first: any, second: any) => {
    const firstVal = customValues.indexOf(first[sortParameter]);
    const secondVal = customValues.indexOf(second[sortParameter]);
    return secondVal - firstVal;
  });
}

const generateInternalId = (name: string) => {
  return name.trim().toUpperCase().split(' ').join('_');
}

const updateFacilityGroup = async (currentFacility: any, facilityGroup: any, isChecked: boolean) => {
  try {
    let resp, successMessage;
    if(isChecked) {
      resp = await FacilityService.addFacilityToGroup({
        "facilityId": currentFacility.facilityId,
        "facilityGroupId": facilityGroup.facilityGroupId
      });
      successMessage = translate('is now selling on', { "facilityName": currentFacility.facilityName, "facilityGroupId": facilityGroup.facilityGroupName });
    } else {
      const groupInformation = currentFacility.groupInformation.find((group: any) => group.facilityGroupId === facilityGroup.facilityGroupId)
      resp = await FacilityService.updateFacilityToGroup({
        "facilityId": currentFacility.facilityId,
        "facilityGroupId": facilityGroup.facilityGroupId,
        "fromDate": groupInformation.fromDate,
        "thruDate": DateTime.now().toMillis()
      })
      successMessage = translate('no longer sells on', { "facilityName": currentFacility.facilityName, "facilityGroupId": facilityGroup.facilityGroupName })
    }
    if(!hasError(resp)) {
      showToast(successMessage);
      const updatedGroupInformation = await FacilityService.fetchFacilityGroupInformation([currentFacility.facilityId])
      currentFacility.groupInformation = Object.values(updatedGroupInformation)[0];
      // Update the facility list to reflect the change in sell online status
      const facilitiesList = JSON.parse(JSON.stringify(store.getters["facility/getFacilities"]));
      const updatedFacilities = facilitiesList.map((facility: any) => {
        if(facility.facilityId === currentFacility.facilityId) {
          facility.sellOnline = currentFacility.groupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupTypeId === 'CHANNEL_FAC_GROUP');
          facility.groupInformation = currentFacility.groupInformation;
        }
        return facility;
      });
      store.dispatch('facility/updateFacilities', updatedFacilities);
    } else {
      throw resp.data
    }
  } catch (err) {
    showToast('Failed to update sell inventory online setting');
    logger.error('Failed to update sell inventory online setting', err);
  }
}

export { copyToClipboard, customSort, generateInternalId, isValidEmail, isValidPassword, showToast, updateFacilityGroup }
