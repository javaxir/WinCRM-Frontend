import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/services/auth'
import i18n from '@/i18n'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Auth/Login.vue'),
      meta: { titleKey: 'routes.login', public: true },
    },
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Ecommerce.vue'),
      meta: { titleKey: 'routes.dashboard' },
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('../views/Users/UsersList.vue'),
      meta: { titleKey: 'routes.users' },
    },
    {
      path: '/roles',
      name: 'Roles',
      component: () => import('../views/Roles/RolesList.vue'),
      meta: { titleKey: 'routes.roles' },
    },
    {
      path: '/roles/:id/permissions',
      name: 'Role Permissions',
      component: () => import('../views/Roles/RolePermissions.vue'),
      meta: { titleKey: 'routes.rolePermissions' },
    },
    {
      path: '/permissions',
      name: 'Permissions',
      component: () => import('../views/Roles/PermissionsList.vue'),
      meta: { titleKey: 'routes.permissions' },
    },
    {
      path: '/clients',
      name: 'Clients',
      component: () => import('../views/Clients/ClientsList.vue'),
      meta: { titleKey: 'routes.clients' },
    },
    {
      path: '/client-groups',
      name: 'Client Groups',
      component: () => import('../views/ClientGroups/ClientGroupsList.vue'),
      meta: { titleKey: 'routes.clientGroups' },
    },
    {
      path: '/clients/:id',
      name: 'Client Detail',
      component: () => import('../views/Clients/ClientDetail.vue'),
      meta: { titleKey: 'routes.clientDetail' },
    },
    {
      path: '/suppliers',
      name: 'Suppliers',
      component: () => import('../views/Suppliers/SuppliersList.vue'),
      meta: { titleKey: 'routes.suppliers' },
    },
    {
      path: '/suppliers/:id',
      name: 'Supplier Detail',
      component: () => import('../views/Suppliers/SupplierDetail.vue'),
      meta: { titleKey: 'routes.supplierDetail' },
    },
    {
      path: '/unit-types',
      name: 'Unit Types',
      component: () => import('../views/UnitTypes/UnitTypesList.vue'),
      meta: { titleKey: 'routes.unitTypes' },
    },
    {
      path: '/goods-groups',
      name: 'Goods Groups',
      component: () => import('../views/GoodsGroups/GoodsGroupsList.vue'),
      meta: { titleKey: 'routes.goodsGroups' },
    },
    {
      path: '/goods',
      name: 'Goods',
      component: () => import('../views/Goods/GoodsList.vue'),
      meta: { titleKey: 'routes.goods', goodsStatus: 'ACTIVE' },
    },
    {
      path: '/goods/inactive',
      name: 'Inactive Goods',
      component: () => import('../views/Goods/GoodsList.vue'),
      meta: { titleKey: 'routes.inactiveGoods', goodsStatus: 'DISABLED' },
    },
    {
      path: '/goods/:id/info',
      name: 'Goods Detail Info',
      component: () => import('../views/Goods/GoodsDetailInfo.vue'),
      meta: { titleKey: 'routes.goodsDetail' },
    },
    {
      path: '/goods/:id/movements',
      name: 'Goods Detail Movements',
      component: () => import('../views/Goods/GoodsDetailMovements.vue'),
      meta: { titleKey: 'routes.goodsDetail' },
    },
    {
      path: '/goods/:id/stock',
      name: 'Goods Detail Stock',
      component: () => import('../views/Goods/GoodsDetailStock.vue'),
      meta: { titleKey: 'routes.goodsDetail' },
    },
    {
      path: '/warehouses',
      name: 'Warehouses',
      component: () => import('../views/Warehouses/WarehousesList.vue'),
      meta: { titleKey: 'routes.warehouses' },
    },
    {
      path: '/warehouse-orders',
      name: 'Warehouse Orders',
      component: () => import('../views/WarehouseOrders/WarehouseOrdersList.vue'),
      meta: { titleKey: 'routes.warehouseOrders' },
    },
    {
      path: '/warehouse-orders/:orderId/items',
      name: 'Warehouse Order Items',
      component: () => import('../views/WarehouseOrders/WarehouseOrderItemsList.vue'),
      meta: { titleKey: 'routes.warehouseOrderItems' },
    },
    {
      path: '/stocks',
      name: 'Stocks',
      component: () => import('../views/Stocks/StocksList.vue'),
      meta: { titleKey: 'routes.stocks' },
    },
    {
      path: '/stock-histories',
      name: 'Stock Histories',
      component: () => import('../views/StockHistories/StockHistoriesList.vue'),
      meta: { titleKey: 'routes.stockHistories' },
    },
    {
      path: '/inventory-checks',
      name: 'Inventory Checks',
      component: () => import('../views/InventoryChecks/InventoryChecksList.vue'),
      meta: { titleKey: 'routes.inventoryChecks' },
    },
    {
      path: '/stock-transfers',
      name: 'Stock Transfers',
      component: () => import('../views/StockTransfers/StockTransfersList.vue'),
      meta: { titleKey: 'routes.stockTransfers' },
    },
    {
      path: '/sale-orders',
      name: 'Sale Orders',
      component: () => import('../views/SaleOrders/SaleOrdersList.vue'),
      meta: { titleKey: 'routes.saleOrders' },
    },
    {
      path: '/sales/dashboard',
      name: 'Sales Dashboard',
      component: () => import('../views/SaleOrders/SalesDashboard.vue'),
      meta: { titleKey: 'routes.salesDashboard' },
    },
    {
      path: '/sale-orders/:orderId/items',
      name: 'Sale Order Items',
      component: () => import('../views/SaleOrders/SaleOrderItemsList.vue'),
      meta: { titleKey: 'routes.saleOrderItems' },
    },
    {
      path: '/sale-order-items-filter',
      name: 'Sale Order Items Filter',
      component: () => import('../views/SaleOrders/SaleOrderItemsFilterList.vue'),
      meta: { titleKey: 'routes.saleOrderItemsFilter' },
    },
    {
      path: '/payment-types',
      name: 'Payment Types',
      component: () => import('../views/PaymentTypes/PaymentTypesList.vue'),
      meta: { titleKey: 'routes.paymentTypes' },
    },
    {
      path: '/payments',
      name: 'Payments',
      component: () => import('../views/Payments/PaymentsList.vue'),
      meta: { titleKey: 'routes.payments' },
    },
    {
      path: '/expense-categories',
      name: 'Expense Categories',
      component: () => import('../views/Expenses/ExpenseCategoriesList.vue'),
      meta: { titleKey: 'routes.expenseCategories' },
    },
    {
      path: '/expenses',
      name: 'Expenses',
      component: () => import('../views/Expenses/ExpensesList.vue'),
      meta: { titleKey: 'routes.expenses' },
    },
    {
      path: '/company-details',
      name: 'Company Details',
      component: () => import('../views/CompanyDetails/CompanyDetailsPage.vue'),
      meta: { titleKey: 'routes.companyDetails' },
    },
    {
      path: '/sms/debtors',
      name: 'SMS Debtors',
      component: () => import('../views/Sms/DebtorsList.vue'),
      meta: { titleKey: 'routes.smsDebtors' },
    },
    {
      path: '/sms/history',
      name: 'SMS History',
      component: () => import('../views/Sms/SmsHistoryList.vue'),
      meta: { titleKey: 'routes.smsHistory' },
    },
    {
      path: '/reports/users',
      name: 'User Reports',
      component: () => import('../views/Reports/UserReportsList.vue'),
      meta: { titleKey: 'routes.userReports' },
    },
    {
      path: '/reports/users/:userId',
      name: 'User Report Detail',
      component: () => import('../views/Reports/UserReportDetail.vue'),
      meta: { titleKey: 'routes.userReportDetail' },
    },
    {
      path: '/audit-logs',
      name: 'Audit Logs',
      component: () => import('../views/Audit/AuditLogsList.vue'),
      meta: { titleKey: 'routes.auditLogs' },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('../views/Settings/SettingsPage.vue'),
      meta: { titleKey: 'routes.settings' },
    },
    {
      path: '/settings/telegram-bot',
      name: 'Telegram Bot Settings',
      component: () => import('../views/Settings/TelegramBotSettingsPage.vue'),
      meta: { titleKey: 'routes.telegramBot' },
    },
    {
      path: '/settings/eskiz',
      name: 'Eskiz Settings',
      component: () => import('../views/Settings/EskizSettingsPage.vue'),
      meta: { titleKey: 'routes.eskizSettings' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router

router.beforeEach((to, from, next) => {
  const titleKey = to.meta.titleKey as string | undefined
  const pageTitle = titleKey ? i18n.global.t(titleKey) : 'WinCRM-Frontend'
  document.title = `${pageTitle} | ${i18n.global.t('app.name')}`

  const authed = isAuthenticated()

  if (!to.meta.public && !authed) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.name === 'Login' && authed) {
    next({ path: '/' })
    return
  }

  next()
})
