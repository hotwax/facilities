<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/find-facilities"/>
        <ion-title>{{ translate("Facility details") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main v-if="current?.facilityId">
        <ion-item lines="none" class="ion-margin-top">
          <ion-label>
            <h1>{{ current.facilityName }}</h1>
            <p>{{ current.facilityId }}</p>
          </ion-label>
        </ion-item>

        <section>
          <div>
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ translate("Address") }}
                </ion-card-title>
              </ion-card-header>
              <ion-item lines="full">
                <ion-label>
                  <h3>{{ "Address line 1" }}</h3>
                  <h3>{{ "Address line 2" }}</h3>
                  <p class="ion-text-wrap">{{ "City," }} {{ "Zipcode" }}</p>
                  <p class="ion-text-wrap">{{ "State," }} {{ "Country" }}</p>
                </ion-label>
              </ion-item>
              <ion-button fill="clear" @click="addAddress">{{ translate("Edit") }}</ion-button>
              <ion-button expand="block" fill="outline" @click="addAddress">
                {{ translate("Add") }}
                <ion-icon slot="end" :icon="addCircleOutline" />
              </ion-button>
            </ion-card>

            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ translate("Latitude & Longitude") }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                {{ translate("These values are used to help customers lookup how close they are to your stores when they are finding nearby stores.") }}
              </ion-card-content>
              <ion-item lines="full">
                <ion-label>{{ translate("Latitude") }}</ion-label>
                <p>{{ "<latitude>" }}</p>
              </ion-item>
              <ion-item lines="full">
                <ion-label>{{ translate("Longitude") }}</ion-label>
                <p>{{ "<longitude>" }}</p>
              </ion-item>
              <ion-button fill="clear" @click="addGeoPoint">{{ translate("Edit") }}</ion-button>
              <ion-button expand="block" fill="outline" @click="addGeoPoint">
                {{ translate("Add") }}
                <ion-icon slot="end" :icon="addCircleOutline" />
              </ion-button>
            </ion-card>
          </div>

          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate("Operating hours") }}
              </ion-card-title>
            </ion-card-header>
            <ion-list lines="none">
              <ion-item button @click="selectOperatingTime">
                <ion-label>
                  <p>{{ translate("Monday") }}</p>
                </ion-label>
                <ion-label slot="end">
                  {{ "7:30am - 8:00pm" }}
                </ion-label>
              </ion-item>
              <ion-item button @click="selectOperatingTime">
                <ion-label>
                  <p>{{ translate("Tuesday") }}</p>
                </ion-label>
                <ion-button fill="clear" color="medium">
                  <ion-icon :icon="addOutline" />
                  {{ translate("Add timings") }}
                </ion-button>
              </ion-item>
              <ion-item button @click="selectOperatingTime">
                <ion-label>
                  <p>{{ translate("Wednesday") }}</p>
                </ion-label>
                <ion-button fill="clear" color="medium">
                  <ion-icon :icon="addOutline" />
                  {{ translate("Add timings") }}
                </ion-button>
              </ion-item>
              <ion-item button @click="selectOperatingTime">
                <ion-label>
                  <p>{{ translate("Thursday") }}</p>
                </ion-label>
                <ion-button fill="clear" color="medium">
                  <ion-icon :icon="addOutline" />
                  {{ translate("Add timings") }}
                </ion-button>
              </ion-item>
              <ion-item button @click="selectOperatingTime">
                <ion-label>
                  <p>{{ translate("Friday") }}</p>
                </ion-label>
                <ion-button fill="clear" color="medium">
                  <ion-icon :icon="addOutline" />
                  {{ translate("Add timings") }}
                </ion-button>
              </ion-item>
              <ion-item button @click="selectOperatingTime">
                <ion-label>
                  <p>{{ translate("Saturday") }}</p>
                </ion-label>
                <ion-button fill="clear" color="medium">
                  <ion-icon :icon="addOutline" />
                  {{ translate("Add timings") }}
                </ion-button>
              </ion-item>
              <ion-item button @click="selectOperatingTime">
                <ion-label>
                  <p>{{ translate("Sunday") }}</p>
                </ion-label>
                <ion-button fill="clear" color="medium">
                  <ion-icon :icon="addOutline" />
                  {{ translate("Add timings") }}
                </ion-button>
              </ion-item>
            </ion-list>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate("Product Stores") }}
              </ion-card-title>
              <ion-button @click="selectProductStore" fill="clear">
                <ion-icon :icon="addCircleOutline" slot="start" />
                {{ translate("Add") }}
              </ion-button>
            </ion-card-header>

            <ion-item v-for="store in facilityProductStores" :key="store.productStoreId">
              <ion-label>
                <h2>{{ getStoreDetail(store.productStoreId).storeName }}</h2>
              </ion-label>
              <ion-badge>{{ translate("primary store") }}</ion-badge>
              <ion-button slot="end" fill="clear" color="medium" @click="productStorePopover($event, store)">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
            </ion-item>
          </ion-card>
        </section>

        <section>
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate("Fulfillment Settings") }}
              </ion-card-title>
            </ion-card-header>
            <ion-item>
              <ion-label>{{ translate("Sell Inventory Online") }}</ion-label>
              <ion-toggle :checked="true" slot="end" />
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Uses native fulfillment app") }}</ion-label>
              <ion-toggle :checked="true" slot="end" />
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Generate shipping labels") }}</ion-label>
              <ion-toggle :checked="true" slot="end" />
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Allow pickup") }}</ion-label>
              <ion-toggle :checked="true" slot="end" />
            </ion-item>
            <ion-item lines="full">
              <ion-label>{{ translate("Days to ship") }}</ion-label>
              <ion-input :value="current.defaultDaysToShip" type="number" min="0" placeholder="0"/>
            </ion-item>
            <ion-button fill="outline" expand="block">
              {{ translate("Update days to ship") }}
            </ion-button>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate("Online Order Fulfillment") }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              {{ translate("Configure the order fulfillment capacity of your facility.") }}
              <br/><br/>
              {{ translate("Setting fulfillment capacity to 0 disables new order from being allocated to this facility. Leave this empty if this facility's fulfillment capacity is unrestricted.") }}
            </ion-card-content>
            <ion-item lines="none">
              <ion-text>{{ 10 }}</ion-text>
              <ion-progress-bar class="ion-margin" :value="10/20"></ion-progress-bar>
              <ion-chip :outline="true">{{ 20 }}</ion-chip>
            </ion-item>
            <ion-item lines="none" class="ion-margin-horizontal" detail button>
              <ion-label>{{ translate("View order count history") }}</ion-label>
            </ion-item>
          </ion-card>
        </section>

        <div class="segments">
          <ion-segment scrollable v-model="segment">
            <ion-segment-button value="external-mappings" layout="icon-start">
              <ion-icon :icon="globeOutline" />
              <ion-label>{{ translate("External mappings") }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="staff" layout="icon-start">
              <ion-icon :icon="personOutline" />
              <ion-label>{{ translate("Staff") }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="locations" layout="icon-start">
              <ion-icon :icon="locationOutline" />
              <ion-label>{{ translate("Locations") }}</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div v-if="segment === 'external-mappings'">
            <ion-button fill="outline" @click="openExternalMappingPopover">
              <ion-icon :icon="addCircleOutline" slot="start" />
              {{ translate("Map facility to an external system") }}
            </ion-button>
            <div class="external-mappings">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    {{ translate("Shopify facility") }}
                  </ion-card-title>
                </ion-card-header>
                <ion-item lines="full">
                  <ion-label>
                    {{ "shop name" }}
                    <p>{{ "<Shop Id>" }}</p>
                  </ion-label>
                  <ion-note slot="end">{{"note"}}</ion-note>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>{{ "<shopify location id>" }}</ion-label>
                  <ion-note slot="end">{{"note"}}</ion-note>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>{{ "<admin link>" }}</ion-label>
                  <ion-button color="medium" fill="clear">
                    <ion-icon :icon="openOutline" />
                  </ion-button>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>{{ "<shopify link>" }}</ion-label>
                  <ion-button color="medium" fill="clear">
                    <ion-icon :icon="openOutline" />
                  </ion-button>
                </ion-item>
                <ion-button fill="clear">{{ translate("Edit") }}</ion-button>
                <ion-button fill="clear" color="danger">{{ translate("Remove") }}</ion-button>
              </ion-card>
            </div>          
            <hr />
          </div>

          <div v-else-if="segment === 'staff'">
            <ion-button fill="outline" @click="addStaffMemberModal">
              <ion-icon :icon="addCircleOutline" slot="start" />
              {{ translate("Add staff member to facility") }}
            </ion-button>

            <div class="list-item staff">
              <ion-item lines="none">
                <ion-icon :icon="personOutline" slot="start" />
                <ion-label>
                  {{ "party name" }}
                  <p>{{ translate("party id") }}</p>
                </ion-label>
              </ion-item>

              <ion-label class="tablet">
                <ion-chip outline>{{ "fulfillment" }}</ion-chip>
                <p>{{ translate("role") }}</p>
              </ion-label>

              <ion-label class="tablet">
                <ion-chip outline>{{ "3rd June 2023" }}</ion-chip>
                <p>{{ "added" }}</p>
              </ion-label>

              <ion-button fill="clear" color="medium">
                <ion-icon slot="icon-only" :icon="closeCircleOutline" />
              </ion-button>
            </div>
            <hr />
          </div>

          <div v-else-if="segment == 'locations'">
            <ion-button fill="outline" @click="addLocationModal">
              <ion-icon :icon="addCircleOutline" slot="start" />
              {{ translate("Add locations to facility") }}
            </ion-button>

            <div class="list-item">
              <ion-item lines="none">
                <ion-icon :icon="locationOutline" slot="start" />
                <ion-label>
                  {{ "locations id" }}
                  <p>{{ "pick/primary" }}</p>
                </ion-label>
              </ion-item>

              <ion-label class="tablet">
                AI
                <p>{{ translate("area") }}</p>
              </ion-label>

              <ion-label>
                AL
                <p>{{ translate("aisle") }}</p>
              </ion-label>

              <ion-label>
                SI
                <p>{{ translate("section") }}</p>
              </ion-label>

              <ion-label class="tablet">
                SI
                <p>{{ translate("level") }}</p>
              </ion-label>

              <ion-label>
                1
                <p>{{ translate("sequence") }}</p>
              </ion-label>
              
              <ion-button fill="clear" color="medium" @click="openLocationDetailsPopover">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
            </div>
            <hr />
          </div>
        </div>
      </main>
      <main v-else-if="!isLoading" class="ion-text-center ion-padding-top">
        {{ translate("Failed to fetch facility information") }}
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader, 
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  modalController,
  popoverController
} from '@ionic/vue'
import { 
  addCircleOutline,
  addOutline,
  closeCircleOutline,
  closeOutline,
  ellipsisVerticalOutline,
  globeOutline,
  locationOutline,
  openOutline,
  personOutline
} from 'ionicons/icons'
import { translate } from '@hotwax/dxp-components';
import AddExternalMappingPopover from '@/components/AddExternalMappingPopover.vue'
import LocationDetailsPopover from '@/components/LocationDetailsPopover.vue';
import ProductStorePopover from '@/components/ProductStorePopover.vue';
import AddAddressModal from '@/components/AddAddressModal.vue'
import AddGeoPointModal from '@/components/AddGeoPointModal.vue';
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue'
import SelectOperatingTimeModal from '@/components/SelectOperatingTimeModal.vue';
import AddLocationModal from '@/components/AddLocationModal.vue';
import AddStaffMemberModal from '@/components/AddStaffMemberModal.vue';
import { mapGetters, useStore } from 'vuex';
import { showToast } from '@/utils';
import { FacilityService } from '@/services/FacilityService';
import { DateTime } from 'luxon';

export default defineComponent({
  name: 'FacilityDetails',
  components: {
    IonBackButton,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonContent,
    IonHeader, 
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonProgressBar,
    IonSegment,
    IonSegmentButton,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  data() {
    return {
      isTimeModalOpen: false as boolean,
      isLoading: true, // shows whether the facility information fetching is completed or not
      segment: 'external-mappings'
    }
  },
  computed: {
    ...mapGetters({
      current: 'facility/getCurrent',
      facilityProductStores: 'facility/getFacilityProductStores',
      productStores: 'util/getProductStores'
    })
  },
  props: ["facilityId"],
  async ionViewWillEnter() {
    await this.store.dispatch('facility/fetchCurrentFacility', { facilityId: this.facilityId })
    await this.store.dispatch('util/fetchProductStores')
    await this.store.dispatch('facility/getFacilityProductStores', { facilityId: this.facilityId })
  },
  methods: {
    async productStorePopover(ev: Event, store: any) {
      const popover = await popoverController.create({
        component: ProductStorePopover,
        componentProps: {
          facilityId: this.facilityId,
          currentProductStore: store
        },
        event: ev,
        showBackdrop: false
      });
      return popover.present()
    },
    async addAddress() {
      const addAddressModal = await modalController.create({
        component: AddAddressModal
      })

      addAddressModal.present()
    },
    async addGeoPoint() {
      const addGeoPointModal = await modalController.create({
        component: AddGeoPointModal
      })

      addGeoPointModal.present()
    },
    async selectProductStore() {
      const selectProductStoreModal = await modalController.create({
        component: SelectProductStoreModal,
        componentProps: { selectedProductStores: this.facilityProductStores }
      })

      selectProductStoreModal.onDidDismiss().then(async (result) => {
        if (result.data && result.data.value) {
          const productStoresToCreate = result.data.value.productStoresToCreate
          const productStoresToRemove = result.data.value.productStoresToRemove

          const updateResponses = await Promise.allSettled(productStoresToRemove
            .map(async (payload: any) => await FacilityService.updateProductStoreFacility({
              facilityId: this.facilityId,
              fromDate: this.facilityProductStores.find((store: any) => payload.productStoreId === store.productStoreId).fromDate,
              productStoreId: payload.productStoreId,
              thruDate: DateTime.now().toMillis()
            }))
          )

          const createResponses = await Promise.allSettled(productStoresToCreate
            .map(async (payload: any) => await FacilityService.createProductStoreFacility({
              productStoreId: payload.productStoreId,
              facilityId: this.facilityId,
              fromDate: this.facilityProductStores.find((store: any) => payload.productStoreId === store.productStoreId).fromDate,
            }))
          )

          const hasFailedResponse = [...updateResponses, ...createResponses].some((response: any) => response.status === 'rejected')
          if (hasFailedResponse) {
            showToast(translate('Failed to update some facility stores'))
          } else {
            showToast(translate('Facility stores updated successfully.'))
          }

          // refetching product stores with updated roles
          await this.store.dispatch('facility/getFacilityProductStores', { facilityId: this.facilityId })
        }
      })

      selectProductStoreModal.present()
    },
    async addLocationModal() {
      const addLocationModal = await modalController.create({
        component: AddLocationModal
      })

      addLocationModal.present()
    },
    async addStaffMemberModal() {
      const addStaffModal = await modalController.create({
        component: AddStaffMemberModal
      })

      addStaffModal.present()
    },
    async selectOperatingTime() {
      const selectOperatingTimeModal = await modalController.create({
        component: SelectOperatingTimeModal
      })
  
      selectOperatingTimeModal.present()
    },
    async openLocationDetailsPopover(ev: Event) {
      const locationDetailsPopover = await popoverController.create({
        component: LocationDetailsPopover,
        event: ev,
        showBackdrop: false
      });
      return locationDetailsPopover.present()
    },
    async openExternalMappingPopover(ev: Event) {
      const externalMappingPopover = await popoverController.create({
        component: AddExternalMappingPopover,
        event: ev,
        showBackdrop: false
      });
      return externalMappingPopover.present()
    },
    getStoreDetail(productStoreId: any) {
      return this.productStores.find((store: any) => store.productStoreId === productStoreId)
    }
  },
  setup() {
    const store = useStore();

    return {
      addCircleOutline,
      addOutline,
      closeCircleOutline,
      closeOutline,
      ellipsisVerticalOutline,
      globeOutline,
      locationOutline,
      openOutline,
      personOutline,
      store,
      translate
    }
  }
});
</script>

<style scoped>

ion-content > main {
  margin: var(--spacer-lg)
}

section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: start;
}

ion-modal.date-time-modal {
  --width: 290px;
  --height: 440px;
  --border-radius: 8px;
}

ion-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}


/*Height of segment is defined now since their are less list items. Will remove it later */
.segments {
  height: 400px;
  margin-top: var(--spacer-2xl);
}

.segments > div {
  margin-top: var(--spacer-lg)
}

ion-segment {
  justify-content: start;
}

.staff {
  --columns-desktop: 5;
}

.external-mappings {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: start; 
}
</style>
