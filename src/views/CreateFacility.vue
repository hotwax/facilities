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
            <ion-item>
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
              <ion-input @ionBlur="setFacilityId($event)" v-model="formData.facilityName" />
            </ion-item>
            <ion-item ref="facilityId">
              <ion-label position="floating">
                {{ translate('Internal ID') }}
              </ion-label>
              <ion-input v-model="formData.facilityId" @ionChange="validateFacilityId" @ionBlur="markFacilityIdTouched" />
              <ion-note slot="error">
                {{ translate('Internal ID cannot be more than 20 characters.') }}
              </ion-note>
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('External ID') }}
              </ion-label>
              <ion-input v-model="formData.externalId" />
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
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
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
import logger from "@/logger";

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
    IonNote,
    IonPage,
    IonSelect,
    IonSelectOption,
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
      this.store.dispatch('facility/updateCurrentFacility', {}),
      this.store.dispatch('util/fetchFacilityTypes', {
        parentTypeId: 'VIRTUAL_FACILITY',
        parentTypeId_op: 'notEqual',
        facilityTypeId: 'VIRTUAL_FACILITY',
        facilityTypeId_op: 'notEqual'
      })
    ])
    this.facilityTypesByParentTypeId = this.getFacilityTypesByParentTypeId(this.$route.query.type as string)

    // In accordance with the specified requirements, it is essential to treat RETAIL STORE and WAREHOUSE
    // as default elements within the list. These elements may appear at any index within the list structure.
    // Hence to meet requirement we explicitly handling the default nature of RETAIL STORE and WAREHOUSE.
    this.selectedFacilityTypeId = this.facilityTypesByParentTypeId['RETAIL_STORE'] ? 'RETAIL_STORE' : this.facilityTypesByParentTypeId['WAREHOUSE'] ? 'WAREHOUSE' : Object.keys(this.facilityTypesByParentTypeId)[0]
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
      if (!this.formData.facilityName?.trim()) {
        showToast(translate('Facility name is required.'))
        return
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
          facilityTypeId: this.selectedFacilityTypeId,
          ownerPartyId: "COMPANY"
        }

        const resp = await FacilityService.createFacility(payload);
        if (!hasError(resp)) {
          const { facilityId } = resp.data
          showToast(translate("Facility created successfully."))
          this.router.replace(`/add-facility-address/${facilityId}`)
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error)
        showToast(translate('Failed to create facility.'))
      }

      // creating default facility location
      await FacilityService.createFacilityLocation({
        facilityId: this.formData.facilityId,
        locationTypeEnumId: "FLT_PICKLOC",
        areaId: "TL",
        aisleId: "TL",
        sectionId: "TL",
        levelId: "LL",
        positionId: "01",
      })
    },
    getFacilityTypesByParentTypeId(parentTypeId: string) {
      return parentTypeId ? Object.keys(this.facilityTypes).reduce((facilityTypesByParentTypeId: any, facilityTypeId: string) => {
        if (this.facilityTypes[facilityTypeId].parentTypeId === parentTypeId) {
          facilityTypesByParentTypeId[facilityTypeId] = this.facilityTypes[facilityTypeId]
        }
        return facilityTypesByParentTypeId
      }, {}) : this.facilityTypes
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