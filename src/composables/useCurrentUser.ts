import { ref, computed, onMounted } from 'vue'
import { getUsername } from '@/services/auth'
import { fetchAllUsers, type UserResponse } from '@/services/users'

const user = ref<UserResponse | null>(null)
const loading = ref(false)
let loadPromise: Promise<UserResponse | null> | null = null

function isAdminUser(profile: UserResponse | null) {
  if (!profile?.role?.length) return false
  return profile.role.some((role) => {
    const name = role.name?.toUpperCase() ?? ''
    return name === 'ADMIN' || name === 'SUPER_ADMIN' || name.includes('ADMIN')
  })
}

async function loadCurrentUser(force = false) {
  if (!force && user.value) return user.value
  if (!force && loadPromise) return loadPromise

  loadPromise = (async () => {
    loading.value = true
    try {
      const username = getUsername()
      if (!username) {
        user.value = null
        return null
      }
      const users = await fetchAllUsers()
      user.value = users.find((row) => row.username === username && row.status === 'ACTIVE') ?? null
      return user.value
    } catch {
      user.value = null
      return null
    } finally {
      loading.value = false
      loadPromise = null
    }
  })()

  return loadPromise
}

export function useCurrentUser() {
  onMounted(() => {
    if (!user.value) loadCurrentUser()
  })

  return {
    user,
    loading,
    isAdmin: computed(() => isAdminUser(user.value)),
    roleLabel: computed(() => user.value?.role?.map((role) => role.name).join(', ') || ''),
    displayName: computed(() => user.value?.fullName || getUsername() || ''),
    refreshUser: () => loadCurrentUser(true),
    ensureUser: () => loadCurrentUser(),
  }
}
