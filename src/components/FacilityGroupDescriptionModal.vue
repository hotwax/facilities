<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate('Edit group detail') }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-item>
      <ion-input label-placement="floating" v-model="facilityGroupName">
        <div slot="label">{{ translate("Name") }} <ion-text color="danger">*</ion-text></div>
      </ion-input>
    </ion-item>
    <ion-item lines="none">
      <ion-textarea :label="translate('Description')" label-placement="floating"
        :placeholder="translate('group description')"
        :auto-grow="true"
        :counter="true" 
        :maxlength="255"
        v-model="facilityGroupDescription"
      >
      </ion-textarea>
    </ion-item>
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="updateFacilityGroupDescription()">
        <ion-icon :icon="lockClosedOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script lang="ts">
import {
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline
} from "ionicons/icons";
import { mapGetters, useStore } from "vuex";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";
import { hasError } from '@/adapter';
import emitter from "@/event-bus";
import { showToast } from '@/utils';

export default defineComponent({
  name: "CustomFieldModal",
  components: {
    IonButtons,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonText,
    IonTextarea,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
      facilityGroupName: this.facilityGroup.facilityGroupName,
      facilityGroupDescription: this.facilityGroup.description,
    }
  },
  computed: {
    ...mapGetters({
      groups: 'facility/getFacilityGroups',
    })
  },
  props: ['facilityGroup'],
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    async updateFacilityGroupDescription() {
      if (this.facilityGroupName.trim().length <= 0) {
        showToast(translate('Facility group name cannot be empty'));
        return false;    
      }
      emitter.emit('presentLoader')
      try {
        const resp = await FacilityService.updateFacilityGroup({
          facilityGroupId: this.facilityGroup.facilityGroupId,
          facilityGroupName: this.facilityGroupName,
          description: this?.facilityGroupDescription
        })
        if (!hasError(resp)) {
          showToast(translate('Group detail updated.'))
          const updatedGroups = JSON.parse(JSON.stringify(this.groups))
            .map((groupData: any) => {
              if (this.facilityGroup.facilityGroupId === groupData.facilityGroupId) {
                groupData.facilityGroupName = this.facilityGroupName
                groupData.description = this.facilityGroupDescription
              }

              return groupData
            })
          this.store.dispatch('facility/updateFacilityGroups', updatedGroups)
        }

      } catch (error) {
        showToast(translate('Failed to update group detail.'))
      }
      this.closeModal();
      emitter.emit('dismissLoader')
    },
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      eyeOutline,
      eyeOffOutline,
      lockClosedOutline,
      mailOutline,
      store,
      translate
    };
  },
});
</script>
  