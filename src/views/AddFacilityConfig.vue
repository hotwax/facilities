<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/find-facilities" slot="start" />
        <ion-title>{{ translate("Add Store Configuration") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main>
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              {{ translate("Product Stores") }}
            </ion-card-title>
            <ion-button v-if="selectedProductStores.length" @click="selectProductStore()" fill="clear">
              <ion-icon :icon="addCircleOutline" slot="start" />
              {{ translate("Add") }}
            </ion-button>
          </ion-card-header>
          <template v-if="selectedProductStores.length">
            <ion-list>
              <ion-item v-for="store in selectedProductStores" :key="store.productStoreId">
                <ion-label>
                  <h2>{{ getProductStore(store.productStoreId)?.storeName }}</h2>
                </ion-label>
                <ion-badge v-if="store.productStoreId === primaryFacilityGroupId">
                  {{ translate("primary store") }}
                </ion-badge>
                <!-- TODO add logic for make primary -->
                <ion-button id="product-store-actions-trigger" slot="end" fill="clear" color="medium">
                  <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                </ion-button>
                <!-- inline popover as ProductStorePopover logic is complex and different from the use case here -->
                <ion-popover trigger="product-store-actions-trigger" showBackdrop="false" dismissOnSelect="true">
                  <ion-content>
                    <ion-list>
                      <ion-list-header>{{ getProductStore(store.productStoreId).storeName }}</ion-list-header>
                      <ion-item button @click="updatePrimaryFacilityGroupId(store.productStoreId)">
                        {{ translate("Primary") }}
                        <ion-icon slot="end" :color="store.productStoreId === primaryFacilityGroupId ? 'warning' : ''" :icon="store.productStoreId === primaryFacilityGroupId ? star : starOutline" />
                      </ion-item>
                      <ion-item button lines="none" @click="removeProductStore(store.productStoreId)">
                        {{ translate("Unlink") }}
                        <ion-icon slot="end" :icon="removeCircleOutline" />
                      </ion-item>
                    </ion-list>
                  </ion-content>
                </ion-popover>
              </ion-item>
            </ion-list>
          </template>
          <ion-button v-else expand="block" fill="outline" @click="selectProductStore()">
            {{ translate("Add") }}
            <ion-icon slot="end" :icon="addCircleOutline" />
          </ion-button>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>
              {{ translate("Fulfillment Settings") }}
            </ion-card-title>
          </ion-card-header>
          <ion-list>
            <ion-item>
              <ion-label>{{ translate("Sell Inventory Online") }}</ion-label>
              <ion-toggle v-model="fulfillmentSettings.FAC_GRP" slot="end"/>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Allow pickup") }}</ion-label>
              <ion-toggle v-model="fulfillmentSettings.PICKUP" slot="end"/>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Uses native fulfillment app") }}</ion-label>
              <ion-toggle v-model="fulfillmentSettings.OMS_FULFILLMENT" slot="end" @ionChange="createLoginCreds = true"/>
            </ion-item>
            <template v-if="fulfillmentSettings.OMS_FULFILLMENT">
              <ion-item>
                <ion-label>{{ translate("Create login credentials") }}</ion-label>
                <ion-toggle v-model="createLoginCreds" slot="end" />
              </ion-item>
              <template v-if="createLoginCreds">
                <ion-item>
                  <ion-label position="floating">
                    {{ translate('Username') }} <ion-text color="danger">*</ion-text>
                  </ion-label>
                  <ion-input v-model="username" />
                </ion-item>
                <ion-item ref="password">
                  <ion-label position="floating">
                    {{ translate('Password') }} <ion-text color="danger">*</ion-text>
                  </ion-label>
                  <ion-input v-model="password" @keyup="validatePassword" @ionBlur="markPasswordTouched" type="password"/>
                  <ion-note slot="helper">
                    {{ translate('Password should be at least 5 characters long, it contains at least one number, one alphabet and one special character.') }}
                  </ion-note>
                </ion-item>
              </template>
            </template>
          </ion-list>
        </ion-card>

        <div class="ion-text-center ion-margin">
          <ion-button @click="saveStoreConfig()">
            <ion-icon slot="start" :icon="locationOutline"/>
            {{ translate("Save configurations") }}
          </ion-button>
          <ion-button @click="router.replace(`/facility-details/${facilityId}`)" color="medium" fill="clear">
            {{ translate("Configure settings later") }}
          </ion-button>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBackButton,
  IonBadge,
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
  IonListHeader,
  IonNote,
  IonPage,
  IonPopover,
  IonText,
  IonTitle,
  IonToolbar,
  IonToggle,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { useRouter } from 'vue-router'
import {
  addCircleOutline,
  ellipsisVerticalOutline,
  locationOutline,
  removeCircleOutline,
  star,
  starOutline
} from 'ionicons/icons';
import { translate } from "@hotwax/dxp-components";
import { isValidPassword, showToast } from "@/utils";
import { hasError } from "@/adapter";
import logger from "@/logger";
import { FacilityService } from "@/services/FacilityService";
import { UserService } from "@/services/UserService"
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue';
import { DateTime } from "luxon";

export default defineComponent({
  name: "AddFacilityConfig",
  components: {
    IonBackButton,
    IonBadge,
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
    IonListHeader,
    IonNote,
    IonPage,
    IonPopover,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      current: 'facility/getCurrent',
      getProductStore: 'util/getProductStore',
    })
  },
  data() {
    return {
      fulfillmentSettings: {
        PICKUP: false,
        FAC_GRP: false,
        OMS_FULFILLMENT: false
      } as any,
      createLoginCreds: false as any,
      password: '',
      username: '',
      selectedProductStores: [] as any,
      primaryFacilityGroupId: ''  // storing productStoreId initially in this, as at this point we don't fetch shopifyShopId
    }
  },
  props: ['facilityId'],
  async ionViewWillEnter() {
    await this.store.dispatch('facility/fetchCurrentFacility', { facilityId: this.facilityId })
    await this.store.dispatch('util/fetchProductStores')
    this.username = this.current.facilityId
  },
  methods: {
    async saveFulfillmentSettings() {
      const responses = []
      if (this.fulfillmentSettings.PICKUP) {
        const resp = await FacilityService.addFacilityToGroup({
          "facilityId": this.facilityId,
          "facilityGroupId": 'PICKUP'
        })
        responses.push(resp)
      }

      if (this.fulfillmentSettings.FAC_GRP) {
        const resp = await FacilityService.addFacilityToGroup({
          "facilityId": this.facilityId,
          "facilityGroupId": 'FAC_GRP'
        })
        responses.push(resp)
      }

      if (this.fulfillmentSettings.OMS_FULFILLMENT) {
        const resp = await FacilityService.addFacilityToGroup({
          "facilityId": this.facilityId,
          "facilityGroupId": 'OMS_FULFILLMENT'
        })
        responses.push(resp)
      }

      const hasFailedResponse = responses.some((response: any) => hasError(response))
      if (hasFailedResponse) {
        throw { message: translate('Failed to update some fulfillment settings.') }
      }
    },
    async createFacilityLogin() {
      

      try {
        const payload = {
          "facilityId" : this.facilityId, 
          "facilityName": this.current.facilityName,
          "username": this.username,
          "password": this.password,
        }

        await FacilityService.createFacilityLogin(payload);
        return Promise.resolve()
      } catch (error) {
        return Promise.reject(error);
      }
    },
    async saveStoreConfig() {
      if (this.createLoginCreds) {
        if (!this.username) {
          showToast(translate('Username is required.'))
          return
        } else if (await UserService.isUserLoginIdExists(this.username)) {
          showToast(translate('Could not create login user: user with ID already exists.', { userLoginId: this.username }))
          return;
        }
        if (!this.password) {
          showToast(translate('Please provide a password.'))
          return
        }
      }

      try {
        if (Object.values(this.fulfillmentSettings).includes(true)) {
          await this.saveFulfillmentSettings()
        }

        if (this.createLoginCreds) {
          await this.createFacilityLogin()
        }

        if (this.selectedProductStores) {
          await this.addProductStoresToFacility()
          if (this.primaryFacilityGroupId) {
            const shopifyShopId = await this.store.dispatch('util/fetchShopifyShopForProductStores', [this.primaryFacilityGroupId])
            await this.makeProductStorePrimary(shopifyShopId)
          }
        }

        showToast(translate("Facility configurations created successfully."))
        this.$router.replace({ path: `/facility-details/${this.facilityId}` })
      } catch (error: any) {
        showToast(error.message)
        logger.error(error.message)
      }
    },
    async addProductStoresToFacility() {
      const responses = await Promise.allSettled(this.selectedProductStores
        .map(async (payload: any) => await FacilityService.createProductStoreFacility({
          productStoreId: payload.productStoreId,
          facilityId: this.facilityId,
          fromDate: DateTime.now().toMillis(),
        }))
      )

      const hasFailedResponse = responses.some((response: any) => response.status === 'rejected')
      if (hasFailedResponse) {
        throw { message: translate('Failed to add some product stores to the facility.') }
      }
    },
    async fetchFacilityGroup(shopifyShopId: string) {
      let facilityGroupId;
      try {
        const resp = await FacilityService.fetchFacilityGroup({
          inputFields: {
            facilityGroupId: shopifyShopId
          },
          entityName: 'FacilityGroup',
          fieldList: ['facilityGroupId', 'facilityGroupTypeId'],
          viewSize: 100
        })
        if (!hasError(resp)) {
          facilityGroupId = resp.data.docs[0].facilityGroupId
        } else {
          throw resp.data
        }
      } catch (err) {
        logger.error(err)
      }
      return facilityGroupId
    },
    async makeProductStorePrimary(shopifyShopId: string) {
      let resp;
      try {
        let facilityGroupId = await this.fetchFacilityGroup(shopifyShopId)

        if (!facilityGroupId) {
          resp = await FacilityService.createFacilityGroup({
            facilityGroupTypeId: 'FEATURING',
            facilityGroupName: this.getProductStore(this.primaryFacilityGroupId).storeName,
            facilityGroupId: shopifyShopId
          })

          if(!hasError(resp)) {
            facilityGroupId = resp.data.facilityGroupId
          }
        }

        if (facilityGroupId) {
          resp = await FacilityService.updateFacility({
            facilityId: this.facilityId,
            primaryFacilityGroupId: facilityGroupId
          })
          if (hasError(resp)) {
            throw { message: translate('Failed to make product store as primary.') }
          }
          return Promise.resolve(resp.data)
        } else {
          throw { message: translate('Failed to make product store as primary.') }
        }
      } catch (err) {
        return Promise.reject(err)
      }
    },
    async selectProductStore() {
      const selectProductStoreModal = await modalController.create({
        component: SelectProductStoreModal,
        componentProps: {
          selectedProductStores: this.selectedProductStores
        }
      })

      selectProductStoreModal.onDidDismiss().then(async(result: any) => {
        if (result.data && result.data.value) {
          this.selectedProductStores = result.data.value.selectedProductStores
        }
      })

      selectProductStoreModal.present()
    },
    removeProductStore(productStoreId: string) {
      this.selectedProductStores = this.selectedProductStores.filter((store: any) => store.productStoreId !== productStoreId)
    },
    updatePrimaryFacilityGroupId(productStoreId: string) {
      productStoreId === this.primaryFacilityGroupId ? (this.primaryFacilityGroupId = '') : (this.primaryFacilityGroupId = productStoreId)
    },
    validatePassword(event: any) {
      const value = event.target.value;
      (this as any).$refs.password.$el.classList.remove('ion-valid');
      (this as any).$refs.password.$el.classList.remove('ion-invalid');

      if (value === '') return;

      isValidPassword(value)
        ? (this as any).$refs.password.$el.classList.add('ion-valid')
        : (this as any).$refs.password.$el.classList.add('ion-invalid');
    },
    markPasswordTouched() {
      (this as any).$refs.password.$el.classList.add('ion-touched');
    },
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    return {
      addCircleOutline,
      ellipsisVerticalOutline,
      locationOutline,
      removeCircleOutline,
      router,
      star,
      starOutline,
      store,
      translate
    };
  }
});
</script>

<style scoped>
ion-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (min-width: 700px) {
  main {
    max-width: 375px;
    margin: auto;
  }
}
</style>