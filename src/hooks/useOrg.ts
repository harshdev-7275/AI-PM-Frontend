import { useAuthStore } from '@/store/useAuthStore'
import { useOrgStore } from '@/store/useOrgStore'
import { createOrg as createOrgApi, getUserOrgs } from '@/services/api'
import type { Org } from '@/types'

export function useOrg() {
  const { currentOrg, orgs, isLoading, setCurrentOrg, setOrgs, setLoading } = useOrgStore()

  const createOrg = async (name: string, slug: string): Promise<Org> => {
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) throw new Error('Not authenticated')

    setLoading(true)
    try {
      const org = await createOrgApi(name, slug, accessToken)
      setCurrentOrg(org)
      setOrgs([org])
      return org
    } finally {
      setLoading(false)
    }
  }

  const loadUserOrgs = async (): Promise<void> => {
    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) throw new Error('Not authenticated')

    setLoading(true)
    try {
      const data = await getUserOrgs(accessToken)
      setOrgs(data)
      if (data.length > 0 && data[0]) {
        setCurrentOrg(data[0])
      }
    } finally {
      setLoading(false)
    }
  }

  const switchOrg = (org: Org): void => {
    setCurrentOrg(org)
  }

  return { createOrg, loadUserOrgs, switchOrg, currentOrg, orgs, isLoading }
}
