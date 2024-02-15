<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ facilityGroup?.description ? translate('Edit group description')  : translate('Add group description') }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-item>
      <ion-textarea
        :placeholder="translate('group description')"
        :auto-grow="true"
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
  IonItem,
  IonTextarea,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  closeOutline,
  lockClosedOutline
} from "ionicons/icons";
import { mapGetters, useStore } from "vuex";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";
import { hasError } from '@/adapter';
import emitter from "@/event-bus";
import { showToast } from '@/utils';
import { popoverController } from "@ionic/core";

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
    IonItem,
    IonTextarea,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
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
      emitter.emit('presentLoader')
      try {
        const resp = await FacilityService.updateFacilityGroup({
          facilityGroupId: this.facilityGroup.facilityGroupId,
          description: this?.facilityGroupDescription
        })
        if (!hasError(resp)) {
          showToast(translate('Group description updated.'))
          const updatedGroups = JSON.parse(JSON.stringify(this.groups))
            .map((groupData: any) => {
              if (this.facilityGroup.facilityGroupId === groupData.facilityGroupId) {
                groupData.description = this.facilityGroupDescription
              }

              return groupData
            })
          this.store.dispatch('facility/updateFacilityGroups', updatedGroups)
        }

      } catch (error) {
        showToast(translate('Failed to update group description.'))
      }
      popoverController.dismiss();
      this.closeModal();
      emitter.emit('dismissLoader')
    },
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      lockClosedOutline,
      store,
      translate
    };
  },
});
</script>
  