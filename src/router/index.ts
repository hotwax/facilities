import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import FacilityDetails from '@/views/FacilityDetails.vue';
import store from '@/store'
import { hasPermission } from '@/authorization';
import { showToast } from '@/utils'
import 'vue-router'
import { useAuthStore, DxpLogin, translate } from '@hotwax/dxp-components'
import { loader } from '@/utils/user';
import FacilityManagement from '@/views/FacilityManagement.vue'
import Settings from '@/views/Settings.vue';
import Parking from '@/views/Parking.vue';
import FindFacilities from '@/views/FindFacilities.vue';
import CreateFacility from '@/views/CreateFacility.vue';
import AddFacilityAddress from '@/views/AddFacilityAddress.vue';
import AddFacilityConfig from '@/views/AddFacilityConfig.vue';

// Defining types for the meta values
declare module 'vue-router' {
  interface RouteMeta {
    permissionId?: string;
  }
}

const authGuard = async (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated || !store.getters['user/isAuthenticated']) {
    await loader.present('Authenticating')
    // TODO use authenticate() when support is there
    const redirectUrl = window.location.origin + '/login'
    window.location.href = `${process.env.VUE_APP_LOGIN_URL}?redirectUrl=${redirectUrl}`
    loader.dismiss()
  }
  next()
};

const loginGuard = (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  if (authStore.isAuthenticated && !to.query?.token && !to.query?.oms) {
    next('/')
  }
  next();
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/facility-management'
  },
  {
    path: '/login',
    name: 'Login',
    component: DxpLogin,
    beforeEnter: loginGuard
  },
  {
    path: '/facility-management',
    name: 'FacilityManagement',
    component: FacilityManagement,
    beforeEnter: authGuard
  },
  {
    path: '/find-facilities',
    name: 'FindFacilities',
    component: FindFacilities,
    beforeEnter: authGuard
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
    path: '/parking',
    name: 'Parking',
    component: Parking,
    beforeEnter: authGuard
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    beforeEnter: authGuard
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from) => {
  if (to.meta.permissionId && !hasPermission(to.meta.permissionId)) {
    let redirectToPath = from.path;
    // If the user has navigated from Login page or if it is page load, redirect user to settings page without showing any toast
    if (redirectToPath == "/login" || redirectToPath == "/") redirectToPath = "/settings";
    else showToast(translate('You do not have permission to access this page'));
    return {
      path: redirectToPath,
    }
  }
})

export default router
