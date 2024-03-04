<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon slot="icon-only" :icon="close" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Select facilities") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-searchbar v-model="queryString" @keyup.enter="queryString = $event.target.value; fetchFacilities()" />
    <ion-chip outline>
      {{ translate("Facilities:", { count: selectedFacilityValues.length }) }}
    </ion-chip>

    <ion-list>
      <div class="ion-padding" v-if="!facilities.length">
        {{ translate("No facility found") }}
      </div>
      <div v-else>
        <ion-item v-for="(facility, index) in facilities" :key="index" @click="updateSelectedFacilities(facility.facilityId)" lines="none">
          <ion-label>
            {{ facility.facilityName }}
            <p>{{ facility.facilityId }}</p>
          </ion-label>
          <ion-checkbox :checked="isFacilitySelected(facility.facilityId)" />
        </ion-item>
      </div>
    </ion-list>
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="confirmSave()">
        <ion-icon :icon="saveOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { close, closeCircle, saveOutline } from "ionicons/icons";
import { useStore } from "vuex";
import { hasError } from "@/adapter";
import logger from "@/logger"
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";
import { DateTime } from "luxon";
import { showToast } from "@/utils";

export default defineComponent({
  name: "AddFacilityToGroupModal",
  components: {
    IonButtons,
    IonButton,
    IonCheckbox,
    IonChip,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSearchbar,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
      queryString: '',
      facilities: [] as any,
      selectedFacilities: [] as any,
      selectedFacilityValues: [] as any
    }
  },
  props: ['facilityGroupId'],
  mounted() {
    Promise.all([this.fetchFacilities(), this.fetchAssociatedFacilities()])
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async fetchFacilities() {
      this.facilities = []
      let filters = {} as any;

      if(this.queryString) {
        filters["facilityId_value"] = this.queryString
        filters["facilityId_op"] = "contains"
        filters["facilityId_ic"] = "Y"
        filters["facilityId_grp"] = "1"
        filters["facilityName_value"] = this.queryString
        filters["facilityName_op"] = "contains"
        filters["facilityName_ic"] = "Y"
        filters["facilityName_grp"] = "1"
        filters["grp_op_1"] = "OR"
      }

      const params = {
        "inputFields": {
          ...filters
        },
        "entityName": "FacilityView",
        "noConditionFind": "Y",
        "distinct": "Y",
        "fromDateName": "facilityGroupFromDate",
        "thruDateName": "facilityGroupThruDate",
        "filterByDate": "Y",
        "fieldList": ["facilityId", "facilityName", "fromDate"],
        // By default we show only 20 facilities, others get rendered on search query.
        "viewSize": 20
      }

      try {
        const resp = await FacilityService.fetchFacilities(params)

        if (!hasError(resp) && resp.data.count) {
          this.facilities = resp.data.docs
        } else {
          throw resp.data
        }
      } catch (error) {
        logger.error(error)
      }
    },
    async fetchAssociatedFacilities() {
      try {
        const resp = await FacilityService.fetchAssociatedFacilitiesToGroup({
          "inputFields": {
            "facilityGroupId": this.facilityGroupId
          },
          "viewSize": 250, // maximum view size
          "entityName": 'FacilityGroupAndMember',
          "noConditionFind": "Y",
          "filterByDate": 'Y',
          "fieldList": ['facilityId', 'fromDate']
        })

        if(!hasError(resp)) {
          this.selectedFacilities = resp.data.docs
          this.selectedFacilityValues = JSON.parse(JSON.stringify(resp.data.docs))
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
    },
    updateSelectedFacilities(id: string) {
      const facility = this.isFacilitySelected(id)

      if (facility) {
        // if facility is already selected then removing that facility from the list on click
        this.selectedFacilityValues = this.selectedFacilityValues.filter((facility: any) => facility.facilityId !== id)
      } else {
        this.selectedFacilityValues.push(this.facilities.find((facility: any) => facility.facilityId == id))
      }
    },
    isFacilitySelected(facilityId: any) {
      return this.selectedFacilityValues.some((facility: any) => facility.facilityId === facilityId)
    },
    async confirmSave() {
      const facilitiesToAdd = this.selectedFacilityValues.filter((selectedFacility: any) => !this.selectedFacilities.some((facility: any) => facility.facilityId === selectedFacility.facilityId))
      const facilitiesToRemove = this.selectedFacilities.filter((facility: any) => !this.selectedFacilityValues.some((selectedFacility: any) => facility.facilityId === selectedFacility.facilityId))

      const removeResponses = await Promise.allSettled(facilitiesToRemove
        .map(async (facility: any) => await FacilityService.updateProductStoreToFacilityGroup({
          "facilityId": facility.facilityId,
          "facilityGroupId": this.facilityGroupId,
          "fromDate": facility.fromDate,
          "thruDate": DateTime.now().toMillis()
        }))
      )

      const addResponses = await Promise.allSettled(facilitiesToAdd
        .map(async (facility: any) => await FacilityService.addProductStoreToFacilityGroup({
          "facilityId": facility.facilityId,
          "facilityGroupId": this.facilityGroupId
        }))
      )

      const hasFailedResponse = [...removeResponses, ...addResponses].some((response: any) => response.status === 'rejected')
      if (hasFailedResponse) {
        showToast(translate("Failed to associate some facilites to group."))
      } else {
        showToast(translate("Facilities associated to group successfully."))
      }
      this.fetchGroups()
      modalController.dismiss()
    },
    async fetchGroups(vSize?: any, vIndex?: any) {
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex
      };
      await this.store.dispatch('facility/fetchFacilityGroups', payload)
    },
  },
  setup() {
    const store = useStore();
    return {
      close,
      saveOutline,
      closeCircle,
      store,
      translate
    };
  }
});
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>