<template>
    <ion-page>
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-back-button default-href="/tabs/find-groups" slot="start" />
          <ion-title>{{ translate("Manage Facilities") }}</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content>
        <div class="find">
          <section class="ion-padding-end search">
            <ion-searchbar :placeholder="translate('Search facilities')" v-model="queryString" @ionInput="getFilteredFacilities()"/>
            <ion-list>
              <ion-list-header>
                <ion-label>{{ translate('Results') }} : {{ filteredFacilities?.length }}</ion-label>
                <ion-button fill="clear" @click="selectAll" :disabled="!filteredFacilities.length">
                  {{ translate('Include all') }}
                  <ion-icon :icon="arrowForwardOutline"/>
                </ion-button>
              </ion-list-header>
              <ion-item v-for="facility in filteredFacilities" :key="facility.facilityId">
                <ion-label >
                  <p>{{ facility.facilityId }}</p>
                  {{ facility.facilityName }}
                </ion-label>
                <ion-button slot="end" fill="clear" color="success" @click="selectFacility(facility)">
                  <ion-icon :icon="addCircleOutline" slot="icon-only"/>
                </ion-button>
              </ion-item>
              <ion-item lines="none">
                <ion-label v-if="!filteredFacilities.length">{{ translate('No facilities available to select') }}</ion-label>
              </ion-item>
            </ion-list>
          </section>
  
          <main v-if="selectedFacilities.length">
            <h3 class="ion-margin-start">{{ translate('Total facilities selected for group', {total: selectedFacilities.length, facilityGroupName: currentFacilityGroup.facilityGroupName ? currentFacilityGroup.facilityGroupName : facilityGroupId}) }}</h3>
            <ion-list>
              <ion-list-header>
                <ion-label>{{ translate('Manage sequence') }}</ion-label>
              </ion-list-header>
              <ion-reorder-group @ionItemReorder="doReorder($event)" :disabled="false">
                <ion-item v-for="facility in selectedFacilities" :key="facility.facilityId">
                  <ion-button slot="start" fill="clear" color="danger" @click="removeFacility(facility)">
                    <ion-icon :icon="removeCircleOutline" slot="icon-only"/>
                  </ion-button>
                  <ion-label>
                    <p>{{ facility.facilityId }}</p>
                    {{ facility.facilityName }}
                  </ion-label>
                  <ion-reorder slot="end"/>
                </ion-item>
              </ion-reorder-group>
            </ion-list> 
          </main>
          <main v-else>
            <p class="empty-state"> {{ translate('No facilities selected.') }}</p>
          </main>
        </div>
        
        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button :disabled="!isFacilityMembersModified" @click="save()">
            <ion-icon :icon="saveOutline" />
          </ion-fab-button>
        </ion-fab>
      </ion-content>
    </ion-page>
  </template>
  
  <script lang="ts">
  import {
    IonBackButton,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonPage,
    IonReorder,
    IonReorderGroup,
    IonSearchbar,
    IonTitle,
    IonToolbar,
    alertController
  } from '@ionic/vue';
  import { defineComponent } from 'vue';
  import { addCircleOutline, arrowForwardOutline, removeCircleOutline, saveOutline } from 'ionicons/icons';
  import { useRouter } from 'vue-router';
  import { useStore } from 'vuex';
  import { translate } from '@hotwax/dxp-components'
  import { showToast } from '@/utils';
  import { FacilityService } from '@/services/FacilityService';
  import { hasError } from '@/adapter';
  import logger from '@/logger';
  import { DateTime } from "luxon";
  import emitter from "@/event-bus";
  
  export default defineComponent({
    name: 'FindGroups',
    components: {
      IonBackButton,
      IonButton,
      IonContent,
      IonFab,
      IonFabButton,
      IonHeader,
      IonIcon,
      IonItem,
      IonLabel,
      IonList,
      IonListHeader,
      IonPage,
      IonReorder,
      IonReorderGroup,
      IonSearchbar,
      IonTitle,
      IonToolbar
    },
    data() {
      return {
        queryString: '',
        facilities: [],
        filteredFacilities: [] as any,
        memberFacilities: [] as any,
        selectedFacilities: [] as any,
        toast: null as any,
        currentFacilityGroup: {} as any,
        isFacilityMembersModified: false,
        isSavingDetail: false
      }
    },
    props: ['facilityGroupId'],
    async ionViewWillEnter() {
      emitter.emit('presentLoader')
      this.isSavingDetail = false
      this.queryString = ''
      await Promise.all([this.fetchFacilities(), this.fetchFacilityGroup()])
      await this.fetchMemberFacilities();
      await this.getFilteredFacilities();
      emitter.emit('dismissLoader')
    },
    async beforeRouteLeave() {
      if (this.isSavingDetail) return;

      let canLeave = false;
      const alert = await alertController.create({
        header: translate("Leave page"),
        message: translate("Any edits made on this page will be lost."),
        buttons: [
          {
            text: translate("STAY"),
            handler: () => {
              canLeave = false;
            },
          },
          {
            text: translate("LEAVE"),
            handler: () => {
              canLeave = true;
            },
          },
        ],
      });

      alert.present()
      await alert.onDidDismiss()
      return canLeave
    },
    methods: {
      getFilteredFacilities() {
        let nonMemberFacilities = this.facilities ? this.facilities : [] as any;
        const selectedFacilityIds = this.selectedFacilities ? new Set(this.selectedFacilities.map((facility:any) => facility.facilityId)) as any : [];
        nonMemberFacilities = this.facilities.filter((facility:any) => !selectedFacilityIds.has(facility.facilityId));
        if (this.queryString) {
          nonMemberFacilities = nonMemberFacilities.filter((facility: any) => (facility.facilityId.toLowerCase().includes(this.queryString.toLowerCase())) || (facility.facilityName && facility.facilityName.toLowerCase().includes(this.queryString.toLowerCase())))
        }
        this.filteredFacilities = nonMemberFacilities;
        return nonMemberFacilities;
      },
      async fetchFacilityGroup() {
        const params = {
          "inputFields": {
            "facilityGroupId": this.facilityGroupId
          },
          entityName: "FacilityGroup",
          noConditionFind: 'Y',
          fieldList: ["facilityGroupId", "facilityGroupTypeId", "facilityGroupName", "description"],
          viewSize: 1
        }

        try {
          const resp = await FacilityService.fetchFacilityGroups(params);

          if (!hasError(resp) && resp.data?.docs?.length > 0) {
            this.currentFacilityGroup = resp.data.docs[0];
          } else {
            throw resp.data
          }
        } catch(err) {
          logger.error('Failed to fetch facility group', err)
        }
      },
      async fetchFacilities() {
        this.facilities = []
        let viewIndex = 0, resp

        try {
          do {
            resp = await FacilityService.fetchFacilities({
              "entityName": "Facility",
              "fieldList": ["facilityId", "facilityName"],
              "viewIndex": viewIndex,
              "viewSize": 250,
              "distinct": "Y",
              "noConditionFind": "Y"
            }) as any;

            if (!hasError(resp) && resp.data.count) {
              this.facilities = this.facilities.concat(resp.data.docs)
              viewIndex++;
            } else {
              throw resp.data;
            }
          }
          while (resp.data.docs.length >= 250);
        } catch (error) {
          logger.error(error);
        }
      },
      async fetchMemberFacilities() {
        this.memberFacilities = []
        let viewIndex = 0, resp

        try {
          let facilityDetail = this.facilities?.reduce((facilityInfo: any, facility: any) => {
            facilityInfo[facility.facilityId] = facility;
            return facilityInfo;
          }, {});

          do {
            resp = await FacilityService.fetchAssociatedFacilitiesToGroup({
              "inputFields": {
                "facilityGroupId": this.facilityGroupId
              },
              "viewIndex": viewIndex,
              "viewSize": 250,
              "entityName": 'FacilityGroupAndMember',
              "noConditionFind": "Y",
              "filterByDate": 'Y',
              "fieldList": ["facilityGroupId", 'facilityId', 'fromDate', 'sequenceNum'],
              "orderBy" : "sequenceNum",

            }) as any;

            if (!hasError(resp) && resp.data.count) {
              const currentMemberFacilities = resp.data.docs.map((memberFacility:any) => {
                let facility = facilityDetail[memberFacility.facilityId];
                if (facility) {
                  memberFacility.facilityName = facility.facilityName;
                }
                return memberFacility;
              });
              this.memberFacilities = this.memberFacilities.concat(currentMemberFacilities)
              viewIndex++;
            } else {
              throw resp.data;
            }
          }
          while (resp.data.docs.length >= 250);
          this.selectedFacilities = JSON.parse(JSON.stringify(this.memberFacilities))
        } catch (error) {
          logger.error(error);
        }
      },
      selectFacility(facility: any) {
        let sequenceNum = 1;
        if (this.selectedFacilities && this.selectedFacilities.length > 0) {
          sequenceNum = this.selectedFacilities?.[this.selectedFacilities?.length - 1].sequenceNum
        }
        sequenceNum = sequenceNum ? sequenceNum + 1 : 1;
        this.selectedFacilities = [...this.selectedFacilities, {...facility, sequenceNum}]
        this.getFilteredFacilities();
        this.isFacilityMembersModified = true;
      },
      selectAll() {
        let sequenceNum = 1;
        if (this.selectedFacilities && this.selectedFacilities.length > 0) {
          sequenceNum = this.selectedFacilities?.[this.selectedFacilities?.length - 1].sequenceNum
        }
        sequenceNum = sequenceNum ? sequenceNum + 1 : 1;

        const facilitiesWithSequences = this.filteredFacilities.map((facility: any, index: any) => {
          facility.sequenceNum = sequenceNum + index;
          return facility;
        });
        
        this.selectedFacilities = [...this.selectedFacilities, ...facilitiesWithSequences]
        this.getFilteredFacilities();
        this.isFacilityMembersModified = true;
      },
      async removeFacility(facility: any) {
        this.selectedFacilities = this.selectedFacilities.filter((selectedFacility: any) => selectedFacility.facilityId !== facility.facilityId);
        this.getFilteredFacilities();
        this.isFacilityMembersModified = true;
      },
      async save () {
        this.isSavingDetail = true
        const memberFacilityIds = this.memberFacilities?.map((facility: any) => facility.facilityId)
        const facilitiesToAdd = this.selectedFacilities.filter((facility: any) => !memberFacilityIds.includes(facility.facilityId))
        const selectedFacilityIds = this.selectedFacilities ? new Set(this.selectedFacilities.map((facility:any) => facility.facilityId)) as any : [];
        const facilitiesToRemove = this.memberFacilities.filter((facility: any) => !selectedFacilityIds.has(facility.facilityId))
        
        const facilitiesToRemoveList = facilitiesToRemove.map((facility: any) => ({
          "facilityGroupId": this.facilityGroupId,
          "facilityId": facility.facilityId,
          "fromDate": facility.fromDate,
          "thruDate": DateTime.now().toMillis()
        }))
        
        const facilitiesToAddList = facilitiesToAdd.map((facility: any) => ({
          "facilityGroupId": this.facilityGroupId,
          "facilityId": facility.facilityId,
          "sequenceNum": facility.sequenceNum
        }))
        
        const facilityIdsToAdd = facilitiesToAdd ? new Set(facilitiesToAdd.map((facility:any) => facility.facilityId)) as any : [];
        const existingFacilityMembers = this.selectedFacilities.filter((facility:any) => !facilityIdsToAdd.has(facility.facilityId))
        const diffMemberFacilitySequencing = existingFacilityMembers.filter((facility: any) => this.memberFacilities.some((memberFacility: any) => memberFacility.facilityId === facility.facilityId && memberFacility.sequenceNum !== facility.sequenceNum))
      
        const memberFacilityDetail = this.memberFacilities.reduce((memberInfo:any, facility:any) => {
          memberInfo[facility.facilityId] = facility;
          return memberInfo;
        }, {})

        const diffMemberFacilitySequencingList = diffMemberFacilitySequencing.map((memberFacility: any) => ({
          "facilityGroupId": this.facilityGroupId,
          "facilityId": memberFacility.facilityId,
          "fromDate": memberFacilityDetail[memberFacility.facilityId].fromDate,
          "sequenceNum": memberFacility.sequenceNum
        }))

        const facilitiesToUpdateList = [...facilitiesToRemoveList, ...diffMemberFacilitySequencingList]
        const requestPayload = []

        if(facilitiesToUpdateList.length > 0){
          requestPayload.push(FacilityService.updateFacilitiesToGroup({ "payload": { "facilityList": facilitiesToUpdateList}}))
        }

        if (facilitiesToAddList.length > 0) {
          requestPayload.push(FacilityService.addFacilitiesToGroup({ "payload": { "facilityList": facilitiesToAddList } }));
        }

        const responses = await Promise.allSettled(requestPayload)
        if(responses.some((response: any) => response.status === 'rejected')){
          showToast(translate("Failed to update some member facilities."))
        } else {
          showToast(translate("Member facilities updated successfully."))
        }
        
        this.isFacilityMembersModified = false;
        this.router.push({ path: `/tabs/find-groups` })
      },
      async doReorder(event: CustomEvent) {
        const previousSeq = JSON.parse(JSON.stringify(this.selectedFacilities))

        // returns the updated sequence after reordering
        const updatedSeq = event.detail.complete(JSON.parse(JSON.stringify(this.selectedFacilities)));

        let diffSeq = this.findMemberFacilitySequenceDiff(previousSeq, updatedSeq)

        const updatedSeqenceNum = previousSeq.map((memberFacility: any) => memberFacility.sequenceNum)
        Object.keys(diffSeq).map((key: any) => {
          diffSeq[key].sequenceNum = updatedSeqenceNum[key]
        })

        diffSeq = Object.keys(diffSeq).map((key) => diffSeq[key])
        this.selectedFacilities = updatedSeq

        if (diffSeq.length && !this.toast) {
          this.isFacilityMembersModified = true;
          showToast(translate("Facilities order has been changed. Click save button to update them."))
        }
      },
      findMemberFacilitySequenceDiff(previousSeq: any, updatedSeq: any) {
        const diffSeq: any = Object.keys(previousSeq).reduce((diff, key) => {
          if (updatedSeq[key].facilityId === previousSeq[key].facilityId && updatedSeq[key].sequenceNum === previousSeq[key].sequenceNum) return diff
          return {
            ...diff,
            [key]: updatedSeq[key]
          }
        }, {})
        return diffSeq;
      },
    },
    setup() {
      const router = useRouter();
      const store = useStore();
  
      return {
        addCircleOutline,
        arrowForwardOutline,
        removeCircleOutline,
        saveOutline,
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
  .search {
    border-right: 1px solid lightgray;
  }
  </style>