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
            <h1>
              {{ current.facilityName }}
              <ion-icon :icon="pencilOutline" @click="renameFacility()" />
            </h1>
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
              <template v-if="postalAddress?.address1">
                <ion-item lines="full">
                  <ion-label>
                    <h3>{{ postalAddress.address1 }}</h3>
                    <h3>{{ postalAddress.address2 }}</h3>
                    <p class="ion-text-wrap">{{ postalAddress.postalCode ? `${postalAddress.city}, ${postalAddress.postalCode}` : postalAddress.city }}</p>
                    <p class="ion-text-wrap">{{ postalAddress.countryGeoName ? `${postalAddress.stateGeoName}, ${postalAddress.countryGeoName}` : postalAddress.stateGeoName }}</p>
                  </ion-label>
                </ion-item>
                <ion-button fill="clear" @click="openAddressModal">{{ translate("Edit") }}</ion-button>
              </template>
              <ion-button v-else expand="block" fill="outline" @click="openAddressModal">
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
              <template v-if="postalAddress?.latitude">
                <ion-card-content>
                  {{ translate("These values are used to help customers lookup how close they are to your stores when they are finding nearby stores.") }}
                </ion-card-content>
                <ion-item lines="full">
                  <ion-label>{{ translate("Facility zipcode") }}</ion-label>
                  <p><ion-text :color="isRegenerationRequired ? 'danger' : ''" slot="end">{{ postalAddress.postalCode }}</ion-text></p>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>{{ translate("Latitude") }}</ion-label>
                  <p>{{ postalAddress.latitude }}</p>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>{{ translate("Longitude") }}</ion-label>
                  <p>{{ postalAddress.longitude }}</p>
                </ion-item>
                <div class="actions">
                  <ion-button fill="clear" :disabled="!postalAddress.address1" @click="openGeoPointModal">{{ translate("Edit") }}</ion-button>
                  <ion-button slot="end" fill="clear" color="medium" @click="openLatLongPopover">
                    <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                  </ion-button>
                </div>
              </template>
              <ion-button v-else expand="block" fill="outline" :disabled="!postalAddress.address1" @click="openGeoPointModal">
                {{ translate("Add") }}
                <ion-icon slot="end" :icon="addCircleOutline" />
              </ion-button>
            </ion-card>
          </div>

          <ion-card v-if="!facilityCalendar.calendarId">
            <ion-card-header>
              <ion-card-title>
                {{ translate("Operating hours") }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              {{ translate("Select a saved calendar of store hours or create a new calendar") }}
            </ion-card-content>
            <ion-radio-group v-model="selectedCalendarId">
              <ion-item v-for="(calendar, index) in calendars.slice(0,3)" :key="index" lines="none">
                <ion-label class="ion-text-wrap">{{ calendar.description ? calendar.description : calendar.calendarId }}</ion-label>
                <ion-radio slot="end" :value="calendar.calendarId"/>
              </ion-item>
            </ion-radio-group>
            <ion-item button lines="none" v-if="calendars.length > 3"  @click="addOperatingHours">
              <ion-label> {{ calendars.length - 3 }} {{ translate("Others") }}</ion-label>
              <ion-icon slot="end" :icon="chevronForwardOutline" />
            </ion-item>
            <ion-item button lines="none" @click="addCustomSchedule">
              <ion-label>{{ translate("Custom schedule") }}</ion-label>
              <ion-icon slot="end" color="primary" :icon="addCircleOutline" button />
            </ion-item>
            <ion-button fill="outline" expand="block" :disabled="!selectedCalendarId" @click="associateCalendarToFacility">
              {{ translate("Add operating hours") }}
              <ion-icon slot="end" :icon="addCircleOutline" />
            </ion-button>
          </ion-card>

          <ion-card v-else>
            <ion-card-header>
              <div>
                <p class="overline">{{ translate("Operating hours") }}</p>
                <ion-card-title>
                  {{ facilityCalendar.description }}
                </ion-card-title>
              </div>
              <ion-button color="medium" fill="clear" class="ion-no-padding" @click="openOperatingHoursPopover">
                <ion-icon :icon="ellipsisVerticalOutline" />
              </ion-button>
            </ion-card-header>
            <ion-list lines="none">
              <ion-item v-for="day in days" :key="day">
                <ion-label>
                  <p>{{ translate(day.charAt(0).toUpperCase() + day.slice(1)) }}</p>
                </ion-label>
                <ion-label slot="end">{{ facilityCalendar[day+'StartTime'] ? getOpenEndTime(facilityCalendar[day+'StartTime'], facilityCalendar[day+'Capacity']) : '-' }} </ion-label>
              </ion-item>
            </ion-list>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate("Product Stores") }}
              </ion-card-title>
              <ion-button @click="selectProductStores()" fill="clear">
                <ion-icon :icon="addCircleOutline" slot="end" />
                {{ translate("Add") }}
              </ion-button>
            </ion-card-header>
            <ion-item v-for="store in facilityProductStores" :key="store.productStoreId">
              <ion-label>{{ getProductStore(store.productStoreId)?.storeName }}</ion-label>
              <ion-badge slot="end" v-if="store.productStoreId === primaryMember.facilityGroupId">{{ translate("primary store") }}</ion-badge>
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
              <ion-toggle :checked="current.sellOnline" slot="end" @click="updateFulfillmentSetting($event, 'FAC_GRP')"/>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Allow pickup") }}</ion-label>
              <ion-toggle :checked="current.allowPickup" slot="end" @click="updateFulfillmentSetting($event, 'PICKUP')"/>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Uses native fulfillment app") }}</ion-label>
              <ion-toggle :checked="current.useOMSFulfillment" slot="end" @click="updateFulfillmentSetting($event, 'OMS_FULFILLMENT')"/>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate("Generate shipping labels") }}</ion-label>
              <ion-toggle :checked="current.generateShippingLabel" slot="end" @click="updateFulfillmentSetting($event, 'AUTO_SHIPPING_LABEL')"/>
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
              <ion-card v-for="(shopifyFacilityMapping, index) in current.shopifyFacilityMappings" :key="index">
                <ion-card-header>
                  <ion-card-title>
                    {{ translate("Shopify facility") }}
                  </ion-card-title>
                </ion-card-header>
                <ion-item lines="full">
                  <ion-label>
                    {{ shopifyFacilityMapping.name }}
                    <p>{{ shopifyFacilityMapping.shopId }}</p>
                  </ion-label>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>{{ shopifyFacilityMapping.shopifyLocationId }}</ion-label>
                </ion-item>
                <ion-item v-if="shopifyFacilityMapping.myshopifyDomain" lines="full">
                  <ion-label>{{ shopifyFacilityMapping.myshopifyDomain + '/admin' }}</ion-label>
                  <ion-button color="medium" fill="clear" @click="goToLink(`${shopifyFacilityMapping.myshopifyDomain + '/admin'}`)">
                    <ion-icon :icon="openOutline" />
                  </ion-button>
                </ion-item>
                <ion-item v-if="shopifyFacilityMapping.myshopifyDomain" lines="full">
                  <ion-label>{{ shopifyFacilityMapping.myshopifyDomain }}</ion-label>
                  <ion-button color="medium" fill="clear" @click="goToLink(shopifyFacilityMapping.myshopifyDomain)">
                    <ion-icon :icon="openOutline" />
                  </ion-button>
                </ion-item>
                <ion-button fill="clear" @click="editShopifyFacilityMapping(shopifyFacilityMapping)" >{{ translate("Edit") }}</ion-button>
                <ion-button fill="clear" color="danger" @click="removeShopifyFacilityMapping(shopifyFacilityMapping)">{{ translate("Remove") }}</ion-button>
              </ion-card>
              <ion-card v-for="(mapping, index) in current.facilityMappings" :key="index">
                <ion-card-header>
                  <ion-card-title>
                    {{ externalMappingTypes[mapping.facilityIdenTypeId] }}
                  </ion-card-title>
                </ion-card-header>
                <ion-item lines="full">
                  <ion-label>{{ translate('Identification') }}</ion-label>
                  <ion-label slot="end">{{ mapping.idValue }}</ion-label>
                </ion-item>
                <ion-button fill="clear" @click="editFacilityMapping(mapping)">{{ translate("Edit") }}</ion-button>
                <ion-button fill="clear" color="danger" @click="removeFacilityMapping(mapping)">{{ translate("Remove") }}</ion-button>
              </ion-card>
            </div>
          </div>

          <div v-else-if="segment === 'staff'">
            <ion-button fill="outline" @click="addStaffMemberModal">
              <ion-icon :icon="addCircleOutline" slot="start" />
              {{ translate("Add staff member to facility") }}
            </ion-button>

            <div v-for="(party, index) in facilityParties" class="list-item staff" :key="index">
              <ion-item lines="none">
                <ion-icon :icon="personOutline" slot="start" />
                <ion-label>
                  {{ party.fullName }}
                  <p>{{ party.partyId }}</p>
                </ion-label>
              </ion-item>

              <ion-label class="tablet">
                <ion-chip outline>{{ partyRoles[party.roleTypeId] ? partyRoles[party.roleTypeId] : '-' }}</ion-chip>
                <p>{{ translate("role") }}</p>
              </ion-label>

              <ion-label class="tablet">
                <ion-chip outline>{{ getDate(party.fromDate) }}</ion-chip>
                <p>{{ "added" }}</p>
              </ion-label>

              <ion-button @click="removePartyFromFacility(party)" fill="clear" color="medium">
                <ion-icon slot="icon-only" :icon="closeCircleOutline" />
              </ion-button>
            </div>
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
                {{ location.positionId ? location.positionId : '-' }}
                <p>{{ translate("sequence") }}</p>
              </ion-label>

              <ion-button fill="clear" color="medium" @click="openLocationDetailsPopover($event, location)">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
            </div>
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
  IonPage,
  IonProgressBar,
  IonRadio,
  IonRadioGroup,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  alertController,
  modalController,
  popoverController
} from '@ionic/vue'
import { 
  addCircleOutline,
  addOutline,
  closeCircleOutline,
  closeOutline,
  chevronForwardOutline,
  ellipsisVerticalOutline,
  globeOutline,
  locationOutline,
  openOutline,
  pencilOutline,
  personOutline
} from 'ionicons/icons'
import { translate } from '@hotwax/dxp-components';
import FacilityMappingPopover from '@/components/FacilityMappingPopover.vue'
import LocationDetailsPopover from '@/components/LocationDetailsPopover.vue';
import FacilityAddressModal from '@/components/FacilityAddressModal.vue'
import FacilityGeoPointModal from '@/components/FacilityGeoPointModal.vue';
import ProductStorePopover from '@/components/ProductStorePopover.vue';
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue'
import AddOperatingHoursModal from '@/components/AddOperatingHoursModal.vue'
import AddLocationModal from '@/components/AddLocationModal.vue';
import AddStaffMemberModal from '@/components/AddStaffMemberModal.vue';
import ViewFacilityOrderCountModal from '@/components/ViewFacilityOrderCountModal.vue'
import OrderLimitPopover from '@/components/OrderLimitPopover.vue';
import CustomScheduleModal from '@/components/CustomScheduleModal.vue';
import { mapGetters, useStore } from 'vuex';
import { DateTime } from 'luxon';
import { FacilityService } from '@/services/FacilityService';
import { hasError } from '@/adapter';
import logger from '@/logger';
import FacilityShopifyMappingModal from '@/components/FacilityShopifyMappingModal.vue'
import FacilityMappingModal from '@/components/FacilityMappingModal.vue'
import { showToast } from '@/utils';
import OperatingHoursPopover from '@/components/OperatingHoursPopover.vue'
import GeoPointPopover from '@/components/GeoPointPopover.vue'
import { UtilService } from '@/services/UtilService';

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
    IonPage,
    IonProgressBar,
    IonRadio,
    IonRadioGroup,
    IonSegment,
    IonSegmentButton,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  data() {
    return {
      isLoading: true, // shows whether the facility information fetching is completed or not
      segment: 'external-mappings',
      defaultDaysToShip: '', // not assinging 0 by default as it will convey the user that the facility can ship same day, but actually defaultDays are not setup on the facility
      primaryMember: {} as any,
      isCalendarFound: true,
      selectedCalendarId: '',
      isRegenerationRequired: true,
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }
  },
  computed: {
    ...mapGetters({
      calendars: 'util/getCalendars',
      current: 'facility/getCurrent',
      externalMappingTypes: 'util/getExternalMappingTypes',
      facilityCalendar: 'facility/getFacilityCalendar',
      facilityParties: 'facility/getFacilityParties',
      facilityProductStores: 'facility/getFacilityProductStores',
      getProductStore: 'util/getProductStore',
      locationTypes: 'util/getLocationTypes',
      partyRoles: 'util/getPartyRoles',
      productStores: 'util/getProductStores',
      postalAddress: 'facility/getPostalAddress',
      userProfile: 'user/getUserProfile',
    })
  },
  props: ["facilityId"],
  async ionViewWillEnter() {
    await Promise.all([this.store.dispatch('facility/fetchCurrentFacility', { facilityId: this.facilityId }), this.store.dispatch('util/fetchExternalMappingTypes'), this.store.dispatch('util/fetchLocationTypes'), this.store.dispatch('util/fetchPartyRoles')])
    await Promise.all([this.store.dispatch('facility/fetchFacilityLocations', { facilityId: this.facilityId }), this.store.dispatch('facility/getFacilityParties', { facilityId: this.facilityId }), this.store.dispatch('facility/fetchFacilityMappings', { facilityId: this.facilityId, facilityIdenTypeIds: Object.keys(this.externalMappingTypes)}), this.store.dispatch('facility/fetchShopifyFacilityMappings', { facilityId: this.facilityId }), this.store.dispatch('facility/getFacilityProductStores', { facilityId: this.facilityId }), this.store.dispatch('util/fetchProductStores'), this.store.dispatch('facility/fetchFacilityContactDetails', { facilityId: this.facilityId }), this.store.dispatch('util/fetchCalendars'), this.store.dispatch('facility/fetchFacilityCalendar', { facilityId: this.facilityId })])
    this.defaultDaysToShip = this.current.defaultDaysToShip
    this.isLoading = false
    this.fetchFacilityPrimaryMember()
    if(this.postalAddress.latitude) this.fetchPostalCodeByGeoPoints()
  },
  methods: {
    goToLink(link: string) {
      const url = link.startsWith('http') ? link : `https://${link}`
      // opening link in new tab without passing any reference
      window.open(url, '_blank', 'noopener, noreferrer')
    },
    async productStorePopover(ev: Event, store: any) {
      const popover = await popoverController.create({
        component: ProductStorePopover,
        componentProps: {
          currentProductStore: store,
          facilityId: this.facilityId,
          primaryMember: this.primaryMember
        },
        event: ev,
        showBackdrop: false
      });

      popover.onDidDismiss().then(async() => {
        await this.fetchFacilityPrimaryMember()
      })

      return popover.present()
    },
    async openLatLongPopover(event: Event) {
      const popover = await popoverController.create({
        component: GeoPointPopover,
        componentProps: { facilityId: this.facilityId, isRegenerationRequired: this.isRegenerationRequired },
        event,
        showBackdrop: false
      });

      popover.onDidDismiss().then(async(result) => {
        if(result?.data?.generatedLatLong) {
          // changing the value for the variable, as if the popover has returned some value, it simply
          // means that the latLng are correct for current zipCode
          this.isRegenerationRequired = false
        }
      })

      return popover.present()
    },
    async associateCalendarToFacility() {
      let resp;

       try {
        resp = await FacilityService.associateCalendarToFacility({
          facilityId: this.facilityId,
          calendarId: this.selectedCalendarId,
          fromDate: DateTime.now().toMillis(),
          facilityCalendarTypeId: 'OPERATING_HOURS'
        })

        if(!hasError(resp)) {
          showToast(translate("Successfully associated calendar to the facility."))
          await this.store.dispatch('facility/fetchFacilityCalendar', { facilityId: this.facilityId })
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to associate calendar to the facility."))
        logger.error(err)
      }
    },
    async openAddressModal() {
      const addressModal = await modalController.create({
        component: FacilityAddressModal,
        componentProps: { facilityId: this.facilityId }
      })

      addressModal.present()
    },
    async addCustomSchedule() {
      const customScheduleModal = await modalController.create({
        component: CustomScheduleModal,
        componentProps: { facilityId: this.facilityId }
      })

      customScheduleModal.present()
    },
    async openGeoPointModal() {
      const geoPointModal = await modalController.create({
        component: FacilityGeoPointModal,
        componentProps: { facilityId: this.facilityId }
      })

      geoPointModal.onDidDismiss().then(async(result) => {
        if(result.data?.geoPoints) {
          await this.fetchPostalCodeByGeoPoints()
        }
      })

      geoPointModal.present()
    },
    async selectProductStores() {
      const selectProductStoreModal = await modalController.create({
        component: SelectProductStoreModal,
        componentProps: { facilityId: this.facilityId, selectedProductStores: this.facilityProductStores }
      })

      selectProductStoreModal.onDidDismiss().then(async(result: any) => {
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
              fromDate: DateTime.now().toMillis(),
            }))
          )

          const hasFailedResponse = [...updateResponses, ...createResponses].some((response: any) => response.status === 'rejected')
          if(hasFailedResponse) {
            showToast(translate("Failed to update some product stores"))
          } else {
            productStoresToRemove.map((store: any) => {
              if(store.productStoreId === this.primaryMember.facilityGroupId) {
                this.revokePrimaryStatusFromStore()
              }
            })
            showToast(translate("Product stores updated successfully."))
          }

          // refetching product stores with updated roles and primary Member
          await this.store.dispatch('facility/getFacilityProductStores', { facilityId: this.facilityId })
          await this.fetchFacilityPrimaryMember()
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
        component: AddStaffMemberModal,
        componentProps: { facilityId: this.facilityId, selectedParties: this.facilityParties }
      })

      addStaffModal.present()
    },
    async addOperatingHours() {
      const addOperatingHoursModal = await modalController.create({
        component: AddOperatingHoursModal,
        componentProps: { facilityId: this.facilityId }
      })

      addOperatingHoursModal.present()
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
        component: FacilityMappingPopover,
        event: ev,
        showBackdrop: false
      });
      return externalMappingPopover.present()
    },
    async openOperatingHoursPopover(ev: Event) {
      const operatingHoursPopover = await popoverController.create({
        component: OperatingHoursPopover,
        componentProps: { facilityId: this.facilityId },
        event: ev,
        showBackdrop: false
      });

      operatingHoursPopover.present()
    },
    getDate(date: any) {
      return DateTime.fromMillis(date).toFormat('dd LLL yyyy')
    },
    async removePartyFromFacility(party: any) {
      try {
        const resp = await FacilityService.removePartyFromFacility({
          facilityId: party.facilityId,
          fromDate: party.fromDate,
          thruDate: DateTime.now().toMillis(),
          partyId: party.partyId,
          roleTypeId: party.roleTypeId
        })

        if(!hasError(resp)){
          showToast(translate("Party successfully removed from facility."))

          // Refreshes the parties in facility
          await this.store.dispatch('facility/getFacilityParties', { facilityId: this.facilityId })
        } else {
          throw resp
        }
      } catch(err) {
        showToast(translate("Failed to remove party from facility."))
        logger.error(err)
      }
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
        // refetching the facility to update the maximumOrderLimit
        await this.store.dispatch('facility/fetchCurrentFacility', this.facilityId)
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
          this.store.dispatch('facility/fetchFacilityAdditionalInformation')
        } else {
          throw resp.data
        }
      } catch (err) {
        showToast(translate('Failed to update fulfillment setting'))
        logger.error('Failed to update fulfillment setting', err)
      }
    },
    async revokePrimaryStatusFromStore() {
      try {
        await FacilityService.updateFacilityToGroup({
          "facilityId": this.facilityId,
          "facilityGroupId": this.primaryMember.facilityGroupId,
          "fromDate": this.primaryMember.fromDate,
          "thruDate": DateTime.now().toMillis()
        })
      } catch (err) {
        logger.error(err)
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
          this.store.dispatch('facility/fetchFacilityAdditionalInformation')
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
    },
    async fetchFacilityPrimaryMember() {
      let primaryMember = {}
      const payload = {
        inputFields: {
          facilityId: this.facilityId,
          facilityGroupTypeId: 'FEATURING'
        },
        entityName: 'FacilityGroupAndMember',
        filterByDate: 'Y',
        viewSize: 1,
      }

      try {
        const resp = await FacilityService.fetchFacilityPrimaryMember(payload)

        if(!hasError(resp)) {
          primaryMember = resp.data.docs[0]
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
      this.primaryMember = primaryMember
    },
    async removeFacilityMapping(mapping: any) {
      try {
        const payload = {
          facilityId: this.current.facilityId,
          facilityIdenTypeId: mapping.facilityIdenTypeId,
          fromDate: mapping.fromDate,
          thruDate: DateTime.now().toMillis()
        }

        const resp = await FacilityService.updateFacilityIdentification(payload)

        if(!hasError(resp)) {
          showToast(translate('Removed facility mapping successfully'))
          await this.store.dispatch('facility/fetchFacilityMappings', { facilityId: this.facilityId, facilityIdenTypeIds: Object.keys(this.externalMappingTypes) })
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error('Failed to remove facility mapping', err)
        showToast(translate('Failed to remove facility mapping'))
      }
    },
    async removeShopifyFacilityMapping(shopifyFacilityMapping: any) {
      try {
        const payload = {
          facilityId: this.current.facilityId,
          shopId: shopifyFacilityMapping.shopId,
          shopifyLocationId: shopifyFacilityMapping.shopifyLocationId,
        }

        const resp = await FacilityService.deleteShopifyShopLocation(payload)

        if(!hasError(resp)) {
          showToast(translate('Removed shopify mapping successfully'))
          await this.store.dispatch('facility/fetchShopifyFacilityMappings', { facilityId: this.facilityId })
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error('Failed to remove shopify mapping', err)
        showToast(translate('Failed to remove shopify mapping'))
      }
    },
    async editFacilityMapping(mapping: any) {
      const customMappingModal = await modalController.create({
        component: FacilityMappingModal,
        componentProps: { mappingId: mapping.facilityIdenTypeId, mapping, type: 'update' }
      })

      customMappingModal.present()
    },
    async editShopifyFacilityMapping(shopifyFacilityMapping: any) {
      const customMappingModal = await modalController.create({
        component: FacilityShopifyMappingModal,
        componentProps: { shopifyFacilityMapping, type: 'update' }
      })

      customMappingModal.present()
    },
    getOpenEndTime(startTime: any, capacity: any) {
      const openTime = DateTime.fromFormat(startTime, 'HH:mm:ss').toFormat('HH:mm a');
      const endTime = DateTime.fromMillis(DateTime.fromFormat(startTime, 'HH:mm:ss').toMillis() + capacity).toFormat('hh:mm a')
      return `${openTime} - ${endTime}`
    },
    async fetchPostalCodeByGeoPoints() {
      const payload = {
        json: {
          "query": "*:*",
          "filter": "{!geofilt sfield=location}",
          "params": {
            "pt": `${this.postalAddress.latitude}, ${this.postalAddress.longitude}`,
            "d": "10"
          },
          sort: 'geodist(location, ' + this.postalAddress.latitude + ',' + this.postalAddress.longitude + ') asc',
          "limit": 1
        }
      }

      try {
        const resp = await UtilService.generateLatLong(payload)

        if(!hasError(resp)) {
          this.isRegenerationRequired = !(this.postalAddress.postalCode === resp.data.response.docs[0].postcode)
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
    },
    async renameFacility() {
      const alert = await alertController.create({
        header: translate("Rename facility"),
        inputs: [{
          name: "facilityName",
          value: this.current.facilityName
        }],
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Apply'),
          handler: async (data: any) => {
            if(data.facilityName) {
              try {
                const resp = await FacilityService.updateFacility({
                  facilityId: this.facilityId,
                  facilityName: data.facilityName
                })

                if (!hasError(resp)) {
                  showToast(translate("Facility renamed successfully."))
                  await this.store.dispatch('facility/fetchCurrentFacility', { facilityId: this.facilityId })
                } else {
                  throw resp.data
                }
              } catch (error) {
                showToast(translate('Failed to rename facility.'))
                logger.error('Failed to rename parking.', error)
              }
            }
          }
        }]
      })

      await alert.present()
    },
  },
  setup() {
    const store = useStore();

    return {
      addCircleOutline,
      addOutline,
      closeCircleOutline,
      closeOutline,
      chevronForwardOutline,
      ellipsisVerticalOutline,
      globeOutline,
      locationOutline,
      openOutline,
      pencilOutline,
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

.actions {
  display: flex;
  justify-content: space-between;
}
</style>
