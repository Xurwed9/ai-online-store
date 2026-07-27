import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enProducts from './locales/en/products.json'
import enCart from './locales/en/cart.json'
import enOrders from './locales/en/orders.json'
import enProfile from './locales/en/profile.json'
import enDashboard from './locales/en/dashboard.json'
import enErrors from './locales/en/errors.json'
import enChat from './locales/en/chat.json'

import ruCommon from './locales/ru/common.json'
import ruAuth from './locales/ru/auth.json'
import ruProducts from './locales/ru/products.json'
import ruCart from './locales/ru/cart.json'
import ruOrders from './locales/ru/orders.json'
import ruProfile from './locales/ru/profile.json'
import ruDashboard from './locales/ru/dashboard.json'
import ruErrors from './locales/ru/errors.json'
import ruChat from './locales/ru/chat.json'

import tgCommon from './locales/tg/common.json'
import tgAuth from './locales/tg/auth.json'
import tgProducts from './locales/tg/products.json'
import tgCart from './locales/tg/cart.json'
import tgOrders from './locales/tg/orders.json'
import tgProfile from './locales/tg/profile.json'
import tgDashboard from './locales/tg/dashboard.json'
import tgErrors from './locales/tg/errors.json'
import tgChat from './locales/tg/chat.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, products: enProducts, cart: enCart, orders: enOrders, profile: enProfile, dashboard: enDashboard, errors: enErrors, chat: enChat },
      ru: { common: ruCommon, auth: ruAuth, products: ruProducts, cart: ruCart, orders: ruOrders, profile: ruProfile, dashboard: ruDashboard, errors: ruErrors, chat: ruChat },
      tg: { common: tgCommon, auth: tgAuth, products: tgProducts, cart: tgCart, orders: tgOrders, profile: tgProfile, dashboard: tgDashboard, errors: tgErrors, chat: tgChat },
    },
    fallbackLng: 'en',
    ns: ['common', 'auth', 'products', 'cart', 'orders', 'profile', 'dashboard', 'errors', 'chat'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nLanguage',
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  })

export default i18n
