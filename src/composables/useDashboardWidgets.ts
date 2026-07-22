import { ref, computed } from 'vue'

export type DashboardWidgetId =
  | 'metricSales'
  | 'metricPayments'
  | 'metricExpenses'
  | 'metricQuantity'
  | 'salesChart'
  | 'topProducts'
  | 'topSellers'
  | 'paymentsChart'
  | 'groupSummaryChart'
  | 'expensesChart'
  | 'paymentsList'
  | 'groupSummaryList'
  | 'expensesList'

export interface DashboardWidgetDef {
  key: DashboardWidgetId
  label: string
}

export const DEFAULT_WIDGET_ORDER: DashboardWidgetId[] = [
  'metricSales',
  'metricPayments',
  'metricExpenses',
  'metricQuantity',
  'salesChart',
  'topProducts',
  'topSellers',
  'paymentsChart',
  'groupSummaryChart',
  'expensesChart',
  'paymentsList',
  'groupSummaryList',
  'expensesList',
]

const ORDER_KEY = 'dashboard-widget-order'
const VISIBLE_KEY = 'dashboard-widget-visible'

function loadOrder(): DashboardWidgetId[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY)
    if (!raw) return [...DEFAULT_WIDGET_ORDER]
    const parsed = JSON.parse(raw) as string[]
    const valid = parsed.filter((id): id is DashboardWidgetId =>
      DEFAULT_WIDGET_ORDER.includes(id as DashboardWidgetId),
    )
    const missing = DEFAULT_WIDGET_ORDER.filter((id) => !valid.includes(id))
    if (missing.length === 0) return valid
    const prependIds = missing.filter((id) =>
      ['metricSales', 'metricPayments', 'metricExpenses', 'metricQuantity', 'salesChart'].includes(id),
    )
    const appendIds = missing.filter((id) => !prependIds.includes(id))
    return [...prependIds, ...valid, ...appendIds]
  } catch {
    return [...DEFAULT_WIDGET_ORDER]
  }
}

function loadVisible(): Record<DashboardWidgetId, boolean> {
  const defaults = Object.fromEntries(DEFAULT_WIDGET_ORDER.map((id) => [id, true])) as Record<
    DashboardWidgetId,
    boolean
  >
  try {
    const raw = localStorage.getItem(VISIBLE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Record<string, boolean>
    DEFAULT_WIDGET_ORDER.forEach((id) => {
      if (parsed[id] !== undefined) defaults[id] = parsed[id]
    })
    return defaults
  } catch {
    return defaults
  }
}

export function useDashboardWidgets() {
  const widgetOrder = ref<DashboardWidgetId[]>(loadOrder())
  const visible = ref<Record<DashboardWidgetId, boolean>>(loadVisible())

  const saveOrder = () => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(widgetOrder.value))
  }

  const saveVisible = () => {
    localStorage.setItem(VISIBLE_KEY, JSON.stringify(visible.value))
  }

  const isVisible = (id: DashboardWidgetId) => visible.value[id] !== false

  const toggleWidget = (id: DashboardWidgetId) => {
    visible.value[id] = !visible.value[id]
    saveVisible()
  }

  const draggableOrder = computed({
    get: () => widgetOrder.value.filter((id) => isVisible(id)),
    set: (newVisibleOrder: DashboardWidgetId[]) => {
      const hidden = widgetOrder.value.filter((id) => !isVisible(id))
      widgetOrder.value = [...newVisibleOrder, ...hidden]
      saveOrder()
    },
  })

  const onDragEnd = () => {
    saveOrder()
  }

  const resetWidgets = () => {
    localStorage.removeItem(ORDER_KEY)
    localStorage.removeItem(VISIBLE_KEY)
    widgetOrder.value = [...DEFAULT_WIDGET_ORDER]
    visible.value = Object.fromEntries(DEFAULT_WIDGET_ORDER.map((id) => [id, true])) as Record<
      DashboardWidgetId,
      boolean
    >
  }

  return {
    widgetOrder,
    visible,
    draggableOrder,
    isVisible,
    toggleWidget,
    onDragEnd,
    resetWidgets,
  }
}
