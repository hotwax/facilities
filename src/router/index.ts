import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import FacilityDetails from '@/views/FacilityDetails.vue';
import 'vue-router'
import { useAuth, Login, translate, commonUtil } from '@common'
import CreateFacility from '@/views/CreateFacility.vue';
import AddFacilityAddress from '@/views/AddFacilityAddress.vue';
import AddFacilityConfig from '@/views/AddFacilityConfig.vue';
import Tabs from '@/components/Tabs.vue'
import ManageFacilities from '@/views/ManageFacilities.vue';
import CreateFacilityGroup from '@/views/CreateFacilityGroup.vue';
import { useUserStore } from '@/store/user';

// Defining types for the meta values
declare module 'vue-router' {
  interface RouteMeta {
    permissionId?: string;
  }
}

const authGuard = async () => {
  if (!useAuth().isAuthenticated.value) {
    return { path: '/login' };
  }
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/find-facilities'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/tabs',
    component: Tabs,
    children: [
      {
        path: '',
        redirect: '/tabs/find-facilities'
      }, {
        path: 'find-facilities',
        component: () => import('@/views/FindFacilities.vue'),
      }, {
        path: 'parking',
        component: () => import('@/views/Parking.vue')
      }, {
        path: 'find-groups',
        component: () => import('@/views/FindGroups.vue')
      }, {
        path: 'settings',
        component: () => import('@/views/Settings.vue')
      },
    ],
    beforeEnter: authGuard,
  },
  {
    path: "/facility-details/:facilityId",
    name: "Facility Details",
    component: FacilityDetails,
    props: true,
    beforeEnter: authGuard
  },
  {
    path: "/create-facility",
    name: "Create Facility",
    component: CreateFacility,
    beforeEnter: authGuard
  },
  {
    path: "/add-facility-address/:facilityId",
    name: "Add Facility Address",
    component: AddFacilityAddress,
    props: true,
    beforeEnter: authGuard
  },
  {
    path: "/add-facility-config/:facilityId",
    name: "Add Facility Config",
    component: AddFacilityConfig,
    props: true,
    beforeEnter: authGuard
  },
  {
    path: '/manage-facilities/:facilityGroupId',
    name: 'Manage Facilities',
    component: ManageFacilities,
    props: true,
    beforeEnter: authGuard,
  },
  {
    path: '/create-facility-group',
    name: 'Create Facility Group',
    component: CreateFacilityGroup,
    beforeEnter: authGuard,
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from) => {
  if (to.meta.permissionId && !useUserStore().hasPermission(to.meta.permissionId)) {
    let redirectToPath = from.path;
    // If the user has navigated from Login page or if it is page load, redirect user to settings page without showing any toast
    if (redirectToPath == "/login" || redirectToPath == "/") redirectToPath = "/tabs/settings";
    else commonUtil.showToast(translate('You do not have permission to access this page'));
    return {
      path: redirectToPath,
    }
  }
})

export default router
