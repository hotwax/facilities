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
              <ion-button @click="addProductStore" fill="clear">
                <ion-icon :icon="addCircleOutline" slot="start" />
                {{ translate("Add") }}
              </ion-button>
            </ion-card-header>

            <ion-item>
              <ion-label>
                {{ "NotNaked" }}
              </ion-label>
              <ion-badge>{{ translate("primary store") }}</ion-badge>
              <ion-button color="medium" fill="clear" slot="end" @click="openStorePopover">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
            </ion-item>
            
            <ion-item>
              <ion-label>
                {{ "Wasatch Ski company" }}
              </ion-label>
              <ion-button color="medium" fill="clear" slot="end" @click="openStorePopover">
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
              <ion-toggle :checked="current.sellOnline" slot="end" @click="updateFulfillmentSetting($event, 'FAC_GRP')"/>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Uses native fulfillment app") }}</ion-label>
              <ion-toggle :checked="current.useOMSFulfillment" slot="end" @click="updateFulfillmentSetting($event, 'OMS_FULFILLMENT')"/>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Generate shipping labels") }}</ion-label>
              <ion-toggle :checked="current.generateShippingLabel" slot="end" @click="updateFulfillmentSetting($event, 'AUTO_SHIPPING_LABEL')"/>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Allow pickup") }}</ion-label>
              <ion-toggle :checked="current.allowPickup" slot="end" @click="updateFulfillmentSetting($event, 'PICKUP')"/>
            </ion-item>
            <ion-item lines="full">
              <ion-label>{{ translate("Days to ship") }}</ion-label>
              <ion-input v-model="defaultDaysToShip" type="number" min="0" :placeholder="translate('days to ship')"/>
            </ion-item>
            <ion-button fill="outline" expand="block" @click="updateDefaultDaysToShip">
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
            <ion-item lines="none" v-if="current.orderLimitType === 'custom'">
              <ion-text>{{ current.orderCount }}</ion-text>
              <ion-progress-bar class="ion-margin" :value="current.orderCount / current.maximumOrderLimit" />
              <ion-chip outline @click="changeOrderLimitPopover">{{ current.maximumOrderLimit }}</ion-chip>
            </ion-item>      
            <ion-item lines="none" v-else-if="current.orderLimitType === 'unlimited'">
              <ion-label>{{ translate("orders allocated today", { orderCount: current.orderCount }) }}</ion-label>
              <ion-chip outline @click="changeOrderLimitPopover">{{ translate("Unlimited") }}</ion-chip>
            </ion-item>      
            <ion-item lines="none" v-else>
              <ion-label>{{ translate("orders in fulfillment queue", { orderCount: current.orderCount }) }}</ion-label>
              <ion-chip outline @click="changeOrderLimitPopover" color="danger" fill="outline">{{ current.maximumOrderLimit }}</ion-chip>
            </ion-item>
            <ion-item lines="none" detail button @click="openFacilityOrderCountModal">
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

            <div class="list-item" v-for="location in current.locations" :key="location.locationSeqId">
              <ion-item lines="none">
                <ion-icon :icon="locationOutline" slot="start" />
                <ion-label>
                  {{ location.locationSeqId }}
                  <p>{{ locationTypes[location.locationTypeEnumId] }}</p>
                </ion-label>
              </ion-item>

              <ion-label class="tablet">
                {{ location.areaId }}
                <p>{{ translate("area") }}</p>
              </ion-label>

              <ion-label>
                {{ location.aisleId }}
                <p>{{ translate("aisle") }}</p>
              </ion-label>

              <ion-label>
                {{ location.sectionId }}
                <p>{{ translate("section") }}</p>
              </ion-label>

              <ion-label class="tablet">
                {{ location.levelId }}
                <p>{{ translate("level") }}</p>
              </ion-label>

              <ion-label>
                {{ location.positionId }}
                <p>{{ translate("sequence") }}</p>
              </ion-label>
              
              <ion-button fill="clear" color="medium" @click="openLocationDetailsPopover($event, location)">
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
import OpenStorePopover from '@/components/OpenStorePopover.vue';
import AddAddressModal from '@/components/AddAddressModal.vue'
import AddGeoPointModal from '@/components/AddGeoPointModal.vue';
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue'
import SelectOperatingTimeModal from '@/components/SelectOperatingTimeModal.vue';
import AddLocationModal from '@/components/AddLocationModal.vue';
import AddStaffMemberModal from '@/components/AddStaffMemberModal.vue';
import { mapGetters, useStore } from 'vuex';
import OrderLimitPopover from '@/components/OrderLimitPopover.vue'
import { FacilityService } from '@/services/FacilityService';
import { hasError } from '@/adapter';
import { showToast } from '@/utils';
import logger from '@/logger';
import ViewFacilityOrderCountModal from '@/components/ViewFacilityOrderCountModal.vue'
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
      segment: 'external-mappings',
      defaultDaysToShip: '' // not assinging 0 by default as it will convey the user that the facility can ship same day, but actually defaultDays are not setup on the facility
    }
  },
  computed: {
    ...mapGetters({
      current: 'facility/getCurrent',
      locationTypes: 'util/getLocationTypes'
    })
  },
  props: ["facilityId"],
  async ionViewWillEnter() {
    await this.store.dispatch('facility/fetchCurrentFacility', { facilityId: this.facilityId })
    await Promise.all([this.store.dispatch('facility/fetchFacilityLocations', { facilityId: this.facilityId }), this.store.dispatch('util/fetchLocationTypes')])
    this.defaultDaysToShip = this.current.defaultDaysToShip
    this.isLoading = false
  },
  methods: {
    async openStorePopover(ev: Event) {
      const popover = await popoverController.create({
        component: OpenStorePopover,
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
    async addProductStore() {
      const addProductStoreModal = await modalController.create({
        component: SelectProductStoreModal
      })

      addProductStoreModal.present()
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
    async openLocationDetailsPopover(ev: Event, location: any) {
      const locationDetailsPopover = await popoverController.create({
        component: LocationDetailsPopover,
        componentProps: { location },
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
    async changeOrderLimitPopover(ev: Event) {
      const popover = await popoverController.create({
        component: OrderLimitPopover,
        event: ev,
        showBackdrop: false,
        componentProps: { fulfillmentOrderLimit: this.current.maximumOrderLimit }
      });
      popover.present();

      const result = await popover.onDidDismiss();
      // Note: here result.data returns 0 in some cases that's why it is compared with 'undefined'.
      if(result.data != undefined && result.data !== this.current.maximumOrderLimit) {
        await this.updateFacility(result.data, this.current)
      }
    },
    async updateFacility(maximumOrderLimit: number | string, facility: any) {
      let resp;

      try {
        resp = await FacilityService.updateFacility({
          "facilityId": facility.facilityId,
          maximumOrderLimit
        })

        if(!hasError(resp)) {
          facility.maximumOrderLimit = maximumOrderLimit === "" ? null : maximumOrderLimit
          showToast(translate('Fulfillment capacity updated successfully for ', { facilityName: facility.facilityName }))
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to update fulfillment capacity for ', { facilityName: facility.facilityName }))
        logger.error('Failed to update facility', err)
      }
    },
    async openFacilityOrderCountModal() {
      const facilityOrderCountModal = await modalController.create({
        component: ViewFacilityOrderCountModal,
        componentProps: { facilityId: this.facilityId }
      })
  
      facilityOrderCountModal.present()
    },
    async addFacilityToGroup(facilityGroupId: string) {
      let resp;
      try {
        resp = await FacilityService.addFacilityToGroup({
          "facilityId": this.current.facilityId,
          "facilityGroupId": facilityGroupId
        })

        if(!hasError(resp)) {
          showToast(translate('Fulfillment setting updated successfully'))
        } else {
          throw resp.data
        }
      } catch (err) {
        showToast(translate('Failed to update fulfillment setting'))
        logger.error('Failed to update fulfillment setting', err)
      }
    },
    async updateFulfillmentSetting(event: any, facilityGroupId: string) {
      event.stopImmediatePropagation();

      // Using `not` as the click event returns the current status of toggle, but on click we want to change the toggle status
      const isChecked = !event.target.checked;

      if(isChecked) {
        this.addFacilityToGroup(facilityGroupId)
      } else {
        this.updateFacilityToGroup(facilityGroupId)
      }
    },
    async updateFacilityToGroup(facilityGroupId: string) {
      let resp;

      const groupInformation = this.current.groupInformation.find((group: any) => group.facilityGroupId === facilityGroupId)

      try {
        resp = await FacilityService.updateFacilityToGroup({
          "facilityId": this.current.facilityId,
          "facilityGroupId": facilityGroupId,
          "fromDate": groupInformation.fromDate,
          "thruDate": DateTime.now().toMillis()
        })

        if (!hasError(resp)) {
          showToast(translate('Fulfillment setting updated successfully'))
        } else {
          throw resp.data
        }
      } catch (err) {
        showToast(translate('Failed to update fulfillment setting'))
        logger.error('Failed to update fulfillment setting', err)
      }
    },
    async updateDefaultDaysToShip() {
      try {
        const payload = {
          facilityId: this.current.facilityId,
          defaultDaysToShip: this.defaultDaysToShip
        }

        const resp = await FacilityService.updateFacility(payload)

        if(!hasError(resp)) {
          showToast(translate('Updated default days to ship'))
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error('Failed to update default days to ship', err)
        showToast(translate('Failed to update default days to ship'))
      }
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
