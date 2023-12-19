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
  
<script lang="ts">
import {
  IonContent,
  IonIcon,
  IonItem,
  IonList,
  IonListHeader,
  alertController,
  popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { removeCircleOutline, mailOutline, keyOutline } from "ionicons/icons";
import { translate } from "@hotwax/dxp-components";
import { useStore } from "vuex";
import { FacilityService } from "@/services/FacilityService";
import { UserService } from "@/services/UserService"
import { DateTime } from "luxon";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import logger from "@/logger";
import emitter from "@/event-bus";

export default defineComponent({
  name: "ProductStorePopover",
  components: {
    IonContent,
    IonIcon,
    IonItem,
    IonList,
    IonListHeader
  },
  props: ['currentFacility', 'currentFacilityUser', "parentFacilityTypeDesc"],
  methods: {
    async viewDetails() {
      const userDetailUrl = `${process.env.VUE_APP_USERS_APPLICATION_URL}/user-details/${this.currentFacilityUser.partyId}`
      window.location.href = userDetailUrl
      popoverController.dismiss()
    },
    async sendResetPasswordEmail() {
      try {
        const resp = await UserService.sendResetPasswordEmail({
          emailAddress: this.currentFacilityUser.infoString,
          userName: this.currentFacilityUser.userLoginId
        })
        if (!hasError(resp)) {
          showToast(translate('Password reset email sent successfully.'))
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate('Failed to send password reset email.'))
        console.error(error)
      }
      popoverController.dismiss()
    },
    async removePartyFromFacilityCompletely(payload: any) {
      try {
        //fetching all the roles in which the user is associated with the facility
        let resp = await FacilityService.getFacilityParties({
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
        })
        if (!hasError(resp) && resp.data.count > 0) {
          const facilityParties = resp.data.docs;

          const promises = [] as any;
          facilityParties.forEach((facilityParty: any) => {
            promises.push(FacilityService.removePartyFromFacility({
              ...facilityParty,
              thruDate: DateTime.now().toMillis(),
            }))
          });
          await Promise.all(promises).then(responses => {
            responses.forEach(response => {
              if (hasError(response)) {
                throw response.data;
              }
            });
          })
        } else {
          throw resp.data;
        }
      } catch (err) {
        showToast(translate('Failed to remove party from facility'))
        logger.error('Failed to remove party from facility', err)
        return;
      }
    },
    async unlinkFacilityLogin(data: any) {
      emitter.emit('presentLoader')

      try {

        //Unlinking user from facility will only remove FAC_LOGIN role from facility
        if (data === 'UNLINK') {
          let resp = await FacilityService.removePartyFromFacility({
            facilityId: this.currentFacilityUser.facilityId,
            partyId: this.currentFacilityUser.partyId,
            roleTypeId: this.currentFacilityUser.roleTypeId,
            fromDate: this.currentFacilityUser.fromDate,
            thruDate: DateTime.now().toMillis(),
          })
          if (!hasError(resp)) {
            showToast(translate("Facility login removed."))
          } else {
            throw resp.data;
          }
        }

        //Blocking user will remove all the roles from facility in which the user is associated, also block the userlogin.
        if (data === 'BLOCK') {
          await this.removePartyFromFacilityCompletely({ facilityId: this.currentFacility.facilityId, partyId: this.currentFacilityUser.partyId }) as any;
          const resp = await UserService.updateUserLoginStatus({
            enabled: 'N',
            partyId: this.currentFacilityUser.partyId,
            userLoginId: this.currentFacilityUser.userLoginId
          });
          if (!hasError(resp)) {
            showToast(translate("Facility login removed."))
          } else {
            throw resp.data;
          }
        }
        //fetching updated facility logins
        await this.store.dispatch('facility/fetchFacilityLogins', { facilityId: this.currentFacility?.facilityId })
      } catch (err) {
        showToast(translate("Failed to remove facility login."))
        logger.error(err)
      }
      emitter.emit('dismissLoader')
      popoverController.dismiss()
    },
    async unlinkFacilityLoginAlert() {
      const message = 'Unlinking this login as an official facility login will not prevent this user from being used to login at this facility. Do you also want to block this user from logging into this facility?'
      const alert = await alertController.create({
        header: translate(`Unlink ${this.parentFacilityTypeDesc} login`),
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
              await this.unlinkFacilityLogin(data);
            }
          }
        ],
      });
      return alert.present();
    }
  },
  setup() {
    const store = useStore();

    return {
      removeCircleOutline,
      keyOutline,
      mailOutline,
      store,
      translate
    };
  }
});
</script>