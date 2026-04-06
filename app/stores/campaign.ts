import { defineStore } from 'pinia'
import { useSupabaseClient } from '#imports'
import type { Database } from '@/types/database.types'
import type { CampaignForm } from '~/schemas/campaign'

type Campaign = Omit<Database['public']['Tables']['campaigns']['Row'], 'house_rules'> & {
  house_rules: unknown | null
}
type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
type Project = Database['public']['Tables']['projects']['Row']

// Helper function for distance calculation
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dL = ((lat2 - lat1) * Math.PI) / 180
  const dO = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dO / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function campaignMatchesSearch(campaign: Campaign, q: string): boolean {
  return (
    campaign.title.toLowerCase().includes(q) ||
    campaign.system.toLowerCase().includes(q) ||
    (campaign.description?.toLowerCase().includes(q) ?? false)
  )
}

interface CampaignStoreState {
  // Campaign data
  campaigns: Campaign[]
  currentCampaign: Campaign | null

  // Form state
  form: Partial<CampaignForm>
  isEditMode: boolean

  // Image handling
  imageFile: File | null
  imagePreview: string | null
  existingImageUrl: string | null
  shouldDeleteExistingImage: boolean

  // Location
  locationName: string
  resolvedCoords: { lat: number; lng: number } | null

  // Filtering (Grid page)
  searchQuery: string
  modeFilter: string | null
  radiusKm: number
  nearbyOnly: boolean
  userCoords: { lat: number; lng: number } | null

  // Projects
  projects: Project[]

  // UI states
  loading: boolean
  uploading: boolean
  error: string | null
}

export const useCampaignStore = defineStore('campaign', {
  state: (): CampaignStoreState => ({
    campaigns: [],
    currentCampaign: null,

  // Form state
  form: {
    title: '',
    system: '',
    hook: '',
    description: '',
    play_mode: 'remote' as 'remote' | 'in_person' | 'hybrid',
    virtual_platform: undefined as string | undefined,
    frequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly' | 'irregular',
    language: 'Español',
    timezone: undefined as string | undefined,
    duration: undefined as string | undefined,
    location_name: undefined as string | undefined,
    lat: null as number | null,
    lng: null as number | null,
    max_players: 4,
    start_level: 1,
    style_tags: [] as string[],
    house_rules: [] as { title: string; description: string }[],
    project_id: undefined as string | undefined,
    image: undefined as File | undefined,
  },
    isEditMode: false,

    imageFile: null,
    imagePreview: null,
    existingImageUrl: null,
    shouldDeleteExistingImage: false,

    locationName: '',
    resolvedCoords: null,

    searchQuery: '',
    modeFilter: null,
    radiusKm: 5,
    nearbyOnly: false,
    userCoords: null,

    projects: [],

    loading: false,
    uploading: false,
    error: null,
  }),

  getters: {
    showLocation(): boolean {
      return this.form.play_mode === 'in_person' || this.form.play_mode === 'hybrid'
    },

    playModeOptions(): Array<{ label: string; value: string }> {
      return [
        { label: 'Remoto', value: 'remote' },
        { label: 'Presencial', value: 'in_person' },
        { label: 'Híbrido', value: 'hybrid' },
      ]
    },

    projectOptions(): Array<{ label: string; value: string }> {
      return this.projects.map(p => ({ label: p.name, value: p.id }))
    },

    filteredCampaigns(): Campaign[] {
      let list = this.campaigns

      // Search filter
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase()
        list = list.filter(c => campaignMatchesSearch(c, q))
      }

      // Mode filter
      if (this.modeFilter) {
        list = list.filter(c => c.play_mode === this.modeFilter)
      }

      // Proximity filter
      if (this.nearbyOnly && this.userCoords) {
        list = list.filter(c => {
          if (c.play_mode === 'remote') return true
          if (!c.lat || !c.lng) return false
          return distanceKm(this.userCoords!.lat, this.userCoords!.lng, c.lat, c.lng) <= this.radiusKm
        })

        // Sort by distance
        list = [...list].sort((a, b) => {
          if (a.play_mode === 'remote') return 1
          if (b.play_mode === 'remote') return -1
          if (!a.lat || !b.lat) return 0
          return (
            distanceKm(this.userCoords!.lat, this.userCoords!.lng, a.lat!, a.lng!) -
            distanceKm(this.userCoords!.lat, this.userCoords!.lng, b.lat!, b.lng!)
          )
        })
      }

      return list
    },
  },

  actions: {
    // ─── Campaigns ────────────────────────────────────────────────────────────
    getDistance(campaign: Campaign): string | null {
      if (!this.nearbyOnly || !this.userCoords || !campaign.lat || !campaign.lng) return null
      const km = distanceKm(this.userCoords.lat, this.userCoords.lng, campaign.lat, campaign.lng)
      return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km)} km`
    },

    // ─── Campaigns ────────────────────────────────────────────────────────────
    async fetchCampaigns() {
      this.loading = true
      this.error = null
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('campaigns')
          .select('*, profiles!campaigns_profile_fkey(full_name, username, avatar_url)')
          .order('created_at', { ascending: false })

        if (error) throw error
        this.campaigns = (data ?? []) as Campaign[]
      } catch (err: any) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    async fetchCampaignById(id: string) {
      this.loading = true
      this.error = null
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        this.currentCampaign = data as Campaign
        this.existingImageUrl = data.image_url
      } catch (err: any) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    async createCampaign(payload: CampaignInsert) {
      this.loading = true
      this.error = null
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase.from('campaigns').insert(payload)

        if (error) throw error

        // Refresh campaigns list
        await this.fetchCampaigns()

        // Reset form
        this.resetForm()
      } catch (err: any) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateCampaign(id: string, payload: CampaignInsert) {
      this.loading = true
      this.error = null
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('campaigns')
          .update(payload)
          .eq('id', id)

        if (error) throw error

        // Update current campaign
        this.currentCampaign = { ...this.currentCampaign!, ...payload }

        // Reset edit state
        this.isEditMode = false
        this.resetForm()
      } catch (err: any) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteCampaign(id: string) {
      this.loading = true
      this.error = null
      try {
        const supabase = useSupabaseClient()

        // Delete image if exists
        if (this.currentCampaign?.image_url) {
          await this.deleteImageFromBucket(this.currentCampaign.image_url)
        }

        const { error } = await supabase.from('campaigns').delete().eq('id', id)

        if (error) throw error

        // Refresh campaigns list
        this.campaigns = this.campaigns.filter(c => c.id !== id)
        this.currentCampaign = null
      } catch (err: any) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    // ─── Projects ─────────────────────────────────────────────────────────────
    async fetchProjects() {
      this.loading = true
      this.error = null
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase.from('projects').select('id, name')

        if (error) throw error
        this.projects = (data ?? []) as Project[]
      } catch (err: any) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    // ─── Image Handling ───────────────────────────────────────────────────────
    async uploadImage(file: File): Promise<string> {
      this.uploading = true
      this.error = null
      try {
        const supabase = useSupabaseClient()
        const ext = file.name.split('.').pop()
        const { data: { user } } = await supabase.auth.getUser()
        const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error } = await supabase.storage
          .from('campaign-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false })

        if (error) throw new Error(`Error al subir imagen: ${error.message}`)

        const { data } = supabase.storage.from('campaign-images').getPublicUrl(fileName)
        return data.publicUrl
      } catch (err: any) {
        this.error = err.message
        throw err
      } finally {
        this.uploading = false
      }
    },

    async deleteImageFromBucket(imageUrl: string) {
      try {
        const supabase = useSupabaseClient()
        const path = imageUrl.split('/campaign-images/')[1]
        if (path) {
          const { error } = await supabase.storage.from('campaign-images').remove([path])
          if (error) console.warn('Error eliminando imagen:', error)
        }
      } catch (err: any) {
        console.warn('Error eliminando imagen:', err)
      }
    },

    setImage(file: File | null) {
      this.imageFile = file
      if (file) {
        this.imagePreview = URL.createObjectURL(file)
      } else {
        this.imagePreview = null
      }
    },

    removeImage() {
      this.imageFile = null
      if (this.imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(this.imagePreview)
      }
      this.imagePreview = null
      this.shouldDeleteExistingImage = true
    },

    // ─── Form Handling ────────────────────────────────────────────────────────
    setFormField(key: string, value: any) {
      (this.form as any)[key] = value
    },

    setLocation(locationName: string, coords: { lat: number; lng: number } | null) {
      this.locationName = locationName
      this.form.location_name = locationName
      this.resolvedCoords = coords
      if (coords) {
        this.form.lat = coords.lat
        this.form.lng = coords.lng
      }
    },

    setEditMode(campaignId: string) {
      this.isEditMode = true
    },

    resetForm() {
      this.form = {
        title: '',
        system: '',
        hook: '',
        description: '',
        play_mode: 'remote',
        virtual_platform: undefined,
        frequency: undefined,
        language: 'Español',
        timezone: undefined,
        duration: undefined,
        location_name: undefined,
        lat: null,
        lng: null,
        max_players: 4,
        start_level: 1,
        style_tags: [],
        house_rules: [],
        project_id: undefined,
        image: undefined,
      }
      this.imageFile = null
      this.imagePreview = null
      this.existingImageUrl = null
      this.shouldDeleteExistingImage = false
      this.locationName = ''
      this.resolvedCoords = null
      this.isEditMode = false
      this.error = null
    },

    // ─── Filtering (Grid) ─────────────────────────────────────────────────────
    setSearchQuery(query: string) {
      this.searchQuery = query
    },

    setModeFilter(mode: string | null) {
      this.modeFilter = mode
    },

    setRadiusKm(radius: number) {
      this.radiusKm = radius
    },

    setNearbyOnly(value: boolean) {
      this.nearbyOnly = value
    },

    setUserCoords(coords: { lat: number; lng: number } | null) {
      this.userCoords = coords
    },
  },
})
