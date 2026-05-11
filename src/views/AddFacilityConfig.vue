<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/find-facilities" slot="start" />
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
                  <h2>{{ getProductStore(store.productStoreId)?.storeName || store.productStoreId }}</h2>
                </ion-label>
                <ion-badge v-if="store.productStoreId === primaryFacilityGroupId">
                  {{ translate("primary store") }}
                </ion-badge>
                <ion-button id="product-store-actions-trigger" size="default" slot="end" fill="clear" color="medium">
                  <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                </ion-button>
                <ion-popover trigger="product-store-actions-trigger" :show-backdrop="false" :dismiss-on-select="true">
                  <ion-content>
                    <ion-list>
                      <ion-list-header>{{ getProductStore(store.productStoreId).storeName || store.productStoreId }}</ion-list-header>
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
              <ion-toggle v-model="fulfillmentSettings.FAC_GRP">{{ translate("Sell Inventory Online") }}</ion-toggle>
            </ion-item>
            <ion-item>
              <ion-toggle v-model="fulfillmentSettings.PICKUP">{{ translate("Allow pickup") }}</ion-toggle>
            </ion-item>
            <ion-item>
              <ion-toggle v-model="fulfillmentSettings.OMS_FULFILLMENT" @ionChange="createLoginCreds = fulfillmentSettings.OMS_FULFILLMENT">{{ translate("Uses native fulfillment app") }}</ion-toggle>
            </ion-item>
            <template v-if="fulfillmentSettings.OMS_FULFILLMENT">
              <ion-item>
                <ion-toggle v-model="createLoginCreds">{{ translate("Create login credentials") }}</ion-toggle>
              </ion-item>
              <template v-if="createLoginCreds">
                <ion-item>
                  <ion-input label-placement="floating" v-model="username">
                    <div slot="label">{{ translate('Username') }} <ion-text color="danger">*</ion-text></div>
                  </ion-input>
                </ion-item>
                <ion-item lines="none">
                  <ion-input label-placement="floating" v-model="password" ref="passwordInput" @keyup="validatePassword" @ionBlur="markPasswordTouched" type="password" :helper-text="translate('Password should be at least 5 characters long, it contains at least one number, one alphabet and one special character.')">
                    <div slot="label">{{ translate('Password') }} <ion-text color="danger">*</ion-text></div>
                  </ion-input>
                </ion-item>
                <ion-item>
                  <ion-input label-placement="floating" v-model="emailAddress">
                    <div slot="label">{{ translate('Reset password email') }} <ion-text color="danger">*</ion-text></div>
                  </ion-input>
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

<script setup lang="ts">
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
  IonPage,
  IonPopover,
  IonText,
  IonTitle,
  IonToolbar,
  IonToggle,
  modalController,
  onIonViewWillEnter
} from "@ionic/vue";
import { ref, computed, reactive } from "vue";
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
import { isValidPassword, isValidEmail, showToast } from "@/utils";
import { hasError } from "@/adapter";
import logger from "@/logger";
import { FacilityService } from "@/services/FacilityService";
import { UserService } from "@/services/UserService"
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue';
import { DateTime } from "luxon";
import { useFacilityStore } from '@/store/facility';
import { useUtilStore } from '@/store/util';

const props = defineProps(['facilityId']);
const router = useRouter();
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const fulfillmentSettings = reactive({
  PICKUP: false,
  FAC_GRP: false,
  OMS_FULFILLMENT: false
});
const createLoginCreds = ref(false);
const password = ref('');
const username = ref('');
const emailAddress = ref('');
const selectedProductStores = ref([] as any);
const primaryFacilityGroupId = ref('');
const passwordInput = ref(null as any);

const current = computed(() => facilityStore.getCurrent);
const getProductStore = computed(() => (id: string) => utilStore.getProductStore(id));

onIonViewWillEnter(async () => {
  await facilityStore.fetchCurrentFacility({ facilityId: props.facilityId });
  await utilStore.fetchProductStores();
  username.value = current.value.facilityId;
});

async function saveFulfillmentSettings() {
  const promises = [];
  if (fulfillmentSettings.PICKUP) {
    promises.push(FacilityService.addFacilityToGroup({
      "facilityId": props.facilityId,
      "facilityGroupId": 'PICKUP'
    }));
  }

  if (fulfillmentSettings.FAC_GRP) {
    promises.push(FacilityService.addFacilityToGroup({
      "facilityId": props.facilityId,
      "facilityGroupId": 'FAC_GRP'
    }));
  }

  if (fulfillmentSettings.OMS_FULFILLMENT) {
    promises.push(FacilityService.addFacilityToGroup({
      "facilityId": props.facilityId,
      "facilityGroupId": 'OMS_FULFILLMENT'
    }));
  }

  const results = await Promise.all(promises);
  const hasFailed = results.some((response: any) => hasError(response));
  if (hasFailed) {
    throw { message: translate('Failed to update some fulfillment settings.') };
  }
}

async function createFacilityLogin() {
  try {
    const payload = {
      "facilityId": props.facilityId,
      "facilityName": current.value.facilityName,
      "username": username.value,
      "password": password.value,
      "emailAddress": emailAddress.value
    };

    await FacilityService.createFacilityLogin(payload);
  } catch (error) {
    throw error;
  }
}

async function saveStoreConfig() {
  if (createLoginCreds.value) {
    if (!username.value || !password.value || !emailAddress.value) {
      showToast(translate('Please fill all the required fields'));
      return;
    }
    if (username.value && await UserService.isUserLoginIdExists(username.value)) {
      showToast(translate('Could not create login user: user with ID already exists.', { userLoginId: username.value }));
      return;
    }
    if (!isValidEmail(emailAddress.value)) {
      showToast(translate('Please provide a valid email.'));
      return;
    }
  }

  try {
    if (Object.values(fulfillmentSettings).includes(true)) {
      await saveFulfillmentSettings();
    }

    if (createLoginCreds.value) {
      await createFacilityLogin();
    }

    if (selectedProductStores.value.length > 0) {
      await addProductStoresToFacility();
      if (primaryFacilityGroupId.value) {
        const shopifyShopId = await utilStore.fetchShopifyShopForProductStores([primaryFacilityGroupId.value]);
        await makeProductStorePrimary(shopifyShopId);
      }
    }

    showToast(translate("Facility configurations created successfully."));
    router.replace({ path: `/facility-details/${props.facilityId}` });
  } catch (error: any) {
    showToast(error.message);
    logger.error(error.message);
  }
}

async function addProductStoresToFacility() {
  const promises = selectedProductStores.value.map((payload: any) => 
    FacilityService.createProductStoreFacility({
      productStoreId: payload.productStoreId,
      facilityId: props.facilityId,
      fromDate: DateTime.now().toMillis(),
    })
  );

  const results = await Promise.all(promises);
  const hasFailed = results.some((response: any) => hasError(response));
  if (hasFailed) {
    throw { message: translate('Failed to add some product stores to the facility.') };
  }
}

async function fetchFacilityGroup(shopifyShopId: string) {
  let facilityGroupId;
  try {
    const resp = await FacilityService.fetchFacilityGroup({
      inputFields: {
        facilityGroupId: shopifyShopId
      },
      entityName: 'FacilityGroup',
      fieldList: ['facilityGroupId', 'facilityGroupTypeId'],
      viewSize: 100
    });
    if (!hasError(resp) && resp.data.docs.length > 0) {
      facilityGroupId = resp.data.docs[0].facilityGroupId;
    }
  } catch (err) {
    logger.error(err);
  }
  return facilityGroupId;
}

async function makeProductStorePrimary(shopifyShopId: string) {
  try {
    let facilityGroupId = await fetchFacilityGroup(shopifyShopId);

    if (!facilityGroupId) {
      const resp = await FacilityService.createFacilityGroup({
        facilityGroupTypeId: 'FEATURING',
        facilityGroupName: utilStore.getProductStore(primaryFacilityGroupId.value).storeName,
        facilityGroupId: shopifyShopId
      });

      if (!hasError(resp)) {
        facilityGroupId = resp.data.facilityGroupId;
      }
    }

    if (facilityGroupId) {
      const resp = await FacilityService.updateFacility({
        facilityId: props.facilityId,
        primaryFacilityGroupId: facilityGroupId
      });
      if (hasError(resp)) {
        throw { message: translate('Failed to make product store as primary.') };
      }
    } else {
      throw { message: translate('Failed to make product store as primary.') };
    }
  } catch (err) {
    throw err;
  }
}

async function selectProductStore() {
  const modal = await modalController.create({
    component: SelectProductStoreModal,
    componentProps: {
      selectedProductStores: selectedProductStores.value
    }
  });

  modal.onDidDismiss().then((result: any) => {
    if (result.data && result.data.value) {
      selectedProductStores.value = result.data.value.selectedProductStores;
    }
  });

  modal.present();
}

function removeProductStore(productStoreId: string) {
  selectedProductStores.value = selectedProductStores.value.filter((store: any) => store.productStoreId !== productStoreId);
}

function updatePrimaryFacilityGroupId(productStoreId: string) {
  primaryFacilityGroupId.value = productStoreId === primaryFacilityGroupId.value ? '' : productStoreId;
}

function validatePassword(event: any) {
  const value = event.target.value;
  if (!passwordInput.value) return;

  const el = passwordInput.value.$el;
  el.classList.remove('ion-valid');
  el.classList.remove('ion-invalid');

  if (value === '') return;

  isValidPassword(value)
    ? el.classList.add('ion-valid')
    : el.classList.add('ion-invalid');
}

function markPasswordTouched() {
  if (passwordInput.value) {
    passwordInput.value.$el.classList.add('ion-touched');
  }
}
</script>

<style scoped>
ion-card-header {
  display: flex;
  flex-direction: row;
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