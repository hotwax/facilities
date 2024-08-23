<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/find-groups" slot="start" />
        <ion-title>{{ translate("New group") }}</ion-title>
      </ion-toolbar>
    </ion-header>
  
    <ion-content>
      <main>
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate('Create a new group') }}</ion-card-title>
          </ion-card-header>
          <form @keyup.enter="createFacilityGroup">
            <ion-list>
              <ion-item>
                <ion-input label-placement="floating" @ionBlur="setFacilityGroupId($event)" v-model="formData.facilityGroupName">
                  <div slot="label">{{ translate("Name") }} <ion-text color="danger">*</ion-text></div>
                </ion-input>
              </ion-item>
              <ion-item lines="none">
                <ion-input label-placement="floating" :label="translate('Internal ID')" ref="facilityGroupId" v-model="formData.facilityGroupId" @ionInput="validateFacilityGroupId" @ionBlur="markFacilityGroupIdTouched" :error-text="translate('Internal ID cannot be more than 20 characters.')" />
              </ion-item>
              <ion-item>
                <ion-select :label="translate('Group type')" :disabled="isFacilityGroupTypeDisabled" :placeholder="translate('Select')" interface="popover" v-model="formData.facilityGroupTypeId">
                  <ion-select-option :value="facilityGroupType.facilityGroupTypeId" :key="facilityGroupType.facilityGroupTypeId" v-for="facilityGroupType in facilityGroupTypes">
                    {{  facilityGroupType.description ?  facilityGroupType.description : facilityGroupType.facilityGroupTypeId }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-select v-if="productStores.length" :label="translate('Product store')" :placeholder="translate('Select')" :selectedText="selectedProductStoreIds.length > 1 ? translate('product stores', { count: selectedProductStoreIds.length }) : selectedProductStoreIds.map[0]" :value="selectedProductStoreIds" @ionChange="updateFacilityGroupProductStores($event)" :multiple="true">
                  <ion-select-option :value="productStore.productStoreId" :key="productStore.productStoreId" v-for="productStore in productStores">
                    {{ productStore.storeName ? productStore.storeName : productStore.productStoreId }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item lines="none">
                <ion-textarea :label="translate('Description')" label-placement="floating"
                  :placeholder="translate('group description')"
                  :auto-grow="true"
                  :counter="true" 
                  :maxlength="255"
                  v-model="formData.description"
                >
                </ion-textarea>
              </ion-item>
            </ion-list>
          </form>
        </ion-card>
        <div class="ion-text-center ion-margin">
          <ion-button @click="createFacilityGroup()" @keyup.enter.stop>
            {{ translate("Create group") }}
            <ion-icon slot="end" :icon="arrowForwardOutline"/>
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
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  alertController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { arrowForwardOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";
import { mapGetters, useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { hasError } from "@/adapter";
import { generateInternalId, showToast } from "@/utils";
import logger from "@/logger";
import { DateTime } from "luxon";

export default defineComponent({
  name: "CreateFacilityGroup",
  components: {
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
    IonList,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTextarea,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      facilityGroupTypes: 'util/getFacilityGroupTypes',
      productStores: 'util/getProductStores',
    })
  },
  data() {
    return {
      formData: {
        facilityGroupId: '',
        facilityGroupName: '',
        facilityGroupTypeId: '',
        description: '',
      },
      isFacilityGroupTypeDisabled: false,
      selectedProductStoreIds: []
    }
  },
  props: ['selectedFacilityGroupTypeId'],
  async mounted() {
    await Promise.all([this.store.dispatch('util/fetchProductStores'), this.store.dispatch('util/fetchFacilityGroupTypes')])
    if (this.selectedFacilityGroupTypeId) {
      this.formData.facilityGroupTypeId = this.selectedFacilityGroupTypeId
      this.isFacilityGroupTypeDisabled = true
    }
  },
  methods: {
    updateFacilityGroupProductStores(event: any) {
      const selectedProductStoreIds = event.detail.value;
      this.selectedProductStoreIds = selectedProductStoreIds
    },
    setFacilityGroupId(event: any) {
      this.formData.facilityGroupId = generateInternalId(event.target.value)
    },
    async createFacilityGroup() {
      if (!this.formData.facilityGroupName?.trim()) {
        showToast(translate('Please fill all the required fields'))
        return;
      }

      if (this.formData.facilityGroupId.length > 20) {
        showToast(translate('Internal ID cannot be more than 20 characters.'))
        return
      }

      // In case the user does not lose focus from the facility name input
      // and click on create the button, we need to set the internal id manually
      if (!this.formData.facilityGroupId) {
        this.formData.facilityGroupId = generateInternalId(this.formData.facilityGroupName)
      }

      try {
        const payload = {
          ...this.formData,
        }

        const resp = await FacilityService.createFacilityGroup(payload);
        if (!hasError(resp)) {
          const facilityGroupId = resp.data.facilityGroupId
          if (this.selectedProductStoreIds.length > 0) {
            await this.associateFacilityGroupToStore(facilityGroupId, this.selectedProductStoreIds);
          }
          await this.manageFacilityAlert(facilityGroupId)
        } else {
          throw resp.data;
        }
      } catch (error) {
        logger.error(error)
        showToast(translate('Failed to create facility group.'))
      }
    },
    async associateFacilityGroupToStore(facilityGroupId: string, productStoreIds: string[]) {
      try {
        const responses = await Promise.allSettled(productStoreIds
          .map(async (productStoreId: any) => await FacilityService.createProductStoreFacilityGroup({
            "productStoreId": productStoreId,
            "facilityGroupId": facilityGroupId,
            "fromDate": DateTime.now().toMillis()
          }))
        )
        const hasFailedResponse = responses.some((response: any) => response.status === 'rejected')
        if (hasFailedResponse) {
          console.log("Error in associating group to some of the product stores")
        }
      } catch (error) {
        logger.error(error)
      }
    },
    async manageFacilityAlert(facilityGroupId: string) {
      const message = 'Creating group without facilities is essentially empty. Would you prefer to associate facilities during group creation or allow for later addition?'
      const alert = await alertController.create({
        header: translate('Add facilities'),
        message: translate(message),
        backdropDismiss: false,
        buttons: [
          {
            text: translate("Skip"),
            handler: async (data: any) => {
              this.router.replace({ path: `/tabs/find-groups`})
            }
          },
          {
            text: translate("Add"),
            handler: async (data: any) => {
              this.router.replace({ path: `/manage-facilities/${facilityGroupId}`})
            }
          }
        ],
      });
      return alert.present();
    },
    validateFacilityGroupId(event: any) {
      const value = event.target.value;
      (this as any).$refs.facilityGroupId.$el.classList.remove('ion-valid');
      (this as any).$refs.facilityGroupId.$el.classList.remove('ion-invalid');

      if (value === '') return;

      this.formData.facilityGroupId.length <= 20
        ? (this as any).$refs.facilityGroupId.$el.classList.add('ion-valid')
        : (this as any).$refs.facilityGroupId.$el.classList.add('ion-invalid');
    },
    markFacilityGroupIdTouched() {
      (this as any).$refs.facilityGroupId.$el.classList.add('ion-touched');
    },
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    return {
      arrowForwardOutline,
      router,
      store,
      translate
    };
  },
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
