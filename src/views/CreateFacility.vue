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
        <div v-if="$route.query.type === 'WAREHOUSE' || $route.query.type === 'RETAIL_STORE'">
          <ion-card>
            <ion-card-header>
              <ion-card-title>{{ translate('Setup Store') }}</ion-card-title>
            </ion-card-header>
            <ion-list>
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
        </div>
        <div v-else class="ion-margin ion-text-center">
          {{ translate('Facility type not found.') }}
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
  data() {
    return {
      formData: {
        facilityName: '',
        facilityId: '',
        externalId: '',
      }
    }
  },
  ionViewWillEnter() {
    this.clearFormData()
    this.store.dispatch('facility/updateCreatedFacility', {})
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
          facilityTypeId: this.$route.query.type,
          ownerPartyId: "COMPANY"
        }

        const resp = await FacilityService.createFacility(payload);
        if (!hasError(resp)) {
          const { facilityId } = resp.data
          this.store.dispatch('facility/updateCreatedFacility', {
            facilityId,
            facilityName: this.formData.facilityName,
            facilityTypeId: this.$route.query.type,
          })
          this.router.replace(`/add-facility-address/${facilityId}`)
        } else {
          throw resp.data;
        }
      } catch (error) {
        console.error(error)
        showToast(translate('Failed to create facility.'))
      }
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