export function Avatar({ name, photo, size = 52, ring = false }: { name: string; photo?: string; size?: number; ring?: boolean }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden bg-sand text-bark flex items-center justify-center font-semibold ${ring ? 'ring-2 ring-milk ring-offset-2 ring-offset-bark' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : initials || '?'}
    </div>
  )
}
