<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/find-facilities" slot="start" />
        <ion-title>{{ translate("Add Store") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main>
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate('Setup Store') }}</ion-card-title>
          </ion-card-header>
          <ion-list>
            <ion-item lines="none">
              <ion-label>{{ translate("Type") }}</ion-label>
              <ion-select interface="popover" :value="selectedFacilityTypeId">
                <ion-select-option :value="facilityTypeId" :key="facilityTypeId" v-for="(type, facilityTypeId) in facilityTypesByParentTypeId">
                  {{ type.description }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('Name') }} <ion-text color="danger">*</ion-text>
              </ion-label>
              <ion-input clear-input @ionBlur="setFacilityId($event)" v-model="formData.facilityName" />
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('Internal ID') }}
              </ion-label>
              <ion-input clear-input v-model="formData.facilityId" />
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('External ID') }}
              </ion-label>
              <ion-input clear-input v-model="formData.externalId" />
            </ion-item>
          </ion-list>
        </ion-card>

        <div class="ion-text-center ion-margin">
          <ion-button @click="createFacility()">
            <ion-icon slot="start" :icon="addOutline"/>
            {{ translate("Create store") }}
          </ion-button>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBackButton,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { useRouter } from 'vue-router'
import { addOutline } from 'ionicons/icons';
import { translate } from "@hotwax/dxp-components";
import { showToast } from "@/utils";
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";

export default defineComponent({
  name: "CreateFacility",
  components: {
    IonBackButton,
    IonButton,
    IonCard,
    IonCardTitle,
    IonCardHeader,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonText,
    IonTitle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      facilityTypes: "util/getFacilityTypes"
    })
  },
  data() {
    return {
      formData: {
        facilityName: '',
        facilityId: '',
        externalId: '',
      },
      selectedFacilityTypeId: '' as any,
      facilityTypesByParentTypeId: {} as any
    }
  },
  async ionViewWillEnter() {
    this.clearFormData()
    await Promise.all([
      this.store.dispatch('facility/updateCreatedFacility', {}),
      this.store.dispatch('util/fetchFacilityTypes', {
        parentTypeId: 'VIRTUAL_FACILITY',
        parentTypeId_op: 'notEqual',
        facilityTypeId: 'VIRTUAL_FACILITY',
        facilityTypeId_op: 'notEqual'
      })
    ])
    this.facilityTypesByParentTypeId = this.getFacilityTypesByParentTypeId(this.$route.query.type as string)
    this.selectedFacilityTypeId = Object.keys(this.facilityTypesByParentTypeId)[0]
  },
  methods: {
    clearFormData() {
      this.formData = {
        facilityName: '',
        facilityId: '',
        externalId: '',
      }
    },
    setFacilityId(event: any) {
      this.formData.facilityId = event.target.value.trimEnd().trimStart().toUpperCase().split(' ').join('_');
    },
    async createFacility() {
      if (!this.formData.facilityName) {
        showToast(translate('Facility name is required.'))
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
          facilityTypeId: this.selectedFacilityTypeId,
          ownerPartyId: "COMPANY"
        }

        const resp = await FacilityService.createFacility(payload);
        if (!hasError(resp)) {
          const { facilityId } = resp.data
          this.store.dispatch('facility/updateCreatedFacility', {
            facilityId,
            facilityName: this.formData.facilityName,
            facilityTypeId: this.selectedFacilityTypeId
          })
          this.router.replace(`/add-facility-address/${facilityId}`)
        } else {
          throw resp.data;
        }
      } catch (error) {
        console.error(error)
        showToast(translate('Failed to create facility.'))
      }
    },
    getFacilityTypesByParentTypeId(parentTypeId: string) {
      return parentTypeId ? Object.keys(this.facilityTypes).reduce((facilityTypesByParentTypeId: any, facilityTypeId: string) => {
        if (this.facilityTypes[facilityTypeId].parentTypeId === parentTypeId) {
          facilityTypesByParentTypeId[facilityTypeId] = this.facilityTypes[facilityTypeId]
        }
        return facilityTypesByParentTypeId
      }, {}) : this.facilityTypes
    }
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    return {
      addOutline,
      store,
      router,
      translate
    };
  }
});
</script>

<style scoped>
@media (min-width: 700px) {
  main {
    max-width: 375px;
    margin: auto;
  }
}
</style>