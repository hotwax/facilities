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
        <div class="facility-info">
          <ion-card class="facility-info facility-details">
            <ion-item lines="none" class="ion-margin-top">
              <ion-label>
                <p class="overline">{{ current.facilityId }}</p>
                <h1>{{ current.facilityName }}</h1>
              </ion-label>
              <ion-button @click="renameFacility()" fill="outline">{{ translate('Edit') }}</ion-button>
            </ion-item>

            <div class="ion-margin-top">
              <ion-item>
                <ion-icon :icon="bookmarkOutline" slot="start"/>
                <ion-label>{{ translate('Facility Type') }}</ion-label>
                <ion-select interface="popover" v-model="parentFacilityTypeId" @ionChange="getFacilityTypesByParentTypeId()">
                  <ion-select-option value="PHYSICAL_STORE">{{ translate('Physical Store') }}</ion-select-option>
                  <ion-select-option value="DISTRIBUTION_CENTER">{{ translate('Distribution Center') }}</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item lines="none" class="ion-margin-bottom">
                <ion-icon :icon="bookmarksOutline" slot="start"/>
                <ion-label>{{ translate('Facility SubType') }}</ion-label>
                <ion-select interface="popover" v-model="facilityTypeId" @ionChange="updateFacilityType()">
                  <ion-select-option v-for="(type, facilityTypeId) in facilityTypeIdOptions" :key="facilityTypeId" :value="facilityTypeId">{{ type.description ? type.description : facilityTypeId }}</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
          </ion-card>
        </div>

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
                  <ion-label>
                    <p>{{ translate("Facility zipcode") }}</p>
                  </ion-label>
                  <ion-label slot="end"><ion-text :color="isRegenerationRequired ? 'danger' : ''">{{ postalAddress.postalCode }}</ion-text></ion-label>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>
                    <p>{{ translate("Latitude") }}</p>
                  </ion-label>
                  <ion-label slot="end">{{ postalAddress.latitude }}</ion-label>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>
                    <p>{{ translate("Longitude") }}</p>
                  </ion-label>
                  <ion-label slot="end">{{ postalAddress.longitude }}</ion-label>
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
                <ion-radio :value="calendar.calendarId">
                  <div class="ion-text-wrap">{{ calendar.description ? calendar.description : calendar.calendarId }} {{ 'TEST CALENDAR THIS' }}</div>
                </ion-radio>
              </ion-item>
            </ion-radio-group>
            <ion-item button lines="none" v-if="calendars?.length > 3"  @click="addOperatingHours">
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
                <ion-label slot="end">
                  <p>{{ facilityCalendar[day+'StartTime'] ? getOpenEndTime(facilityCalendar[day+'StartTime'], facilityCalendar[day+'Capacity']) : translate('Closed') }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate("Product Stores") }}
              </ion-card-title>
              <ion-button v-if="facilityProductStores?.length" @click="selectProductStores()" fill="clear">
                <ion-icon :icon="addCircleOutline" slot="end" />
                {{ translate("Add") }}
              </ion-button>
            </ion-card-header>
            <ion-item v-for="store in facilityProductStores" :key="store.productStoreId">
              <ion-label>{{ getProductStore(store.productStoreId)?.storeName }}</ion-label>
              <ion-badge slot="end" v-if="shopifyShopIdForProductStore(store.productStoreId) === current.primaryFacilityGroupId">{{ translate("primary store") }}</ion-badge>
              <ion-button slot="end" fill="clear" color="medium" @click="productStorePopover($event, store)">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
            </ion-item>
            <ion-button v-if="!facilityProductStores?.length" expand="block" fill="outline" @click="selectProductStores()">
              {{ translate("Add") }}
              <ion-icon slot="end" :icon="addCircleOutline" />
            </ion-button>
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
                {{ translate("Sell inventory online") }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              {{ translate("Select which channels this facility publishes inventory too.") }}
            </ion-card-content>
            <ion-item v-for="inventoryGroup in current.inventoryGroups" :key="inventoryGroup.facilityGroupId">
              <ion-label>{{ inventoryGroup?.facilityGroupName }}</ion-label>
              <ion-toggle :checked="inventoryGroup.isChecked" slot="end" @click="updateSellInventoryOnlineSetting($event, inventoryGroup)"/>
            </ion-item>
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
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate(`${facilityTypes[current.facilityTypeId]?.description} logins`) }}
              </ion-card-title>
              <ion-button v-if="current.facilityLogins?.length" @click="createFacilityLoginModal()" fill="clear">
                <ion-icon :icon="addCircleOutline" slot="end" />
                {{ translate("Add") }}
              </ion-button>
            </ion-card-header>
            <ion-item v-for="facilityLogin in current.facilityLogins" :key="facilityLogin.userLoginId">
              <ion-avatar slot="start" v-if="facilityLogin.objectInfo">
                <Image :src="getImageUrl(facilityLogin.objectInfo)"/>
              </ion-avatar>
              <ion-label>
                {{ facilityLogin.groupName }}
                <p>{{ facilityLogin.partyId }}</p>
                <p>{{ facilityLogin.userLoginId }}</p>
              </ion-label>
              <ion-button slot="end" fill="clear" color="medium" @click="openFacilityLoginActionPopover($event, facilityLogin)">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
            </ion-item>
            <ion-button v-if="!current.facilityLogins?.length" expand="block" fill="outline" @click="createFacilityLoginModal()">
              {{ translate("Add") }}
              <ion-icon slot="end" :icon="addCircleOutline" />
            </ion-button>
          </ion-card>
        </section>

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
          <ion-segment-button value="groups" layout="icon-start">
            <ion-icon :icon="albumsOutline" />
            <ion-label>{{ translate("Groups") }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <template v-if="segment === 'external-mappings'">
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

            <!-- Hardcoded card to show facility externalId, as externalID is not available as an identification -->
            <ion-card v-if="current.externalId">
              <ion-card-header>
                <ion-card-title>
                  {{ translate('Facility External ID') }}
                </ion-card-title>
              </ion-card-header>
              <ion-item lines="full">
                <ion-label>{{ translate('Identification') }}</ion-label>
                <ion-label slot="end">{{ current.externalId }}</ion-label>
              </ion-item>
              <!-- Using blur to remove the focus from button on click, as we need to focus the input field inside the modal opened
              and we can't focus two elements at the same time -->
              <ion-button fill="clear" @click="$event.target.blur(); editFacilityExternalId()">{{ translate("Edit") }}</ion-button>
              <ion-button fill="clear" color="danger" @click="removeFacilityExternalID()">{{ translate("Remove") }}</ion-button>
            </ion-card>
          </div>
        </template>

        <template v-else-if="segment === 'staff'">
          <ion-button fill="outline" @click="addStaffMemberModal">
            <ion-icon :icon="addCircleOutline" slot="start" />
            {{ translate("Staff member") }}
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
        </template>

        <template v-else-if="segment == 'locations'">
          <ion-button fill="outline" @click="addLocationModal">
            <ion-icon :icon="addCircleOutline" slot="start" />
            {{ translate("Internal locations") }}
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
        </template>

        <template v-else-if="segment == 'groups'">
          <ion-button fill="outline" @click="addFacilityGroupModal">
            <ion-icon :icon="addCircleOutline" slot="start" />
            {{ translate("Link to groups") }}
          </ion-button>

          <div class="external-mappings">
            <ion-card v-for="(group, index) in current.groupInformation" :key="index">
              <ion-card-header>
                <div>
                  <ion-card-title>{{ group.facilityGroupName }}</ion-card-title>
                  <ion-card-subtitle>{{ group.facilityGroupId }}</ion-card-subtitle>
                </div>
                <ion-badge>{{ getFacilityGroupTypeDesc(group.facilityGroupTypeId) }}</ion-badge>
                <ion-button fill="clear" @click="removeFacilityFromGroup(group.facilityGroupId)">
                  <ion-icon slot="icon-only" :icon="unlinkOutline" />
                </ion-button>
              </ion-card-header>
              <ion-item v-if="group.description" lines="none">
                <ion-label class="ion-text-wrap">{{ group.description }}</ion-label>
              </ion-item>
            </ion-card>
          </div>
        </template>
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
  IonAvatar,
  IonBackButton,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
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
  IonSelect,
  IonSelectOption,
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
  albumsOutline,
  bookmarkOutline,
  bookmarksOutline,
  closeCircleOutline,
  closeOutline,
  chevronForwardOutline,
  ellipsisVerticalOutline,
  globeOutline,
  locationOutline,
  openOutline,
  pencilOutline,
  personOutline,
  unlinkOutline
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
import FacilityExternalIdModal from '@/components/FacilityExternalIdModal.vue'
import FacilityMappingModal from '@/components/FacilityMappingModal.vue'
import { showToast } from '@/utils';
import OperatingHoursPopover from '@/components/OperatingHoursPopover.vue'
import GeoPointPopover from '@/components/GeoPointPopover.vue'
import { UtilService } from '@/services/UtilService';
import FacilityLoginActionPopover from '@/components/FacilityLoginActionPopover.vue'
import CreateFacilityLoginModal from '@/components/CreateFacilityLoginModal.vue'
import AddFacilityGroupModal from '@/components/AddFacilityGroupModal.vue'
import Image from '@/components/Image.vue';
import emitter from '@/event-bus'

export default defineComponent({
  name: 'FacilityDetails',
  components: {
    IonAvatar,
    IonBackButton,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
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
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar,
    Image
  },
  data() {
    return {
      isLoading: true, // shows whether the facility information fetching is completed or not
      segment: 'external-mappings',
      defaultDaysToShip: '', // not assinging 0 by default as it will convey the user that the facility can ship same day, but actually defaultDays are not setup on the facility
      isCalendarFound: true,
      selectedCalendarId: '',
      isRegenerationRequired: false,  // keeping value as false, as initially we does not know whether the zipCode is valid or not, if making it true, the UI changes from danger to normal which is not a good experience
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      externalId: '',
      facilityTypeId: '',
      parentFacilityTypeId: '',
      facilityTypeIdOptions: {} as any
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
      shopifyShopIdForProductStore: 'util/getShopifyShopIdForProductStore',
      facilityTypes: "util/getFacilityTypes",
      baseUrl: "user/getBaseUrl",
      facilityGroupTypes: 'util/getFacilityGroupTypes'
    })
  },
  props: ["facilityId"],
  async ionViewWillEnter() {
    await Promise.all([this.store.dispatch('util/fetchFacilityGroupTypes'), this.store.dispatch('util/fetchInventoryGroups')])
    await Promise.all([this.store.dispatch('facility/fetchCurrentFacility', { facilityId: this.facilityId }), this.store.dispatch('util/fetchExternalMappingTypes'), this.store.dispatch('util/fetchLocationTypes'), this.store.dispatch('util/fetchPartyRoles'), this.store.dispatch('util/fetchFacilityTypes', {
      parentTypeId: 'VIRTUAL_FACILITY',
      parentTypeId_op: 'notEqual',
      facilityTypeId: 'VIRTUAL_FACILITY',
      facilityTypeId_op: 'notEqual'
    })])
    await Promise.all([this.store.dispatch('facility/fetchFacilityLocations', { facilityId: this.facilityId }), this.store.dispatch('facility/getFacilityParties', { facilityId: this.facilityId }), this.store.dispatch('facility/fetchFacilityMappings', { facilityId: this.facilityId, facilityIdenTypeIds: Object.keys(this.externalMappingTypes)}), this.store.dispatch('facility/fetchShopifyFacilityMappings', { facilityId: this.facilityId }), this.store.dispatch('facility/getFacilityProductStores', { facilityId: this.facilityId }), this.store.dispatch('util/fetchProductStores'), this.store.dispatch('facility/fetchFacilityContactDetails', { facilityId: this.facilityId }), this.store.dispatch('util/fetchCalendars'), this.store.dispatch('facility/fetchFacilityCalendar', { facilityId: this.facilityId }), this.store.dispatch('facility/fetchFacilityLogins', { facilityId: this.facilityId })])
    this.defaultDaysToShip = this.current.defaultDaysToShip
    this.isLoading = false
    this.parentFacilityTypeId = this.current.parentFacilityTypeId
    this.facilityTypeId = this.current.facilityTypeId
    // not calling the method (getFacilityTypesByParentTypeId) here, as the method will be called on ionChange of parentType
    this.facilityTypeIdOptions = this.parentFacilityTypeId ? Object.keys(this.facilityTypes).reduce((facilityTypesByParentTypeId: any, facilityTypeId: string) => {
      if (this.facilityTypes[facilityTypeId].parentTypeId === this.parentFacilityTypeId) {
        facilityTypesByParentTypeId[facilityTypeId] = this.facilityTypes[facilityTypeId]
      }
      return facilityTypesByParentTypeId
    }, {}) : this.facilityTypes
    if(this.postalAddress.latitude) this.fetchPostalCodeByGeoPoints()
  },
  methods: {
    getImageUrl(imageUrl: string) {
      return (this.baseUrl.startsWith('http') ? this.baseUrl.replace(/api\/?/, "") : `https://${this.baseUrl}.hotwax.io/`) + imageUrl
    },
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
          facilityId: this.facilityId
        },
        event: ev,
        showBackdrop: false
      });

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
      emitter.emit('presentLoader')

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

      emitter.emit('dismissLoader')
    },
    async openAddressModal() {
      const addressModal = await modalController.create({
        component: FacilityAddressModal,
        componentProps: { facilityId: this.facilityId }
      })

      addressModal.onDidDismiss().then(async(result) => {
        if(result.data?.postalAddress) {
          await this.fetchPostalCodeByGeoPoints()
        }
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
        componentProps: { selectedProductStores: this.facilityProductStores }
      })

      selectProductStoreModal.onDidDismiss().then(async(result: any) => {
        if (result.data && result.data.value) {
          emitter.emit('presentLoader')

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
            showToast(translate("Product stores updated successfully."))
          }

          // refetching product stores with updated roles
          await this.store.dispatch('facility/getFacilityProductStores', { facilityId: this.facilityId })
          emitter.emit('dismissLoader')
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
    async addFacilityGroupModal() {
      const addFacilityGroupModal = await modalController.create({
        component: AddFacilityGroupModal
      })

      addFacilityGroupModal.present()

      // fetch the latest facilityGroups information only if facility is linked to some new groups
      addFacilityGroupModal.onDidDismiss().then((result: any) => {
        if(result?.data?.fetchGroups) {
          this.store.dispatch('facility/fetchFacilityAdditionalInformation')
        }
      })
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
      emitter.emit('presentLoader')

      try {
        const resp = await FacilityService.removePartyFromFacility({
          facilityId: party.facilityId,
          fromDate: party.fromDate,
          thruDate: DateTime.now().toMillis(),
          partyId: party.partyId,
          roleTypeId: party.roleTypeId
        })

        if(!hasError(resp)){
          showToast(translate("Party was removed from facility.", {"partyName": party.fullName, "facilityName": this.current.facilityName}))

          // Refreshes the parties in facility
          await this.store.dispatch('facility/getFacilityParties', { facilityId: this.facilityId })
        } else {
          throw resp
        }
      } catch(err) {
        showToast(translate("Failed to remove party from facility."))
        logger.error(err)
      }

      emitter.emit('dismissLoader')
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
        emitter.emit('presentLoader')

        await this.updateFacility(result.data, this.current)
        // refetching the facility to update the maximumOrderLimit
        await this.store.dispatch('facility/fetchCurrentFacility', { facilityId: this.facilityId, skipState: true })

        emitter.emit('dismissLoader')
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

    async updateFulfillmentSetting(event: any, facilityGroupId: string) {
      event.stopImmediatePropagation();
      emitter.emit("presentLoader");

      // Using `not` as the click event returns the current status of toggle, but on click we want to change the toggle status
      const isChecked = !event.target.checked;

      try {
        let resp;
        if (isChecked) {
          resp = await FacilityService.addFacilityToGroup({
            "facilityId": this.current.facilityId,
            "facilityGroupId": facilityGroupId
          });
        } else {
          const groupInformation = this.current.groupInformation.find((group: any) => group.facilityGroupId === facilityGroupId)
          resp = await await FacilityService.updateFacilityToGroup({
            "facilityId": this.current.facilityId,
            "facilityGroupId": facilityGroupId,
            "fromDate": groupInformation.fromDate,
            "thruDate": DateTime.now().toMillis()
          })
        }
        if (!hasError(resp)) {
          showToast(translate('Fulfillment setting updated successfully'))
          await this.store.dispatch('facility/fetchFacilityAdditionalInformation')
        } else {
          throw resp.data
        }
      } catch (err) {
        showToast(translate('Failed to update fulfillment setting'))
        logger.error('Failed to update fulfillment setting', err)
      }
      emitter.emit("dismissLoader");
    },

    async updateSellInventoryOnlineSetting(event: any, facilityGroup: any) {
      event.stopImmediatePropagation();
      emitter.emit("presentLoader");

      // Using `not` as the click event returns the current status of toggle, but on click we want to change the toggle status
      const isChecked = !event.target.checked;

      try {
        let resp;
        let successMessage;
        if (isChecked) {
          resp = await FacilityService.addFacilityToGroup({
            "facilityId": this.current.facilityId,
            "facilityGroupId": facilityGroup.facilityGroupId
          });
          successMessage = translate('is now selling on', { "facilityName": this.current.facilityName, "facilityGroupId": facilityGroup.facilityGroupName });
        } else {
          const groupInformation = this.current.groupInformation.find((group: any) => group.facilityGroupId === facilityGroup.facilityGroupId)
          resp = await await FacilityService.updateFacilityToGroup({
            "facilityId": this.current.facilityId,
            "facilityGroupId": facilityGroup.facilityGroupId,
            "fromDate": groupInformation.fromDate,
            "thruDate": DateTime.now().toMillis()
          })
          successMessage = translate('no longer sells on', { "facilityName": this.current.facilityName, "facilityGroupId": facilityGroup.facilityGroupName })
        }
        if (!hasError(resp)) {
          showToast(successMessage)
          await this.store.dispatch('facility/fetchFacilityAdditionalInformation')
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to update sell inventory online setting'))
        logger.error('Failed to update sell inventory online setting', err)
      }
      emitter.emit("dismissLoader");
    },
    async removeFacilityFromGroup(facilityGroupId: string) {
      emitter.emit("presentLoader");

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
          showToast(translate('Group unlinked from facility'))
          await this.store.dispatch('facility/fetchFacilityAdditionalInformation')
        } else {
          throw resp.data
        }
      } catch (err) {
        showToast(translate('Failed to unlink group'))
        logger.error('Failed to unlink group', err)
      }

      emitter.emit("dismissLoader");
    },
    async updateDefaultDaysToShip() {
      emitter.emit('presentLoader')

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

      emitter.emit('dismissLoader')
    },
    async removeFacilityMapping(mapping: any) {
      emitter.emit('presentLoader')

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

      emitter.emit('dismissLoader')
    },
    async removeFacilityExternalID() {
      emitter.emit('presentLoader')

      try {
        const payload = {
          facilityId: this.current.facilityId,
          externalId: ''
        }

        const resp = await FacilityService.updateFacility(payload)

        if(!hasError(resp)) {
          this.current.externalId = ''
          showToast(translate('Removed facility external ID'))
          await this.store.dispatch('facility/updateCurrentFacility', this.current)
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error('Failed to remove external id', err)
        showToast(translate('Failed to remove external id'))
      }

      emitter.emit('dismissLoader')
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
    async editFacilityExternalId() {
      const facilityExternalIdModal = await modalController.create({
        component: FacilityExternalIdModal
      })

      facilityExternalIdModal.present()
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
              emitter.emit('presentLoader')

              try {
                const resp = await FacilityService.updateFacility({
                  facilityId: this.facilityId,
                  facilityName: data.facilityName
                })

                if (!hasError(resp)) {
                  showToast(translate("Facility renamed successfully."))
                  await this.store.dispatch('facility/updateCurrentFacility', { ...this.current, facilityName: data.facilityName })
                } else {
                  throw resp.data
                }
              } catch (error) {
                showToast(translate('Failed to rename facility.'))
                logger.error('Failed to rename facility.', error)
              }

              emitter.emit('dismissLoader')
            }
          }
        }]
      })

      await alert.present()
    },
    getFacilityTypesByParentTypeId() {
      this.facilityTypeIdOptions = this.parentFacilityTypeId ? Object.keys(this.facilityTypes).reduce((facilityTypesByParentTypeId: any, facilityTypeId: string) => {
        if (this.facilityTypes[facilityTypeId].parentTypeId === this.parentFacilityTypeId) {
          facilityTypesByParentTypeId[facilityTypeId] = this.facilityTypes[facilityTypeId]
        }
        return facilityTypesByParentTypeId
      }, {}) : this.facilityTypes

      // added this check to stop the programatic execution of this flow on initial load
      if(this.current.parentFacilityTypeId === this.parentFacilityTypeId) {
        return;
      }
      // In accordance with the specified requirements, it is essential to treat RETAIL STORE and WAREHOUSE
      // as default elements within the list. These elements may appear at any index within the list structure.
      // Hence to meet requirement we explicitly handling the default nature of RETAIL STORE and WAREHOUSE.
      this.facilityTypeId = this.facilityTypeIdOptions['RETAIL_STORE'] ? 'RETAIL_STORE' : this.facilityTypeIdOptions['WAREHOUSE'] ? 'WAREHOUSE' : Object.keys(this.facilityTypeIdOptions)[0]
    },
    async updateFacilityType() {
      // Not updating facility when current selected type and facilityType are same, as the value of facilityTypeId
      // gets changed programatically on initial load and thus calls this method hence this check is required
      if(this.current.facilityTypeId === this.facilityTypeId) {
        return;
      }

      try {
        const resp = await FacilityService.updateFacility({
          facilityId: this.facilityId,
          facilityTypeId: this.facilityTypeId
        })

        if (!hasError(resp)) {
          showToast(translate("Facility type updated"))
          await this.store.dispatch('facility/updateCurrentFacility', { ...this.current, facilityTypeId: this.facilityTypeId, parentFacilityTypeId: this.parentFacilityTypeId })
        } else {
          throw resp.data
        }
      } catch (error) {
        // if api fails then revert the type selection, and also revert the parentTypeSelection
        this.parentFacilityTypeId = this.current.parentFacilityTypeId
        this.facilityTypeId = this.current.facilityTypeId
        showToast(translate('Failed to update facility type.'))
        logger.error('Failed to update facility type.', error)
      }
    },
    async openFacilityLoginActionPopover(ev: Event, facilityUser: any) {
      const popover = await popoverController.create({
        component: FacilityLoginActionPopover,
        componentProps: { currentFacility: this.current, currentFacilityUser: facilityUser, facilityTypeDesc: this.facilityTypes[this.current.facilityTypeId]?.description },
        event: ev,
        showBackdrop: false
      });
      return popover.present()
    },
    async createFacilityLoginModal() {
      const facilityLoginModal = await modalController.create({
      component: CreateFacilityLoginModal,
        componentProps: { currentFacility: this.current, facilityTypeDesc: this.facilityTypes[this.current.facilityTypeId]?.description }
      })
      facilityLoginModal.present()
    },
    getFacilityGroupTypeDesc(groupTypeId: string) {
      return this.facilityGroupTypes.find((groupType: any) => groupType.facilityGroupTypeId === groupTypeId)?.description || groupTypeId
    }
  },
  setup() {
    const store = useStore();

    return {
      addCircleOutline,
      addOutline,
      albumsOutline,
      bookmarkOutline,
      bookmarksOutline,
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
      translate,
      unlinkOutline
    }
  }
});
</script>

<style scoped>

section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: start;
}

.facility-details {
  grid-column: span 2;
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

ion-segment {
  margin-top: var(--spacer-2xl);
  justify-content: start;
  margin-bottom: var(--spacer-lg)
}

.staff {
  --columns-desktop: 5;
  padding-block: var(--spacer-xs);
}

.external-mappings, .facility-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: start; 
}

ion-card > ion-button[expand="block"] {
  margin-inline: var(--spacer-sm);
  margin-bottom: var(--spacer-sm);
}

.actions {
  display: flex;
  justify-content: space-between;
}

@media screen and (min-width: 700px) {

  ion-content > main {
    margin: var(--spacer-lg)
  }
}
</style>
