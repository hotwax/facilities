<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()"> 
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Group type") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <form @keyup.enter="saveGroupType()">
      <!-- Empty state -->
      <div class="empty-state" v-if="facilityGroupTypes.length === 0">
        <p>{{ translate("No group types found")}}</p>
      </div>

      <div v-else>
        <ion-list>
          <ion-radio-group v-model="facilityGroupValues.facilityGroupTypeId">
            <ion-item :key="groupType.facilityGroupTypeId" v-for="groupType in facilityGroupTypes">
              <ion-label>
                {{ groupType.description ? groupType.description : groupType.facilityGroupTypeId }}
              </ion-label>
              <ion-radio :value="groupType.facilityGroupTypeId" slot="start" />
            </ion-item>
          </ion-radio-group>
        </ion-list>
      </div>
    </form>

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="saveGroupType()">
        <ion-icon :icon="saveOutline" />
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
  IonItem,
  IonIcon,
  IonLabel,
  IonList,
  IonRadioGroup,
  IonRadio,
  IonTitle,
  IonToolbar,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { useStore } from "@/store";
import { translate } from "@hotwax/dxp-components";
import { mapGetters } from "vuex";
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@hotwax/oms-api";
import logger from "@/logger";
import { showToast } from "@/utils";
import { popoverController } from "@ionic/core";

export default defineComponent({
  name: "GroupTypeModal",
  components: { 
    IonButtons,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonRadioGroup,
    IonRadio,
    IonTitle,
    IonToolbar 
  },
  data() {
    return {
      facilityGroupValues: JSON.parse(JSON.stringify(this.facilityGroup))
    }
  },
  props: ["facilityGroup"],
  computed: {
    ...mapGetters({
      facilityGroupTypes: "util/getFacilityGroupTypes",
      groups: "facility/getFacilityGroups",
    })
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async saveGroupType() {
      try {
        const resp = await FacilityService.updateFacilityGroup({
          facilityGroupId: this.facilityGroupValues.facilityGroupId,
          facilityGroupTypeId: this.facilityGroupValues.facilityGroupTypeId
        })

        if(!hasError(resp)) {
          showToast(translate("Facility group type updated successfully."))
          this.groups.map((group: any) => {
            if(group.facilityGroupId === this.facilityGroupValues.facilityGroupId) {
              group.facilityGroupTypeId = this.facilityGroupValues.facilityGroupTypeId
            }
          })
          await this.store.dispatch('facility/updateFacilityGroups', this.groups)
          modalController.dismiss()
        } else {
          throw resp.data;
        }
      } catch(err) {
        showToast(translate("Failed to update facility group type."))
        logger.error(err)
      }
    }
  },
  setup() {
    const store = useStore();
    return {
      closeOutline,
      saveOutline,
      translate,
      store
    };
  }
});
</script>