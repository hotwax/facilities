<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Groups") }}</ion-title>
        <ion-segment scrollable v-model="segment" slot="end" @ion-change="resetParentGroupPage()">
          <ion-segment-button value="facility-groups" >
            <ion-label>{{ translate("Facility groups") }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="facility-group-types">
            <ion-label>{{ translate("Parent group associations") }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contentRef" :scroll-events="true" @ionScroll="enableScrolling()" id="filter-content">
      <template v-if="segment === 'facility-groups'">
        <div class="find">
          <section class="search">
            <ion-searchbar :placeholder="translate('Search groups')" v-model="query.queryString" @keyup.enter="updateQuery()" />
          </section>
        </div>
        <main v-if="groups && groups.length > 0">
          <ion-card v-for="(group, index) in customSort(groups, ['OMS_FULFILLMENT', 'PICKUP'], 'facilityGroupId')" :key="index">
            <ion-item lines="full">
              <ion-label class="ion-text-wrap">
                <p>{{ group.facilityGroupId }}</p>
                <h1>{{ group.facilityGroupName }}</h1>
                <p>{{ group.description }}</p>
              </ion-label>
            </ion-item>
            <ion-item lines="full">
              <ion-label>{{ translate('Group type') }}</ion-label>
              <ion-chip outline slot="end" @click="updateGroupTypeModal(group)">
                {{ group.facilityGroupTypeId ? getFacilityGroupTypeDescription(group.facilityGroupTypeId) ? getFacilityGroupTypeDescription(group.facilityGroupTypeId) : group.facilityGroupTypeId : "-" }}
              </ion-chip>
              
            </ion-item>
            <ion-item lines="full">
              <ion-label>{{ translate('Product stores') }}</ion-label>
              <ion-chip outline slot="end" @click="openAddProductStoreToGroupModal(group)">
                {{ group.productStoreCount || 0 }}
              </ion-chip>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate('Facilities') }}</ion-label>
              <ion-chip outline slot="end" @click="manageFacilities(group)">
                {{ group.facilityCount}}
              </ion-chip>
            </ion-item>
            <ion-button fill="clear" @click="updateGroupDescriptionModal(group)">
              {{translate('Edit details')}}
            </ion-button>
          </ion-card>
        </main>
        <main v-else>
          <p class="empty-state">{{ translate("No groups found") }}</p>
        </main>
      </template>
      <template v-else>
        <div class="facility-group-types">
          <section>
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ translate("Parent groups") }}</ion-card-title>
              </ion-card-header>
              <ion-item v-for="groupType in facilityGroupTypes" :key="groupType.facilityGroupId" @click="setCurrentFacilityGroupType(groupType.facilityGroupTypeId)" detail button>
                <ion-label :color="groupType.facilityGroupTypeId === currentFacilityGroupTypeId ? 'primary' : ''">
                  {{ groupType.description ? groupType.description : groupType.facilityGroupTypeId }}
                </ion-label>
                <ion-note slot="end">{{ getAssociatedFacilityGroupIds(groupType.facilityGroupTypeId).length }}</ion-note>
              </ion-item>
            </ion-card>
          </section>
          <div class="facility-group-type-details" v-show="currentFacilityGroupTypeId">
            <h3>{{ getFacilityGroupTypeDescription(currentFacilityGroupTypeId) }}</h3>
            <ion-list v-if="groups.length">
              <ion-list-header>
                <ion-label>{{ translate('Selected groups') }} : 10</ion-label>
              </ion-list-header>
              <ion-item v-for="group in groups" :key="group.facilityGroupId">
                <ion-checkbox label-placement="end" justify="start" :disabled="!!group.facilityGroupTypeId && group.facilityGroupTypeId !== currentFacilityGroupTypeId" :checked="isFacilityGroupLinked(group.facilityGroupTypeId)" @click="updateFacilityGroup($event, group)">
                  <ion-label>
                    {{ group.facilityGroupName }}
                    <p>{{ group.facilityGroupId }}</p>
                  </ion-label>
                </ion-checkbox>
                <ion-note slot="end">{{ group.facilityCount }}</ion-note>
              </ion-item>
            </ion-list> 
            <div v-else>
              <p class="empty-state">{{ translate("No groups found") }}</p>
            </div>
          </div>
        </div>
      </template>
      <ion-infinite-scroll
        @ionInfinite="loadMoreGroups($event)"
        threshold="100px"
        v-show="isScrollable"
        ref="infiniteScrollRef"
      >
        <ion-infinite-scroll-content
          loading-spinner="crescent"
          :loading-text="translate('Loading')"
        />
      </ion-infinite-scroll>

      <ion-fab v-if="segment === 'facility-groups'" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="createFacilityGroup()">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  modalController,
  createAnimation
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { ellipsisVerticalOutline, addOutline, bagHandleOutline, businessOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex';
import { translate } from '@hotwax/dxp-components'
import { customSort, showToast } from '@/utils';
import { FacilityService } from '@/services/FacilityService';
import { hasError } from '@/adapter';
import logger from '@/logger';
import AddProductStoreToGroupModal from '@/components/AddProductStoreToGroupModal.vue';
import GroupTypeModal from "@/components/GroupTypeModal.vue";
import FacilityGroupDescriptionModal from "@/components/FacilityGroupDescriptionModal.vue";

export default defineComponent({
  name: 'FindGroups',
  components: {
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCheckbox,
    IonChip,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonPage,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar
  },
  data() {
    return {
      segment: "facility-groups",
      isScrollingEnabled: false,
      currentFacilityGroupTypeId: "",
      isParentGroupDetailAnimationCompleted: false,
      facilityGroupProductStore: {} as any
    }
  },
  computed: {
    ...mapGetters({
      groups: "facility/getFacilityGroups",
      facilityGroupTypes: "util/getFacilityGroupTypes",
      isScrollable: "facility/isFacilityGroupsScrollable",
      query: "facility/getGroupQuery",
    })
  },
  async mounted() {
    await this.store.dispatch('util/fetchFacilityGroupTypes')
  },
  async ionViewWillEnter() {
    await this.fetchGroups();
    this.isScrollingEnabled = false;
  },
  methods: {
    resetParentGroupPage() {
      if (this.segment === 'facility-groups') {
        this.currentFacilityGroupTypeId = ''
        this.isParentGroupDetailAnimationCompleted = false;
      }
    },
    setCurrentFacilityGroupType(facilityGroupTypeId: string) {
      this.currentFacilityGroupTypeId = facilityGroupTypeId
      if (this.currentFacilityGroupTypeId && !this.isParentGroupDetailAnimationCompleted) {
        this.playAnimation();
        this.isParentGroupDetailAnimationCompleted = true;
      }
    },
    isFacilityGroupLinked(facilityGroupTypeId: any) {
      return this.currentFacilityGroupTypeId === facilityGroupTypeId
    },
    async updateFacilityGroup(event: any, facilityGroup: any) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const isChecked = !event.target.checked;
      try {
        const resp = await FacilityService.updateFacilityGroup({
          "facilityGroupId": facilityGroup.facilityGroupId,
          "facilityGroupTypeId": isChecked ? this.currentFacilityGroupTypeId : ''
        })

        if (!hasError(resp)) {
          const message = isChecked ? "Group associated to parent group." : "Group removed from parent group."
          showToast(translate(message))
          const updatedGroup = this.groups.find((group: any) => group.facilityGroupId === facilityGroup.facilityGroupId)
          updatedGroup.facilityGroupTypeId = isChecked ? this.currentFacilityGroupTypeId : ''
          await this.store.dispatch('facility/updateFacilityGroups', this.groups)
        } else {
          throw resp.data;
        }
      } catch (err) {
        const message = isChecked ? "Failed to associate group to parent group." : "Failed to remove group from parent group."
        logger.error(message, err)
        showToast(translate(message))
      }
    },
    getFacilityGroupTypeDescription (facilityGroupTypeId: string) {
      const facilityGroupType = this.facilityGroupTypes.find(((groupType: any) => groupType.facilityGroupTypeId === facilityGroupTypeId))
      return facilityGroupType?.description ? facilityGroupType?.description : facilityGroupTypeId;
    },
    async updateQuery() {
      await this.store.dispatch('facility/updateGroupQuery', this.query)
      this.fetchGroups();
    },
    async fetchGroups(vSize?: any, vIndex?: any) {
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex
      };
      await this.store.dispatch('facility/fetchFacilityGroups', payload)
    },
    enableScrolling() {
      const parentElement = (this as any).$refs.contentRef.$el
      const scrollEl = parentElement.shadowRoot.querySelector("main[part='scroll']")
      let scrollHeight = scrollEl.scrollHeight, infiniteHeight = (this as any).$refs.infiniteScrollRef.$el.offsetHeight, scrollTop = scrollEl.scrollTop, threshold = 100, height = scrollEl.offsetHeight
      const distanceFromInfinite = scrollHeight - infiniteHeight - scrollTop - threshold - height
      if(distanceFromInfinite < 0) {
        this.isScrollingEnabled = false;
      } else {
        this.isScrollingEnabled = true;
      }
    },
    async loadMoreGroups(event: any) {
      // Added this check here as if added on infinite-scroll component the Loading content does not gets displayed
      if(!(this.isScrollingEnabled && this.isScrollable)) {
        await event.target.complete();
      }
      this.fetchGroups(
        undefined,
        Math.ceil(
          this.groups?.length / (process.env.VUE_APP_VIEW_SIZE as any)
        ).toString()
      ).then(async () => {
        await event.target.complete();
      });
    },
    getAssociatedFacilityGroupIds(facilityGroupTypeId: any) {
      const associatedfacilityGroupIds = [] as any

      this.groups.map((group: any) => {
        if(group.facilityGroupTypeId && group.facilityGroupTypeId === facilityGroupTypeId) {
          associatedfacilityGroupIds.push(group.facilityGroupId)
        }
      })
      return associatedfacilityGroupIds
    },
    createFacilityGroup(){
      this.router.push('/create-facility-group');
    },
    async updateGroupTypeModal(group: any) {
      const updateGroupTypeModal = await modalController.create({
        component: GroupTypeModal,
        componentProps: { facilityGroup: group }
      })

      updateGroupTypeModal.present()
    },
    async updateGroupDescriptionModal(group: any) {
      const facilityLoginModal = await modalController.create({
        component: FacilityGroupDescriptionModal,
        componentProps: { facilityGroup: group }
      })
      facilityLoginModal.present()
    },
    manageFacilities(facilityGroup: any) {
      this.router.push({ path: `/manage-facilities/${facilityGroup.facilityGroupId}`})
    },
    async openAddProductStoreToGroupModal(group: any) {
      const addProductStoreToGroupModal = await modalController.create({
        component: AddProductStoreToGroupModal,
        componentProps: { group }
      })

      addProductStoreToGroupModal.present()
    },
    playAnimation() {
      const typeDetails = document.querySelector('.facility-group-type-details') as Element
      const groupTypes = document.querySelector('.facility-group-types') as Element

      const revealAnimation = createAnimation()
        .addElement(typeDetails)
        .duration(1500)
        .easing('ease')
        .keyframes([
          { offset: 0, flex: '0', opacity: '0' },
          { offset: 0.5, flex: '1', opacity: '0' },
          { offset: 1, flex: '1', opacity: '1' }
        ])

      const gapAnimation = createAnimation()
        .addElement(groupTypes)
        .duration(500)
        .fromTo('gap', '0', 'var(--spacer-2xl)');

      createAnimation()
        .addAnimation([gapAnimation, revealAnimation])
        .play();
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      addOutline,
      bagHandleOutline,
      businessOutline,
      customSort,
      ellipsisVerticalOutline,
      router,
      store,
      translate
    };
  }
});
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}

main:has(ion-card) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  align-items: start;
}

.facility-group-types {
    display: flex;
    justify-content: center;
    align-items: start;
    gap: var(--spacer-2xl);
    max-width: 990px;
    margin: var(--spacer-base) auto 0;
  }

  .facility-group-types > section {
    display: grid;
    grid-template-columns: minmax(400px, 1fr);
    max-width: 50ch;
  }
  .facility-group-type-details {
    flex: 1 0 355px;
    position: sticky;
    top: var(--spacer-lg);
    flex: 1;
  }
  @media (min-width: 991px) {
    .facility-group-type-details {
      width: 0px;
      opacity: 0;
    }
  }
</style>