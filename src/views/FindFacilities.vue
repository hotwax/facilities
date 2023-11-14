<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Find Users") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="find">
        <section class="search">
          <ion-searchbar :placeholder="translate('Search users')" v-model="query.queryString" @keyup.enter="updateQuery()" />
        </section>

        <aside class="filters">
          <ion-list>
            <ion-item lines="none">
              <ion-icon :icon="idCardOutline" slot="start" />
              <ion-label>{{ translate("Clearance") }}</ion-label>
              <ion-select interface="popover" v-model="query.securityGroup" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option :value="securityGroup.groupId" :key="index" v-for="(securityGroup, index) in securityGroups">{{ securityGroup.groupName }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="toggleOutline" slot="start" />
              <ion-label>{{ translate("Status") }}</ion-label>
              <ion-select interface="popover" v-model="query.status" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option value="Y">{{ translate("Active") }}</ion-select-option>
                <ion-select-option value="N">{{ translate("Inactive") }}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </aside>

        <main v-if="users?.length">
          <div class="list-item" v-for="(user, index) in users" :key="index" @click=viewUserDetails(user.partyId)>
            <ion-item lines="none">
              <ion-label>
                {{ user.groupName ? user.groupName : `${user.firstName} ${user.lastName}` }}
                <p>{{ user.userLoginId }}</p>
                <p>{{ user.infoString }}</p>
              </ion-label>
            </ion-item>

            <div class="tablet">
              <ion-label class="ion-text-center" v-if="user.createdDate">
                {{ getDate(user.createdDate) }}
                <p>{{ translate("created") }}</p>
              </ion-label>
              <ion-label v-else>
                {{ '-' }}
              </ion-label>
            </div>

            <div class="tablet">
              <ion-chip outline v-if="user.securityGroupId">
                <ion-label>{{ user.securityGroupName }}</ion-label>
              </ion-chip>
              <ion-label v-else>
                {{ '-' }}
              </ion-label>
            </div>
          </div>
        </main>
        <main v-else>
          <p class="ion-text-center">{{ translate("No users found") }}</p>
        </main>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" @click="router.push('/create-user')">
        <ion-fab-button>
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

      <ion-infinite-scroll
        @ionInfinite="loadMoreUsers($event)"
        threshold="100px"
        :disabled="!isScrollable"
      >
        <ion-infinite-scroll-content
          loading-spinner="crescent"
          :loading-text="translate('Loading')"
        />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
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
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { defineComponent } from 'vue';
import {
  addOutline,
  ellipsisVerticalOutline,
  idCardOutline,
  toggleOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex';
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: 'FindFacilities',
  components: {
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
    IonPage,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      users: 'user/getUsers',
      securityGroups: 'util/getSecurityGroups',
      query: 'user/getQuery',
      isScrollable: "user/isScrollable"
    })
  },
  // async mounted() {
  //   await this.fetchUsers();
  //   await this.store.dispatch('util/getSecurityGroups')
  // },
  // methods: {
  //   getDate(date: any) {
  //     return DateTime.fromMillis(date).toFormat('dd LLL yyyy')
  //   },
  //   async openUserPopover(ev: Event, user:any) {
  //     const popover = await popoverController.create({
  //       component: UserPopover,
  //       componentProps: { user },
  //       event: ev,
  //       showBackdrop: false,
  //     });
  //     return popover.present();
  //   },
  //   async updateQuery() {
  //     await this.store.dispatch('user/updateQuery', this.query)
  //     this.fetchUsers();
  //   },
  //   async fetchUsers(vSize?: any, vIndex?: any) {
  //     const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
  //     const viewIndex = vIndex ? vIndex : 0;
  //     const payload = {
  //       viewSize,
  //       viewIndex
  //     };
  //     await this.store.dispatch('user/fetchUsers', payload)
  //   },
  //   async viewUserDetails(partyId: string) {
  //     this.router.push({ path: `/user-details/${partyId}` })
  //   },
  //   async loadMoreUsers(event: any) {
  //     this.fetchUsers(
  //       undefined,
  //       Math.ceil(
  //         this.users?.length / (process.env.VUE_APP_VIEW_SIZE as any)
  //       ).toString()
  //     ).then(() => {
  //       event.target.complete();
  //     });
  //   },
  // },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      addOutline,
      ellipsisVerticalOutline,
      idCardOutline,
      toggleOutline,
      translate,
      router,
      store
    };
  }
});
</script>

<style scoped>
.list-item {
  --columns-desktop: 4;
}
</style>