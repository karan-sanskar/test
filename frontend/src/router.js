// import { createRouter, createWebHistory } from 'vue-router'
// import { session } from './data/session'
// import { userResource } from '@/data/user'

// const routes = [
//   {
//     path: '/',
//     name: 'Home',
//     component: () => import('@/pages/Home.vue'),
//   },
//   {
//     name: 'Login',
//     path: '/account/login',
//     component: () => import('@/pages/Login.vue'),
//   },
// ]

// let router = createRouter({
//   history: createWebHistory('/frontend'),
//   routes,
// })

// router.beforeEach(async (to, from, next) => {
//   let isLoggedIn = session.isLoggedIn
//   try {
//     await userResource.promise
//   } catch (error) {
//     isLoggedIn = false
//   }

//   if (to.name === 'Login' && isLoggedIn) {
//     next({ name: 'Home' })
//   } else if (to.name !== 'Login' && !isLoggedIn) {
//     next({ name: 'Login' })
//   } else {
//     next()
//   }
// })

// export default router

import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { 
    path: '/', 
    name: 'Home',
    component: () => import('./pages/Home.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/webform'),
  routes,
})

export default router
