<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ currentFacilityUser?.groupName }}</ion-list-header>
      <ion-item button @click="viewDetails()">
        {{ translate("View details") }}
        <ion-icon slot="end" :icon="keyOutline" />
      </ion-item>
      <ion-item button @click="sendResetPasswordEmail()">
        {{ translate("Reset password email") }}
        <ion-icon slot="end" :icon="mailOutline" />
      </ion-item>
      <ion-item button lines="none" @click="unlinkFacilityLoginAlert()">
        {{ translate("Unlink") }}
        <ion-icon slot="end" :icon="removeCircleOutline" />
      </ion-item>
    </ion-list>
  </ion-content>
</template>
  
<script setup lang="ts">
import {
  IonContent,
  IonIcon,
  IonItem,
  IonList,
  IonListHeader,
  alertController,
  popoverController
} from "@ionic/vue";
import { removeCircleOutline, mailOutline, keyOutline } from "ionicons/icons";
import { translate } from "@hotwax/dxp-components";
import { FacilityService } from "@/services/FacilityService";
import { UserService } from "@/services/UserService"
import { DateTime } from "luxon";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import logger from "@/logger";
import emitter from "@/event-bus";
import { useAuthStore } from '@hotwax/dxp-components'
import router from "@/router";
import { useFacilityStore } from "@/store/facility";

const props = defineProps(['currentFacility', 'currentFacilityUser', "facilityTypeDesc"]);
const facilityStore = useFacilityStore();
const authStore = useAuthStore();

async function viewDetails() {
  popoverController.dismiss();
  const userDetailUrl = `${import.meta.env.VITE_APP_USERS_LOGIN_URL}?oms=${authStore.oms}&token=${authStore.token.value}&expirationTime=${authStore.token.expiration}&partyId=${props.currentFacilityUser.partyId}&redirectedFrom=${router.currentRoute.value.path}`;
  window.location.href = userDetailUrl;
}

async function sendResetPasswordEmail() {
  try {
    const resp = await UserService.sendResetPasswordEmail({
      emailAddress: props.currentFacilityUser.infoString,
      userName: props.currentFacilityUser.userLoginId
    });
    if (!hasError(resp)) {
      showToast(translate('Password reset email sent successfully.'));
    } else {
      throw resp.data;
    }
  } catch (error) {
    showToast(translate('Failed to send password reset email.'));
    console.error(error);
  }
  popoverController.dismiss();
}

async function removePartyFromFacilityCompletely(payload: any) {
  try {
    //fetching all the roles in which the user is associated with the facility
    const resp = await FacilityService.getFacilityParties({
      inputFields: {
        "partyId": payload.partyId,
        "facilityId": payload.facilityId,
      },
      fieldList: ['facilityId', 'partyId', 'roleTypeId', 'fromDate'],
      entityName: "FacilityParty",
      distinct: 'Y',
      noConditionFind: 'Y',
      filterByDate: 'Y',
      viewSize: 50
    });
    if (!hasError(resp) && resp.data.count > 0) {
      const facilityParties = resp.data.docs;

      const promises = facilityParties.map((facilityParty: any) => 
        FacilityService.removePartyFromFacility({
          ...facilityParty,
          thruDate: DateTime.now().toMillis(),
        })
      );
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        if (hasError(response)) {
          throw response.data;
        }
      });
    } else {
      throw resp.data;
    }
  } catch (err) {
    showToast(translate('Failed to remove party from facility'));
    logger.error('Failed to remove party from facility', err);
    return;
  }
}

async function unlinkFacilityLogin(data: any) {
  emitter.emit('presentLoader');

  try {
    //Unlinking user from facility will only remove FAC_LOGIN role from facility
    if (data === 'UNLINK') {
      const resp = await FacilityService.removePartyFromFacility({
        facilityId: props.currentFacilityUser.facilityId,
        partyId: props.currentFacilityUser.partyId,
        roleTypeId: props.currentFacilityUser.roleTypeId,
        fromDate: props.currentFacilityUser.fromDate,
        thruDate: DateTime.now().toMillis(),
      });
      if (!hasError(resp)) {
        showToast(translate("Facility login removed."));
      } else {
        throw resp.data;
      }
    }

    //Blocking user will remove all the roles from facility in which the user is associated, also block the userlogin.
    if (data === 'BLOCK') {
      await removePartyFromFacilityCompletely({ facilityId: props.currentFacility.facilityId, partyId: props.currentFacilityUser.partyId });
      const resp = await UserService.updateUserLoginStatus({
        enabled: 'N',
        partyId: props.currentFacilityUser.partyId,
        userLoginId: props.currentFacilityUser.userLoginId
      });
      if (!hasError(resp)) {
        showToast(translate("Facility login removed."));
      } else {
        throw resp.data;
      }
    }
    //fetching updated facility logins
    await facilityStore.fetchFacilityLogins({ facilityId: props.currentFacility?.facilityId });
  } catch (err) {
    showToast(translate("Failed to remove facility login."));
    logger.error(err);
  }
  emitter.emit('dismissLoader');
  popoverController.dismiss();
}

async function unlinkFacilityLoginAlert() {
  const message = 'Unlinking this login as an official facility login will not prevent this user from being used to login at this facility. Do you also want to block this user from logging into this facility?';
  const alert = await alertController.create({
    header: translate(`Unlink ${props.facilityTypeDesc} login`),
    message: translate(message, { space: "<br><br>" }),
    inputs: [
      {
        label: translate('Unlink'),
        type: 'radio',
        value: 'UNLINK',
        checked: true
      },
      {
        label: translate('Unlink and block'),
        type: 'radio',
        value: 'BLOCK',
      },
    ],
    buttons: [
      {
        text: translate("Cancel"),
      },
      {
        text: translate("Confirm"),
        handler: async (data: any) => {
          await unlinkFacilityLogin(data);
        }
      }
    ],
  });
  return alert.present();
}
</script>