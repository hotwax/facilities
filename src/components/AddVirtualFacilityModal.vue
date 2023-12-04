<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("New parking") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="createVirtualFacility">
      <ion-list>
        <ion-item>
          <ion-label position="floating">
            {{ translate("Name") }} <ion-text color="danger">*</ion-text>
          </ion-label>
          <ion-input @ionBlur="setFacilityId($event)" v-model="formData.facilityName"/>
        </ion-item>
        <ion-item ref="facilityId">
          <ion-label position="floating">
            {{ translate("Internal ID") }}
          </ion-label>
          <ion-input v-model="formData.facilityId" @keyup="validateFacilityId" @ionBlur="markFacilityIdTouched" />
          <ion-note slot="error">
            {{ translate('Internal ID cannot be more than 20 characters.') }}
          </ion-note>
        </ion-item>
        <ion-item>
          <ion-label position="floating">
            {{ translate("Description") }}
          </ion-label>
          <ion-input v-model="formData.description"/>
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="createVirtualFacility" @keyup.enter.stop>
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </form>
  </ion-content>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { addOutline, closeOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";
import { mapGetters, useStore } from 'vuex'
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import logger from "@/logger";

export default defineComponent({
  name: "AddVirtualFacility",
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonText,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      virtualFacilities: 'facility/getVirtualFacilities',
    })
  },
  data() {
    return {
      formData: {
        facilityName: '',
        facilityId: '',
        description: '',
      },
    }
  },
  ionViewWillEnter() {
    this.clearFormData()
  },
  methods: {
    clearFormData() {
      this.formData = {
        facilityName: '',
        facilityId: '',
        description: '',
      }
    },
    setFacilityId(event: any) {
      this.formData.facilityId = event.target.value.trimEnd().trimStart().toUpperCase().split(' ').join('_');
    },
    closeModal() {
      modalController.dismiss();
    },
    async createVirtualFacility() {
      if (!this.formData.facilityName?.trim()) {
        showToast(translate('Please fill all the required fields'))
        return;
      }

      if (this.formData.facilityId.length > 20) {
        showToast(translate('Internal ID cannot be more than 20 characters.'))
        return
      }

      // In case the user does not lose focus from the facility name input
      // and click on create the button, we need to set the internal id manually
      if (!this.formData.facilityId) {
        this.formData.facilityId = this.formData.facilityName.trimEnd().trimStart().toUpperCase().split(' ').join('_');
      }

      try {
        const payload = {
          ...this.formData,
          facilityTypeId: 'VIRTUAL_FACILITY',
          ownerPartyId: "COMPANY"
        }

        const resp = await FacilityService.createVirtualFacility(payload);
        if (!hasError(resp)) {
          showToast(translate("New parking created successfully."))
          // TODO consider updating facility state instead of fetching
          const createdFacility = {
            ...this.formData,
            facilityTypeId: 'VIRTUAL_FACILITY',
            orderCount: 0
          }
          const updatedVirtualFacilities = [...this.virtualFacilities, createdFacility]
          this.store.dispatch('facility/updateVirtualFacilities', updatedVirtualFacilities)
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error)
        showToast(translate('Failed to create parking.'))
      }
      modalController.dismiss()
    },
    validateFacilityId(event: any) {
      const value = event.target.value;
      (this as any).$refs.facilityId.$el.classList.remove('ion-valid');
      (this as any).$refs.facilityId.$el.classList.remove('ion-invalid');

      if (value === '') return;

      this.formData.facilityId.length <= 20
        ? (this as any).$refs.facilityId.$el.classList.add('ion-valid')
        : (this as any).$refs.facilityId.$el.classList.add('ion-invalid');
    },
    markFacilityIdTouched() {
      (this as any).$refs.facilityId.$el.classList.add('ion-touched');
    },
  },
  setup() {
    const store = useStore();

    return {
      addOutline,
      closeOutline,
      store,
      translate
    };
  },
});
</script>