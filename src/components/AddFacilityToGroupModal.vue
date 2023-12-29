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
      {{ translate("Count:") }} {{ associatedFacilityIdValues.length }}
    </ion-chip>

    <ion-list>
      <ion-list-header>{{ translate("Staff") }}</ion-list-header>
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
  IonButtons,
  IonButton,
  IonCheckbox,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonFab,
  IonFabButton,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonItem,
  IonList,
  IonListHeader,
  IonSearchbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { close, closeCircle, saveOutline } from "ionicons/icons";
import { useStore } from "vuex";
import { hasError } from "@/adapter";
import logger from "@/logger"
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";

export default defineComponent({
  name: "EditPickersModal",
  components: {
    IonButtons,
    IonButton,
    IonCheckbox,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonFab,
    IonFabButton,
    IonTitle,
    IonToolbar,
    IonLabel,
    IonItem,
    IonList,
    IonListHeader,
    IonSearchbar,
  },
  data() {
    return {
      queryString: '',
      facilities: [] as any,
      associatedFacilityIds: [],
      associatedFacilityIdValues: [] as any
    }
  },
  props: ['group'],
  mounted() {
    Promise.all([this.fetchFacilities(), this.fetchAssociatedFacilities()])
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async fetchFacilities() {
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
          "grp_op": "AND",
          ...filters
        },
        "entityName": "FacilityView",
        "noConditionFind": "Y",
        "distinct": "Y",
        "fromDateName": "facilityGroupFromDate",
        "thruDateName": "facilityGroupThruDate",
        "filterByDate": "Y",
        "fieldList": ["facilityId", "facilityName", "facilityTypeId", "maximumOrderLimit", "defaultDaysToShip", "externalId", "primaryFacilityGroupId", "parentFacilityTypeId"],
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
      let associatedFacilityIds = [] as any

      try {
        const resp = await FacilityService.fetchAssociatedFacilitiesToGroup({
          inputFields: {
            facilityGroupId: this.group.facilityGroupId
          },
          viewSize: 250, // maximum view size
          entityName: 'FacilityGroupAndMember',
          noConditionFind: "Y",
          filterByDate: 'Y',
          fieldList: ['facilityId']
        })

        if(!hasError(resp)) {
          resp.data.docs.map((facility: any) => associatedFacilityIds.push(facility.facilityId))
          this.associatedFacilityIds = associatedFacilityIds
          this.associatedFacilityIdValues = JSON.parse(JSON.stringify(associatedFacilityIds))
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
        this.associatedFacilityIdValues.pop(id)
      } else {
        this.associatedFacilityIdValues.push(id)
      }
    },
    isFacilitySelected(facilityId: any) {
      return this.associatedFacilityIdValues.includes(facilityId)
    },
    confirmSave() {
      console.log('save');
      const facilitiesToRemove = this.associatedFacilityIds.filter((facilityId: string) => !this.associatedFacilityIdValues.includes(facilityId))
      const facilitiesToAdd = this.associatedFacilityIdValues.filter((facilityId: string) => !this.associatedFacilityIds.includes(facilityId))
      console.log('remove', facilitiesToRemove)
      console.log('add', facilitiesToAdd)
      
    }
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