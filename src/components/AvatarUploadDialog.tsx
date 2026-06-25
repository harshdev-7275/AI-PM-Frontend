import { useCallback, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { ImageUp, Trash2, RefreshCw, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuthStore } from '@/store/useAuthStore'
import { getAvatarUploadUrl, uploadAvatarToR2, updateAvatar } from '@/services/api'
import { getCroppedBlob, pngBlobFromSrc } from '@/lib/cropImage'
import { generatedAvatarUri, randomAvatarSeeds } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

// Accepted source types (must stay within the backend's allowed set) and max
// size for the *original* file the user picks.
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB source; output is cropped & downscaled
const CHARACTER_COUNT = 12

type Tab = 'upload' | 'characters'

interface AvatarUploadDialogProps {
  user:         User
  open:         boolean
  onOpenChange: (open: boolean) => void
}

export function AvatarUploadDialog({ user, open, onOpenChange }: AvatarUploadDialogProps) {
  const setUser = useAuthStore((s) => s.setUser)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('upload')

  // Upload tab state
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop]   = useState({ x: 0, y: 0 })
  const [zoom, setZoom]   = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // Characters tab state
  const [seeds, setSeeds] = useState<string[]>(() => randomAvatarSeeds(CHARACTER_COUNT))
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)

  const reset = useCallback(() => {
    setImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setSelectedSeed(null)
  }, [])

  const handleOpenChange = (next: boolean) => {
    if (busy) return
    if (!next) reset()
    onOpenChange(next)
  }

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please choose a PNG, JPEG, WebP, or GIF image.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 8 MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Upload the produced PNG blob through the shared R2 flow and refresh the user.
  const uploadBlob = async (blob: Blob) => {
    const file = new File([blob], 'avatar.png', { type: 'image/png' })
    const { uploadUrl, key } = await getAvatarUploadUrl(file.type)
    await uploadAvatarToR2(uploadUrl, file)
    const updated = await updateAvatar(key)
    setUser(updated)
  }

  const handleSave = async () => {
    setBusy(true)
    try {
      let blob: Blob
      if (tab === 'upload') {
        if (!imageSrc || !croppedAreaPixels) return
        blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      } else {
        if (!selectedSeed) return
        blob = await pngBlobFromSrc(generatedAvatarUri(selectedSeed))
      }
      await uploadBlob(blob)
      toast.success('Profile photo updated.')
      reset()
      onOpenChange(false)
    } catch {
      toast.error('Could not update photo. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    setBusy(true)
    try {
      const updated = await updateAvatar(null)
      setUser(updated)
      toast.success('Profile photo removed.')
      reset()
      onOpenChange(false)
    } catch {
      toast.error('Could not remove photo. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const canSave = tab === 'upload' ? Boolean(imageSrc) : Boolean(selectedSeed)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update profile photo</DialogTitle>
          <DialogDescription>
            Upload your own image or pick a character.
          </DialogDescription>
        </DialogHeader>

        {/* Current avatar preview */}
        <div className="flex items-center gap-3 rounded-md border border-border p-3">
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            seed={user.id}
            className="size-12"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">Current photo</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-md bg-muted p-1 text-sm">
          {(['upload', 'characters'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded px-3 py-1.5 capitalize transition-colors',
                tab === t ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'upload' ? (
          imageSrc ? (
            <div className="space-y-3">
              <div className="relative h-64 w-full overflow-hidden rounded-md bg-muted">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer accent-primary"
                  aria-label="Zoom"
                />
                <Button variant="outline" size="sm" onClick={() => setImageSrc(null)}>
                  Choose another
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <ImageUp size={28} />
              <span className="text-sm">Click to choose an image</span>
              <span className="text-xs opacity-70">PNG, JPEG, WebP, or GIF · up to 8 MB</span>
            </button>
          )
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {seeds.map((seed) => {
                const selected = seed === selectedSeed
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setSelectedSeed(seed)}
                    className={cn(
                      'relative aspect-square overflow-hidden rounded-full border-2 transition-colors',
                      selected ? 'border-primary' : 'border-transparent hover:border-border',
                    )}
                    aria-pressed={selected}
                  >
                    <img src={generatedAvatarUri(seed)} alt="Avatar option" className="h-full w-full" />
                    {selected && (
                      <span className="absolute bottom-0 right-0 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check size={10} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSeeds(randomAvatarSeeds(CHARACTER_COUNT)); setSelectedSeed(null) }}
            >
              <RefreshCw size={14} />
              Shuffle
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={handleFile}
        />

        <DialogFooter className="gap-2 sm:justify-between">
          {user.avatarUrl ? (
            <Button variant="ghost" onClick={() => void handleRemove()} disabled={busy}>
              <Trash2 size={14} />
              Remove photo
            </Button>
          ) : <span />}
          <Button onClick={() => void handleSave()} disabled={busy || !canSave}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
