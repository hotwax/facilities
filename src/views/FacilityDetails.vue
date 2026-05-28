<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/tabs/find-facilities"/>
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
                <ion-select :label="translate('Facility Type')" interface="popover" v-model="parentFacilityTypeId" @ionChange="getFacilityTypesByParentTypeId()">
                  <ion-select-option value="PHYSICAL_STORE">{{ translate('Physical Store') }}</ion-select-option>
                  <ion-select-option value="DISTRIBUTION_CENTER">{{ translate('Distribution Center') }}</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-icon :icon="bookmarksOutline" slot="start"/>
                <ion-select :label="translate('Facility SubType')" interface="popover" v-model="facilityTypeId" @ionChange="updateFacilityType()">
                  <ion-select-option v-for="(type, fTypeId) in facilityTypeIdOptions" :key="fTypeId" :value="fTypeId">{{ type.description ? type.description : fTypeId }}</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item lines="none" class="ion-margin-bottom">
                <ion-icon :icon="lockClosedOutline" slot="start"/>
                <ion-toggle :checked="!!current.closedDate" @click.prevent="closeFacility($event)">{{ translate('Permanently Closed') }}</ion-toggle>
              </ion-item>
            </div>
          </ion-card>
        </div>

        <section>
          <div>
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ translate("Address and contact details") }}
                </ion-card-title>
              </ion-card-header>
              <template v-if="postalAddress?.address1">
                <ion-item lines="full">
                  <ion-label>
                    <h3>{{ postalAddress.toName }}</h3>
                    <h3>{{ postalAddress.address1 }}</h3>
                    <h3>{{ postalAddress.address2 }}</h3>
                    <h3>{{ postalAddress.directions }}</h3>
                    <p class="ion-text-wrap">{{ postalAddress.postalCode ? `${postalAddress.city}, ${postalAddress.postalCode}` : postalAddress.city }}</p>
                    <p class="ion-text-wrap">{{ postalAddress.countryGeoName ? `${postalAddress.stateGeoName}, ${postalAddress.countryGeoName}` : postalAddress.stateGeoName }}</p>
                    <p class="ion-text-wrap" v-if="contactDetails?.telecomNumber?.contactNumber">{{ [contactDetails.telecomNumber.countryCode, contactDetails.telecomNumber.contactNumber].filter(Boolean).join('-') }}</p>
                    <p class="ion-text-wrap" v-if="contactDetails?.emailAddress">{{ contactDetails.emailAddress?.infoString }}</p>
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
              <template v-if="postalAddress?.latitude || postalAddress.latitude == 0">
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
            <ion-item lines="none">
              <ion-label>
                <p class="overline">{{ translate("Selected TimeZone") }}</p>
                {{ current?.facilityTimeZone || '-' }}
                <p v-if="current?.facilityTimeZone">{{ getCurrentTime(current?.facilityTimeZone, dateTimeFormat) }}</p>
              </ion-label>
              <ion-button slot="end" fill="outline" color="dark" @click="openTimeZoneModal">{{ translate(current?.facilityTimeZone ? "Change" : "Add") }}</ion-button>
            </ion-item>
            <ion-card-content>
              {{ translate("Select a saved calendar of store hours or create a new calendar") }}
            </ion-card-content>
            
            <ion-radio-group v-model="selectedCalendarId">
              <ion-item v-for="(calendar, index) in calendars.slice(0,3)" :key="index" lines="none">
                <ion-radio :value="calendar.calendarId">
                  <div class="ion-text-wrap">{{ calendar.description ? calendar.description : calendar.calendarId }}</div>
                </ion-radio>
              </ion-item>
            </ion-radio-group>
            <ion-item button lines="none" v-if="calendars?.length > 3"  @click="addOperatingHours">
              <ion-label> {{ calendars.length - 3 }} {{ translate("Others") }}</ion-label>
              <ion-icon slot="end" :icon="chevronForwardOutline" />
            </ion-item>
            <ion-item button lines="none" @click="addCustomSchedule">
              <ion-label>{{ translate("Custom schedule") }}</ion-label>
              <ion-icon slot="end" color="primary" :icon="addCircleOutline" />
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
                  {{ facilityCalendar.description || facilityCalendar.calendarId }}
                </ion-card-title>
              </div>
              <ion-button color="medium" fill="clear" class="ion-no-padding" @click="openOperatingHoursPopover">
                <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
              </ion-button>
            </ion-card-header>

            <ion-item lines="none">
              <ion-label>
                <p class="overline">{{ translate("Selected TimeZone") }}</p>
                {{ current?.facilityTimeZone || '-'}}
                <p v-if="current?.facilityTimeZone">{{ getCurrentTime(current?.facilityTimeZone, dateTimeFormat) }}</p>
              </ion-label>
              <ion-button @click="openTimeZoneModal" slot="end" fill="outline" color="dark">{{ translate(current?.facilityTimeZone ? "Change" : "Add") }}</ion-button>
            </ion-item>

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
          <div>
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
                <ion-label>{{ getProductStore(store.productStoreId)?.storeName || store.productStoreId }}</ion-label>
                <ion-badge slot="end" v-if="shopifyShopIdForProductStore(store.productStoreId) !== '' && shopifyShopIdForProductStore(store.productStoreId) === current.primaryFacilityGroupId">{{ translate("primary store") }}</ion-badge>
                <ion-button slot="end" fill="clear" color="medium" @click="productStorePopover($event, store)">
                  <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                </ion-button>
              </ion-item>
              <ion-button v-if="!facilityProductStores?.length" expand="block" fill="outline" @click="selectProductStores()">
                {{ translate("Add") }}
                <ion-icon slot="end" :icon="addCircleOutline" />
              </ion-button>
            </ion-card>

            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ translate('Map Link') }}
                </ion-card-title>
              </ion-card-header>

              <ion-card-content>
                {{ translate('Give customers on your website a direct link to this facility on a mapping service like Google Maps.') }}
              </ion-card-content>
              <template v-if="contactDetails?.googleMapUrl?.infoString">
                <ion-item lines="full">
                  <ion-label>{{ contactDetails.googleMapUrl.infoString }}</ion-label>
                </ion-item>
                <div class="actions">
                  <ion-button fill="clear" @click="editMapUrl">
                    {{ translate('Edit') }}
                  </ion-button>
                  <ion-button fill="clear" :href="mapUrl" target="_blank">
                    {{ translate('Preview') }}
                    <ion-icon slot="end" :icon="openOutline" />
                  </ion-button>
                  <ion-button fill="clear" color="danger" @click="deleteMapUrl">
                    {{ translate('Remove') }}
                  </ion-button>
                </div>
              </template>
              <template v-else>
                <ion-button  fill="clear" @click="editMapUrl">
                    {{ translate('Add') }}
                </ion-button>
              </template>
            </ion-card>
          </div>
        </section>

        <section>
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate("Fulfillment Settings") }}
              </ion-card-title>
            </ion-card-header>
            <ion-item>
              <ion-toggle :checked="current.allowPickup" @click.prevent="updateFulfillmentSetting($event, 'PICKUP')">{{ translate("Allow pickup") }}</ion-toggle>
            </ion-item>
            <ion-item>
              <ion-toggle :checked="current.useOMSFulfillment" @click.prevent="updateFulfillmentSetting($event, 'OMS_FULFILLMENT')">{{ translate("Uses native fulfillment app") }}</ion-toggle>
            </ion-item>
            <ion-item>
              <ion-toggle :checked="current.generateShippingLabel" @click.prevent="updateFulfillmentSetting($event, 'AUTO_SHIPPING_LABEL')">{{ translate("Generate shipping labels") }}</ion-toggle>
            </ion-item>
            <ion-item lines="full">
              <ion-input :label="translate('Days to ship')" v-model="defaultDaysToShip" type="number" min="0" :placeholder="translate('days to ship')"/>
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
              <ion-button v-if="current.inventoryGroups?.length" @click="openCreateInventoryGroupModal()" fill="clear">
                <ion-icon :icon="addCircleOutline" slot="end" />
                {{ translate("Add") }}
              </ion-button>
            </ion-card-header>
            <ion-card-content>
              {{ current.inventoryGroups?.length ? translate("Select which channels this facility publishes inventory too.") : translate("There are no inventory channels setup yet") }}
            </ion-card-content>
            <ion-item v-for="inventoryGroup in current.inventoryGroups" :key="inventoryGroup.facilityGroupId">
              <ion-toggle :checked="inventoryGroup.isChecked" @click.prevent="updateSellInventoryOnlineSetting($event, inventoryGroup)">{{ inventoryGroup?.facilityGroupName }}</ion-toggle>
            </ion-item>
            <ion-button v-if="!current.inventoryGroups?.length" expand="block" fill="outline" @click="openCreateInventoryGroupModal()">
              {{ translate("Add") }}
              <ion-icon slot="end" :icon="addCircleOutline" />
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
              <ion-progress-bar class="ion-margin" :value="current.orderCount / (current.maximumOrderLimit || 1)" />
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
                {{ facilityTypes[current.facilityTypeId]?.description ? translate(`${facilityTypes[current.facilityTypeId]?.description} logins`) : translate('logins', { facilitytype:`${current.facilityTypeId}` }) }}
              </ion-card-title>
              <ion-button v-if="current.facilityLogins?.length" @click="createFacilityLoginModal()" fill="clear">
                <ion-icon :icon="addCircleOutline" slot="end" />
                {{ translate("Add") }}
              </ion-button>
            </ion-card-header>
            <ion-item v-for="facilityLogin in current.facilityLogins" :key="facilityLogin.userLoginId">
              <ion-avatar slot="start">
                <Image :src="getImageUrl(facilityLogin.objectInfo)"/>
              </ion-avatar>
              <ion-label>
                {{ facilityLogin.groupName }}
                <p>{{ facilityLogin.partyId }}</p>
                <p>{{ facilityLogin.userLoginId }}</p>
              </ion-label>
              <ion-button slot="end" fill="clear" size="default" color="medium" @click="openFacilityLoginActionPopover($event, facilityLogin)">
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
              <ion-button fill="clear" @click="editShopifyFacilityMapping(shopifyFacilityMapping)" >{{ translate("Edit") }}</ion-button>
              <ion-button fill="clear" color="danger" @click="removeShopifyFacilityMapping(shopifyFacilityMapping)">{{ translate("Remove") }}</ion-button>
            </ion-card>
            <ion-card v-for="(mapping, index) in current.facilityMappings" :key="index">
              <ion-card-header>
                <ion-card-title>
                  {{ externalMappingTypes[mapping.facilityIdenTypeId] }}
                </ion-card-title>
                <ion-button fill="clear" @click="copyToClipboard(mapping.idValue, 'Copied to clipboard')">
                  <ion-icon slot="icon-only" :icon="copyOutline" />
                </ion-button>
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
                <ion-button fill="clear" @click="copyToClipboard(current.externalId, 'Copied to clipboard')">
                  <ion-icon slot="icon-only" :icon="copyOutline" />
                </ion-button>
              </ion-card-header>
              <ion-item lines="full">
                <ion-label>{{ translate('Identification') }}</ion-label>
                <ion-label slot="end">{{ current.externalId }}</ion-label>
              </ion-item>
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
              <p>{{ translate("added") }}</p>
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
              <p v-if="getFacilityGroupTypeDesc(group.facilityGroupTypeId)" class="ion-margin-start overline">{{ getFacilityGroupTypeDesc(group.facilityGroupTypeId) }}</p>
              <ion-card-header>
                <div>
                  <ion-card-title>{{ group.facilityGroupName }}</ion-card-title>
                  <ion-card-subtitle>{{ group.facilityGroupId }}</ion-card-subtitle>
                </div>
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

<script setup lang="ts">
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
  popoverController,
  onIonViewWillEnter
} from '@ionic/vue'
import { 
  addCircleOutline,
  addOutline,
  albumsOutline,
  bookmarkOutline,
  bookmarksOutline,
  closeCircleOutline,
  closeOutline,
  copyOutline,
  chevronForwardOutline,
  ellipsisVerticalOutline,
  globeOutline,
  locationOutline,
  lockClosedOutline,
  openOutline,
  pencilOutline,
  personOutline,
  trashOutline,
  unlinkOutline
} from 'ionicons/icons'
import { ref, computed } from 'vue';
import { commonUtil, translate } from "@common";
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
import { DateTime } from 'luxon';
import logger from '@/logger';
import FacilityShopifyMappingModal from '@/components/FacilityShopifyMappingModal.vue'
import FacilityExternalIdModal from '@/components/FacilityExternalIdModal.vue'
import FacilityMappingModal from '@/components/FacilityMappingModal.vue'
import { copyToClipboard } from '@/utils';
import OperatingHoursPopover from '@/components/OperatingHoursPopover.vue'
import GeoPointPopover from '@/components/GeoPointPopover.vue'
import FacilityLoginActionPopover from '@/components/FacilityLoginActionPopover.vue'
import CreateFacilityLoginModal from '@/components/CreateFacilityLoginModal.vue'
import AddFacilityGroupModal from '@/components/AddFacilityGroupModal.vue'
import Image from '@/components/Image.vue';
import emitter from '@/event-bus'
import CreateFacilityGroupModal from '@/components/CreateFacilityGroupModal.vue';
import FacilityTimeZoneModal from '@/components/FacilityTimeZoneSwitcher.vue'
import { useFacilityStore } from '@/store/facility';
import { useUtilStore } from '@/store/util';
import { useUserStore } from '@/store/user';

const props = defineProps(["facilityId"]);
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();
const userStore = useUserStore();

const isLoading = ref(true);
const segment = ref('external-mappings');
const defaultDaysToShip = ref('');
const selectedCalendarId = ref('');
const isRegenerationRequired = ref(false);
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const facilityTypeId = ref('');
const parentFacilityTypeId = ref('');
const facilityTypeIdOptions = ref({} as any);
const dateTimeFormat = 't ZZZZ';

const calendars = computed(() => utilStore.getCalendars);
const current = computed(() => facilityStore.getCurrent);
const externalMappingTypes = computed(() => utilStore.getExternalMappingTypes);
const facilityCalendar = computed(() => facilityStore.getFacilityCalendar);
const facilityParties = computed(() => facilityStore.getFacilityParties);
const facilityProductStores = computed(() => facilityStore.getFacilityProductStores);
const getProductStore = computed(() => (id: string) => utilStore.getProductStore(id));
const locationTypes = computed(() => utilStore.getLocationTypes);
const partyRoles = computed(() => utilStore.getPartyRoles);
const postalAddress = computed(() => facilityStore.getPostalAddress);
const shopifyShopIdForProductStore = computed(() => (id: string) => utilStore.getShopifyShopIdForProductStore(id));
const facilityTypes = computed(() => utilStore.getFacilityTypes);
const baseUrl = computed(() => commonUtil.getOmsURL());
const facilityGroupTypes = computed(() => utilStore.getFacilityGroupTypes);
const inventoryGroups = computed(() => utilStore.getInventoryGroups);
const contactDetails = computed(() => facilityStore.getTelecomAndEmailAddress);

const mapUrl = computed(() => contactDetails.value?.googleMapUrl?.infoString || '');

onIonViewWillEnter(async () => {
  await Promise.all([utilStore.fetchFacilityGroupTypes(), utilStore.fetchInventoryGroups()]);
  await Promise.all([
    facilityStore.fetchCurrentFacility({ facilityId: props.facilityId }),
    utilStore.fetchExternalMappingTypes(),
    utilStore.fetchLocationTypes(),
    utilStore.fetchPartyRoles(),
    utilStore.fetchFacilityTypes({
      parentTypeId: 'VIRTUAL_FACILITY',
      parentTypeId_not: 'Y',
      facilityTypeId: 'VIRTUAL_FACILITY',
      facilityTypeId_not: 'Y'
    })
  ]);
  await Promise.all([
    facilityStore.fetchFacilityLocations({ facilityId: props.facilityId }),
    facilityStore.fetchFacilityParties({ facilityId: props.facilityId }),
    facilityStore.fetchFacilityMappings({ facilityId: props.facilityId, facilityIdenTypeIds: Object.keys(externalMappingTypes.value) }),
    facilityStore.fetchShopifyFacilityMappings({ facilityId: props.facilityId }),
    facilityStore.getFacilityProductStores({ facilityId: props.facilityId }),
    utilStore.fetchProductStores(),
    facilityStore.fetchFacilityContactDetailsAndTelecom({ facilityId: props.facilityId }),
    utilStore.fetchCalendars(),
    facilityStore.fetchFacilityCalendar({ facilityId: props.facilityId }),
    facilityStore.fetchFacilityLogins({ facilityId: props.facilityId })
  ]);
  
  defaultDaysToShip.value = current.value.defaultDaysToShip;
  isLoading.value = false;
  parentFacilityTypeId.value = current.value.parentFacilityTypeId;
  facilityTypeId.value = current.value.facilityTypeId;
  
  facilityTypeIdOptions.value = parentFacilityTypeId.value ? Object.keys(facilityTypes.value).reduce((acc: any, fId: string) => {
    if (facilityTypes.value[fId].parentTypeId === parentFacilityTypeId.value) {
      acc[fId] = facilityTypes.value[fId];
    }
    return acc;
  }, {}) : facilityTypes.value;

  if (postalAddress.value.latitude) fetchPostalCodeByGeoPoints();
});

function getCurrentTime(zone: string, format = 't ZZZZ') {
  return DateTime.now().setZone(zone).toFormat(format);
}

async function openTimeZoneModal() {
  const modal = await modalController.create({
    component: FacilityTimeZoneModal
  });
  modal.present();
}

async function editMapUrl() {
  const alert = await alertController.create({
    header: translate("Map Link"),
    inputs: [
      {
        name: 'mapUrl',
        type: 'url',
        placeholder: translate("Enter new Map Url"),
        value: contactDetails.value?.googleMapUrl?.infoString || ""
      }
    ],
    buttons: [
      {
        text: translate('Cancel'),
        role: 'cancel'
      },
      {
        text: translate('Save'),
        handler: async (data) => {
          let isValidUrl = true;
          try {
            new URL(data.mapUrl);
          } catch (_) {
            isValidUrl = false;
          }

          if (!isValidUrl) {
            commonUtil.showToast(translate("Please enter a valid URL"));
            return false;
          }

          try {
            const payload = {
              facilityId: props.facilityId,
              infoString: data.mapUrl.trim()
            };

            let resp;
            if (contactDetails.value?.googleMapUrl?.contactMechId) {
              if (data.mapUrl && data.mapUrl !== contactDetails.value?.googleMapUrl?.infoString) {
                resp = await facilityStore.updateFacilityContactMech({
                  ...payload,
                  contactMechId: contactDetails.value.googleMapUrl.contactMechId,
                  contactMechTypeId: "MAP_URL",
                });
              } else {
                return;
              }
            } else {
              resp = await facilityStore.createFacilityContactMech({
                ...payload,
                contactMechTypeId: "MAP_URL",
                contactMechPurposeTypeId: "GOOGLE_MAP_URL"
              });
            }

            if (!commonUtil.hasError(resp)) {
              commonUtil.showToast(translate("Map URL updated successfully"));
              await facilityStore.fetchFacilityContactDetailsAndTelecom({ facilityId: props.facilityId });
            } else {
              throw resp.data;
            }
          } catch (err) {
            logger.error("Failed to update Map URL", err);
            commonUtil.showToast(translate("Failed to update Map URL"));
          }
        }
      }
    ]
  });

  await alert.present();
}

async function deleteMapUrl() {
  try {
    const payload = {
      facilityId: props.facilityId,
      contactMechId: contactDetails.value?.googleMapUrl?.contactMechId
    };
    const resp = await facilityStore.deleteFacilityContactMech(payload);
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Map URL removed successfully.'));
      await facilityStore.fetchFacilityContactDetailsAndTelecom({ facilityId: props.facilityId });
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error('Failed to remove map url.', err);
    commonUtil.showToast(translate('Failed to remove map url.'));
  }
}

function getImageUrl(imageUrl: string) {
  return (baseUrl.value.startsWith('http') ? baseUrl.value.replace(/api\/?/, "") : `https://${baseUrl.value}.hotwax.io/`) + imageUrl;
}

function goToLink(link: string) {
  const url = link.startsWith('http') ? link : `https://${link}`;
  window.open(url, '_blank', 'noopener, noreferrer');
}

async function productStorePopover(ev: Event, store: any) {
  const popover = await popoverController.create({
    component: ProductStorePopover,
    componentProps: {
      currentProductStore: store,
      facilityId: props.facilityId
    },
    event: ev,
    showBackdrop: false
  });

  return popover.present();
}

async function openLatLongPopover(event: Event) {
  const popover = await popoverController.create({
    component: GeoPointPopover,
    componentProps: { facilityId: props.facilityId, isRegenerationRequired: isRegenerationRequired.value },
    event,
    showBackdrop: false
  });

  popover.onDidDismiss().then((result) => {
    if (result?.data?.generatedLatLong) {
      isRegenerationRequired.value = false;
    }
  });

  return popover.present();
}

async function associateCalendarToFacility() {
  emitter.emit('presentLoader');

  try {
    const resp = await facilityStore.associateCalendarToFacility({
      facilityId: props.facilityId,
      calendarId: selectedCalendarId.value,
      fromDate: DateTime.now().toMillis(),
      facilityCalendarTypeId: 'OPERATING_HOURS'
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("Successfully associated calendar to the facility."));
      await facilityStore.fetchFacilityCalendar({ facilityId: props.facilityId });
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate("Failed to associate calendar to the facility."));
    logger.error(err);
  }

  emitter.emit('dismissLoader');
}

async function openAddressModal() {
  const modal = await modalController.create({
    component: FacilityAddressModal,
    componentProps: { facilityId: props.facilityId, facilityName: current.value.facilityName }
  });

  modal.onDidDismiss().then(async (result) => {
    if (result.data?.postalAddress) {
      await fetchPostalCodeByGeoPoints();
    }
  });

  modal.present().then(() => {
    const el = document.querySelector("#inputElement") as any;
    if (el) el.setFocus();
  });
}

async function addCustomSchedule() {
  const modal = await modalController.create({
    component: CustomScheduleModal,
    componentProps: { facilityId: props.facilityId }
  });
  modal.present();
}

async function openGeoPointModal() {
  const modal = await modalController.create({
    component: FacilityGeoPointModal,
    componentProps: { facilityId: props.facilityId }
  });

  modal.onDidDismiss().then(async (result) => {
    if (result.data?.geoPoints) {
      await fetchPostalCodeByGeoPoints();
    }
  });

  modal.present();
}

async function selectProductStores() {
  const modal = await modalController.create({
    component: SelectProductStoreModal,
    componentProps: { selectedProductStores: facilityProductStores.value }
  });

  modal.onDidDismiss().then(async (result: any) => {
    if (result.data && result.data.value) {
      emitter.emit('presentLoader');

      const productStoresToCreate = result.data.value.productStoresToCreate;
      const productStoresToRemove = result.data.value.productStoresToRemove;

      const updatePromises = productStoresToRemove.map((payload: any) => 
        facilityStore.updateProductStoreFacility({
          facilityId: props.facilityId,
          fromDate: facilityProductStores.value.find((store: any) => payload.productStoreId === store.productStoreId).fromDate,
          productStoreId: payload.productStoreId,
          thruDate: DateTime.now().toMillis()
        })
      );

      const createPromises = productStoresToCreate.map((payload: any) => 
        facilityStore.createProductStoreFacility({
          productStoreId: payload.productStoreId,
          facilityId: props.facilityId,
          fromDate: DateTime.now().toMillis(),
        })
      );

      const responses = await Promise.allSettled([...updatePromises, ...createPromises]);
      const hasFailed = responses.some((response: any) => response.status === 'rejected');
      if (hasFailed) {
        commonUtil.showToast(translate("Failed to update some product stores"));
      } else {
        commonUtil.showToast(translate("Product stores updated successfully."));
      }

      await facilityStore.getFacilityProductStores({ facilityId: props.facilityId });
      emitter.emit('dismissLoader');
    }
  });

  modal.present();
}

async function addLocationModal() {
  const modal = await modalController.create({
    component: AddLocationModal
  });
  modal.present();
}

async function addStaffMemberModal() {
  const modal = await modalController.create({
    component: AddStaffMemberModal,
    componentProps: { facilityId: props.facilityId, selectedParties: facilityParties.value }
  });
  modal.present();
}

async function addFacilityGroupModal() {
  const modal = await modalController.create({
    component: AddFacilityGroupModal
  });

  modal.present();

  modal.onDidDismiss().then((result: any) => {
    if (result?.data?.fetchGroups) {
      facilityStore.fetchFacilityAdditionalInformation();
    }
  });
}

async function addOperatingHours() {
  const modal = await modalController.create({
    component: AddOperatingHoursModal,
    componentProps: { facilityId: props.facilityId }
  });
  modal.present();
}

async function openLocationDetailsPopover(ev: Event, location: any) {
  const popover = await popoverController.create({
    component: LocationDetailsPopover,
    componentProps: { location },
    event: ev,
    showBackdrop: false
  });
  return popover.present();
}

async function openExternalMappingPopover(ev: Event) {
  const popover = await popoverController.create({
    component: FacilityMappingPopover,
    event: ev,
    showBackdrop: false
  });
  return popover.present();
}

async function openOperatingHoursPopover(ev: Event) {
  const popover = await popoverController.create({
    component: OperatingHoursPopover,
    componentProps: { facilityId: props.facilityId },
    event: ev,
    showBackdrop: false
  });
  popover.present();
}

function getDate(date: any) {
  return DateTime.fromMillis(date).toFormat('dd LLL yyyy');
}

async function removePartyFromFacility(party: any) {
  emitter.emit('presentLoader');

  try {
    const resp = await facilityStore.removePartyFromFacility({
      facilityId: party.facilityId,
      fromDate: party.fromDate,
      thruDate: DateTime.now().toMillis(),
      partyId: party.partyId,
      roleTypeId: party.roleTypeId
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("Party was removed from facility.", {"partyName": party.fullName, "facilityName": current.value.facilityName}));
      await facilityStore.getFacilityParties({ facilityId: props.facilityId });
    } else {
      throw resp;
    }
  } catch (err) {
    commonUtil.showToast(translate("Failed to remove party from facility."));
    logger.error(err);
  }

  emitter.emit('dismissLoader');
}

async function changeOrderLimitPopover(ev: Event) {
  const popover = await popoverController.create({
    component: OrderLimitPopover,
    event: ev,
    showBackdrop: false,
    componentProps: { fulfillmentOrderLimit: current.value.maximumOrderLimit }
  });
  popover.present();

  const result = await popover.onDidDismiss();
  if (result.data !== undefined && result.data !== current.value.maximumOrderLimit) {
    emitter.emit('presentLoader');
    await updateFacility(result.data, current.value);
    await facilityStore.fetchCurrentFacility({ facilityId: props.facilityId, skipState: true });
    emitter.emit('dismissLoader');
  }
}

async function updateFacility(maximumOrderLimit: number | string, facility: any) {
  try {
    const resp = await facilityStore.updateFacility({
      "facilityId": facility.facilityId,
      maximumOrderLimit: maximumOrderLimit === "" ? null : maximumOrderLimit
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Fulfillment capacity updated successfully for ', { facilityName: facility.facilityName }));
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate('Failed to update fulfillment capacity for ', { facilityName: facility.facilityName }));
    logger.error('Failed to update facility', err);
  }
}

async function closeFacility(event: any) {
  event.stopImmediatePropagation();
  emitter.emit("presentLoader");
  const isChecked = !event.target.checked;

  const closedDate = isChecked ? DateTime.now().toMillis() : "";

  try {
    const resp = await facilityStore.updateFacility({
      "facilityId": current.value.facilityId,
      "closedDate": closedDate
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Facility has been marked as ', { status: isChecked ? 'closed' : 'open' }));
      await facilityStore.updateCurrentFacility({ ...current.value, closedDate });
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate('Failed to update facility.'));
    logger.error('Failed to update facility.', err);
  }
  emitter.emit("dismissLoader");
}

async function openFacilityOrderCountModal() {
  const modal = await modalController.create({
    component: ViewFacilityOrderCountModal,
    componentProps: { facilityId: props.facilityId }
  });
  modal.present();
}

async function updateFulfillmentSetting(event: any, facilityGroupId: string) {
  event.stopImmediatePropagation();
  emitter.emit("presentLoader");
  const isChecked = !event.target.checked;

  try {
    let resp;
    if (isChecked) {
      resp = await useFacilityStore().addFacilityToGroup({
        "facilityId": current.value.facilityId,
        "facilityGroupId": facilityGroupId
      });
    } else {
      const groupInformation = current.value.groupInformation.find((group: any) => group.facilityGroupId === facilityGroupId);
      resp = await facilityStore.updateFacilityToGroup({
        "facilityId": current.value.facilityId,
        "facilityGroupId": facilityGroupId,
        "fromDate": groupInformation.fromDate,
        "thruDate": DateTime.now().toMillis()
      });
    }
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Fulfillment setting updated successfully'));
      await facilityStore.fetchFacilityAdditionalInformation();
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate('Failed to update fulfillment setting'));
    logger.error('Failed to update fulfillment setting', err);
  }
  emitter.emit("dismissLoader");
}

async function updateSellInventoryOnlineSetting(event: any, facilityGroup: any) {
  event.stopImmediatePropagation();
  emitter.emit("presentLoader");
  const isChecked = !event.target.checked;

  try {
    let resp;
    let successMessage;
    if (isChecked) {
      resp = await useFacilityStore().addFacilityToGroup({
        "facilityId": current.value.facilityId,
        "facilityGroupId": facilityGroup.facilityGroupId
      });
      successMessage = translate('is now selling on', { "facilityName": current.value.facilityName, "facilityGroupId": facilityGroup.facilityGroupName });
    } else {
      const groupInformation = current.value.groupInformation.find((group: any) => group.facilityGroupId === facilityGroup.facilityGroupId);
      resp = await facilityStore.updateFacilityToGroup({
        "facilityId": current.value.facilityId,
        "facilityGroupId": facilityGroup.facilityGroupId,
        "fromDate": groupInformation.fromDate,
        "thruDate": DateTime.now().toMillis()
      });
      successMessage = translate('no longer sells on', { "facilityName": current.value.facilityName, "facilityGroupId": facilityGroup.facilityGroupName });
    }
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(successMessage);
      await facilityStore.fetchFacilityAdditionalInformation();
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate('Failed to update sell inventory online setting'));
    logger.error('Failed to update sell inventory online setting', err);
  }
  emitter.emit("dismissLoader");
}

async function removeFacilityFromGroup(facilityGroupId: string) {
  emitter.emit("presentLoader");
  const groupInformation = current.value.groupInformation.find((group: any) => group.facilityGroupId === facilityGroupId);

  try {
    const resp = await facilityStore.updateFacilityToGroup({
      "facilityId": current.value.facilityId,
      "facilityGroupId": facilityGroupId,
      "fromDate": groupInformation.fromDate,
      "thruDate": DateTime.now().toMillis()
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Group unlinked from facility'));
      await facilityStore.fetchFacilityAdditionalInformation();
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate('Failed to unlink group'));
    logger.error('Failed to unlink group', err);
  }
  emitter.emit("dismissLoader");
}

async function updateDefaultDaysToShip() {
  emitter.emit('presentLoader');
  try {
    const payload = {
      facilityId: current.value.facilityId,
      defaultDaysToShip: defaultDaysToShip.value
    };
    const resp = await facilityStore.updateFacility(payload);
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Updated default days to ship'));
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error('Failed to update default days to ship', err);
    commonUtil.showToast(translate('Failed to update default days to ship'));
  }
  emitter.emit('dismissLoader');
}

async function removeFacilityMapping(mapping: any) {
  emitter.emit('presentLoader');
  try {
    const payload = {
      facilityId: current.value.facilityId,
      facilityIdenTypeId: mapping.facilityIdenTypeId,
      fromDate: mapping.fromDate,
      thruDate: DateTime.now().toMillis()
    };
    const resp = await facilityStore.updateFacilityIdentification(payload);
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Removed facility mapping successfully'));
      await facilityStore.fetchFacilityMappings({ facilityId: props.facilityId, facilityIdenTypeIds: Object.keys(externalMappingTypes.value) });
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error('Failed to remove facility mapping', err);
    commonUtil.showToast(translate('Failed to remove facility mapping'));
  }
  emitter.emit('dismissLoader');
}

async function removeFacilityExternalID() {
  emitter.emit('presentLoader');
  try {
    const payload = {
      facilityId: current.value.facilityId,
      externalId: ''
    };
    const resp = await facilityStore.updateFacility(payload);
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Removed facility external ID'));
      await facilityStore.updateCurrentFacility({ ...current.value, externalId: '' });
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error('Failed to remove external id', err);
    commonUtil.showToast(translate('Failed to remove external id'));
  }
  emitter.emit('dismissLoader');
}

async function removeShopifyFacilityMapping(shopifyFacilityMapping: any) {
  try {
    const payload = {
      facilityId: current.value.facilityId,
      shopId: shopifyFacilityMapping.shopId,
      shopifyLocationId: shopifyFacilityMapping.shopifyLocationId,
    };
    const resp = await facilityStore.deleteShopifyShopLocation(payload);
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Removed shopify mapping successfully'));
      await facilityStore.fetchShopifyFacilityMappings({ facilityId: props.facilityId });
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error('Failed to remove shopify mapping', err);
    commonUtil.showToast(translate('Failed to remove shopify mapping'));
  }
}

async function editFacilityMapping(mapping: any) {
  const modal = await modalController.create({
    component: FacilityMappingModal,
    componentProps: { mappingId: mapping.facilityIdenTypeId, mapping, type: 'update' }
  });

  modal.present().then(() => {
    const el = document.querySelector("#inputElement") as any;
    if (el) el.setFocus();
  });
}

async function editFacilityExternalId() {
  const modal = await modalController.create({
    component: FacilityExternalIdModal
  });

  modal.present().then(() => {
    const el = document.querySelector("#inputElement") as any;
    if (el) el.setFocus();
  });
}

async function editShopifyFacilityMapping(shopifyFacilityMapping: any) {
  const modal = await modalController.create({
    component: FacilityShopifyMappingModal,
    componentProps: { shopifyFacilityMapping, type: 'update' }
  });

  modal.present().then(() => {
    const el = document.querySelector("#inputElement") as any;
    if (el) el.setFocus();
  });
}

function getOpenEndTime(startTime: any, capacity: any) {
  const openTime = DateTime.fromFormat(startTime, 'HH:mm:ss').toFormat('HH:mm a');
  const endTime = DateTime.fromMillis(DateTime.fromFormat(startTime, 'HH:mm:ss').toMillis() + capacity).toFormat('hh:mm a');
  return `${openTime} - ${endTime}`;
}

async function fetchPostalCodeByGeoPoints() {
  const payload = {
    json: {
      "query": "*:*",
      "filter": "{!geofilt sfield=location}",
      "params": {
        "pt": `${postalAddress.value.latitude}, ${postalAddress.value.longitude}`,
        "d": "10"
      },
      sort: 'geodist(location, ' + postalAddress.value.latitude + ',' + postalAddress.value.longitude + ') asc',
      "limit": 1
    }
  };

  try {
    const resp = await utilStore.generateLatLong(payload);
    const pCode = postalAddress.value.postalCode;
    const fetchedPostcode = resp.response.docs[0].postcode;
    isRegenerationRequired.value = !(pCode.startsWith('0') ? pCode.substring(1) === fetchedPostcode || pCode === fetchedPostcode : pCode === fetchedPostcode);
  } catch (err) {
    logger.error(err);
  }
}

async function renameFacility() {
  const alert = await alertController.create({
    header: translate("Rename facility"),
    inputs: [{
      name: "facilityName",
      value: current.value.facilityName
    }],
    buttons: [{
      text: translate('Cancel'),
      role: "cancel"
    },
    {
      text: translate('Apply'),
      handler: async (data: any) => {
        if (data.facilityName) {
          emitter.emit('presentLoader');

          try {
            const resp = await facilityStore.updateFacility({
              facilityId: props.facilityId,
              facilityName: data.facilityName
            });

            if (!commonUtil.hasError(resp)) {
              commonUtil.showToast(translate("Facility renamed successfully."));
              await facilityStore.updateCurrentFacility({ ...current.value, facilityName: data.facilityName });
            } else {
              throw resp.data;
            }
          } catch (error) {
            commonUtil.showToast(translate('Failed to rename facility.'));
            logger.error('Failed to rename facility.', error);
          }

          emitter.emit('dismissLoader');
        }
      }
    }]
  });

  await alert.present();
}

function getFacilityTypesByParentTypeId() {
  facilityTypeIdOptions.value = parentFacilityTypeId.value ? Object.keys(facilityTypes.value).reduce((acc: any, fId: string) => {
    if (facilityTypes.value[fId].parentTypeId === parentFacilityTypeId.value) {
      acc[fId] = facilityTypes.value[fId];
    }
    return acc;
  }, {}) : facilityTypes.value;

  if (current.value.parentFacilityTypeId === parentFacilityTypeId.value) {
    return;
  }
  facilityTypeId.value = facilityTypeIdOptions.value['RETAIL_STORE'] ? 'RETAIL_STORE' : facilityTypeIdOptions.value['WAREHOUSE'] ? 'WAREHOUSE' : Object.keys(facilityTypeIdOptions.value)[0];
  updateFacilityType();
}

async function updateFacilityType() {
  try {
    const resp = await facilityStore.updateFacility({
      facilityId: props.facilityId,
      facilityTypeId: facilityTypeId.value
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("Facility type updated"));
      await facilityStore.updateCurrentFacility({ ...current.value, facilityTypeId: facilityTypeId.value, parentFacilityTypeId: parentFacilityTypeId.value });
    } else {
      throw resp.data;
    }
  } catch (error) {
    parentFacilityTypeId.value = current.value.parentFacilityTypeId;
    facilityTypeId.value = current.value.facilityTypeId;
    commonUtil.showToast(translate('Failed to update facility type.'));
    logger.error('Failed to update facility type.', error);
  }
}

async function openFacilityLoginActionPopover(ev: Event, facilityUser: any) {
  const popover = await popoverController.create({
    component: FacilityLoginActionPopover,
    componentProps: { currentFacility: current.value, currentFacilityUser: facilityUser, facilityTypeDesc: facilityTypes.value[current.value.facilityTypeId]?.description },
    event: ev,
    showBackdrop: false
  });
  return popover.present();
}

async function createFacilityLoginModal() {
  const modal = await modalController.create({
  component: CreateFacilityLoginModal,
    componentProps: { currentFacility: current.value, facilityTypeDesc: facilityTypes.value[current.value.facilityTypeId]?.description }
  });
  modal.present();
}

function getFacilityGroupTypeDesc(groupTypeId: string) {
  return facilityGroupTypes.value.find((groupType: any) => groupType.facilityGroupTypeId === groupTypeId)?.description || groupTypeId;
}

async function openCreateInventoryGroupModal() {
  const modal = await modalController.create({
    component: CreateFacilityGroupModal,
    componentProps: { selectedFacilityGroupTypeId: 'CHANNEL_FAC_GROUP' }
  });

  modal.onDidDismiss().then(async () => {
    await utilStore.fetchInventoryGroups();
    const invGroups = JSON.parse(JSON.stringify(inventoryGroups.value));
    invGroups.forEach((group: any) => {
      group['isChecked'] = (current.value.groupInformation?.some((facilityGroup: any) => facilityGroup?.facilityGroupId === group.facilityGroupId));
    });

    await facilityStore.updateCurrentFacility({ ...current.value, inventoryGroups: invGroups });
  });

  modal.present();
}
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
  flex-direction: row;
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
